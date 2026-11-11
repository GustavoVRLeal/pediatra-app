import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { randomBytes } from 'crypto';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { FormStatus, QuestionType } from '@prisma/client';
import { SubmitResponseDto } from './dto/submit-response.dto';

/* Status em que o formulário aceita preenchimentos pelo link público.
   ANSWERED continua aceitando para permitir vários preenchimentos. */
const PUBLIC_STATUSES: FormStatus[] = ['SENT', 'ANSWERED'];

@Injectable()
export class FormsService {
  constructor(private prisma: PrismaService) {}

  /* Garante que o formulário pertence a um paciente do pediatra autenticado.
     Usado antes de qualquer operação administrativa sobre o formulário. */
  async assertOwner(formId: string, userId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, patient: { pediatricianId: userId } },
    });

    if (!form) {
      throw new NotFoundException('Formulário não encontrado');
    }

    return form;
  }

  async create(data: CreateFormDto, userId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: data.patientId, pediatricianId: userId },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    return this.prisma.form.create({
      data: {
        title: data.title,
        description: data.description,
        patientId: data.patientId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.form.findMany({
      where: { patient: { pediatricianId: userId } },
      include: {
        patient: true,
      },
    });
  }

  async findOne(id: string, userId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id, patient: { pediatricianId: userId } },
      include: {
        patient: true,
        questions: {
          include: {
            answers: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!form) {
      throw new NotFoundException('Formulário não encontrado');
    }

    return form;
  }

  async update(id: string, userId: string, data: UpdateFormDto) {
    await this.assertOwner(id, userId);

    // Só título e descrição podem ser alterados por aqui
    // (status, publicToken e patientId não são aceitos do body)
    return this.prisma.form.update({
      where: {
        id,
      },
      data: {
        title: data.title,
        description: data.description,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.assertOwner(id, userId);

    return this.prisma.form.delete({
      where: {
        id,
      },
    });
  }

  async generatePublicLink(id: string, userId: string) {
    await this.assertOwner(id, userId);

    const publicToken = randomBytes(32).toString('hex');

    const updatedForm = await this.prisma.form.update({
      where: { id },
      data: {
        publicToken,
        status: 'SENT',
      },
    });

    return {
      message: 'Link público gerado com sucesso',
      // PUBLIC_FORM_URL no .env aponta para o web-form (ex.: http://localhost:5173/formulario)
      publicLink: `${process.env.PUBLIC_FORM_URL ?? 'http://localhost:3000/public/forms'}/${updatedForm.publicToken}`,
    };
  }

  async findByPublicToken(token: string) {
    const form = await this.prisma.form.findUnique({
      where: {
        publicToken: token,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        questions: {
          orderBy: {
            order: 'asc',
          },
          select: {
            id: true,
            question: true,
            type: true,
            required: true,
            order: true,
            options: true,
          },
        },
      },
    });

    if (!form || !PUBLIC_STATUSES.includes(form.status)) {
      throw new NotFoundException('Formulário não encontrado ou indisponível');
    }

    return form;
  }

  /* Recebe um preenchimento do responsável: valida as respostas e cria
     um FormResponse com todas as Answers vinculadas, numa única operação. */
  async submitResponse(token: string, data: SubmitResponseDto) {
    const form = await this.findByPublicToken(token);

    if (!data || !Array.isArray(data.answers)) {
      throw new BadRequestException('O campo "answers" deve ser uma lista');
    }

    const questionsById = new Map(form.questions.map((q) => [q.id, q]));
    const answered = new Map<string, string>();

    for (const item of data.answers) {
      const question = questionsById.get(item?.questionId);

      if (!question) {
        throw new BadRequestException(
          `Pergunta ${item?.questionId} não pertence a este formulário`,
        );
      }

      if (answered.has(question.id)) {
        throw new BadRequestException(
          `Pergunta "${question.question}" respondida mais de uma vez`,
        );
      }

      const value = this.normalizeAnswer(item.answer);

      // Resposta vazia em pergunta opcional é simplesmente ignorada
      if (value === '') continue;

      const parsed = this.parseForType(question.type, value, question.options);

      if (parsed === null) {
        throw new BadRequestException(
          `Resposta inválida para "${question.question}" (tipo ${question.type})`,
        );
      }

      answered.set(question.id, parsed);
    }

    const missing = form.questions.filter(
      (q) => q.required && !answered.has(q.id),
    );

    if (missing.length > 0) {
      throw new BadRequestException(
        `Perguntas obrigatórias não respondidas: ${missing
          .map((q) => q.question)
          .join(', ')}`,
      );
    }

    const [response] = await this.prisma.$transaction([
      this.prisma.formResponse.create({
        data: {
          formId: form.id,
          answers: {
            create: [...answered].map(([questionId, answer]) => ({
              questionId,
              answer,
            })),
          },
        },
        include: { answers: true },
      }),
      this.prisma.form.update({
        where: { id: form.id },
        data: { status: 'ANSWERED' },
      }),
    ]);

    return {
      message: 'Respostas enviadas com sucesso',
      responseId: response.id,
      submittedAt: response.submittedAt,
      totalAnswers: response.answers.length,
    };
  }

  /* Histórico de preenchimentos de um formulário (área do pediatra).
     Mais recentes primeiro; respostas na ordem das perguntas. */
  async findResponses(formId: string, userId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, patient: { pediatricianId: userId } },
      select: { id: true, title: true, status: true },
    });

    if (!form) {
      throw new NotFoundException('Formulário não encontrado');
    }

    const responses = await this.prisma.formResponse.findMany({
      where: { formId },
      orderBy: { submittedAt: 'desc' },
      include: this.responseInclude,
    });

    return {
      form,
      totalResponses: responses.length,
      responses: responses.map((r) => this.formatResponse(r)),
    };
  }

  /* Um preenchimento específico do formulário */
  async findResponse(formId: string, responseId: string, userId: string) {
    const response = await this.prisma.formResponse.findFirst({
      where: {
        id: responseId,
        formId,
        form: { patient: { pediatricianId: userId } },
      },
      include: this.responseInclude,
    });

    if (!response) {
      throw new NotFoundException('Preenchimento não encontrado');
    }

    return this.formatResponse(response);
  }

  private readonly responseInclude = {
    answers: {
      orderBy: { question: { order: 'asc' as const } },
      include: {
        question: { select: { question: true, type: true, order: true } },
      },
    },
  };

  private formatResponse(response: {
    id: string;
    submittedAt: Date;
    answers: {
      questionId: string;
      answer: string;
      question: { question: string; type: QuestionType; order: number };
    }[];
  }) {
    return {
      id: response.id,
      submittedAt: response.submittedAt,
      answers: response.answers.map((a) => ({
        questionId: a.questionId,
        order: a.question.order,
        question: a.question.question,
        type: a.question.type,
        answer: a.answer,
      })),
    };
  }

  /* Converte a resposta para texto (o banco armazena Answer.answer como String). */
  private normalizeAnswer(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    throw new BadRequestException('Formato de resposta inválido');
  }

  /* Valida a resposta conforme o tipo da pergunta e devolve o valor
     padronizado para gravar no banco, ou null se for inválida. */
  private parseForType(
    type: QuestionType,
    value: string,
    options: string[] = [],
  ): string | null {
    switch (type) {
      case 'NUMBER': {
        const num = Number(value.replace(',', '.'));
        return Number.isNaN(num) ? null : String(num);
      }
      case 'BOOLEAN': {
        const v = value.toLowerCase();
        if (['true', 'sim', 's', 'verdadeiro', '1'].includes(v)) return 'true';
        if (['false', 'não', 'nao', 'n', 'falso', '0'].includes(v)) return 'false';
        return null;
      }
      case 'DATE':
        return /^\d{4}-\d{2}-\d{2}/.test(value) &&
          !Number.isNaN(Date.parse(value))
          ? value
          : null;
      case 'MULTIPLE_CHOICE': {
        // Aceita a opção sem diferenciar maiúsculas e grava o texto oficial
        const match = options.find(
          (o) => o.toLowerCase() === value.toLowerCase(),
        );
        return match ?? null;
      }
      case 'TEXT':
      default:
        return value;
    }
  }
}
