import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QuestionType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async create(formId: string, data: CreateQuestionDto) {
    return this.prisma.question.create({
      data: {
        question: data.question,
        type: data.type,
        required: data.required,
        order: data.order,
        options: this.resolveOptions(data.type, data.options),
        formId,
      },
    });
  }

  async findByForm(formId: string) {
    return this.prisma.question.findMany({
      where: {
        formId,
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  /* Edita uma pergunta. Se ela já tiver respostas, o tipo não pode mudar,
     para não invalidar o histórico de preenchimentos. */
  async update(formId: string, questionId: string, data: UpdateQuestionDto) {
    const question = await this.findInForm(formId, questionId);

    const changes: UpdateQuestionDto = {};

    if (data.question !== undefined) {
      if (typeof data.question !== 'string' || data.question.trim() === '') {
        throw new BadRequestException('O texto da pergunta não pode ser vazio');
      }
      changes.question = data.question.trim();
    }

    if (data.type !== undefined) {
      if (!Object.values(QuestionType).includes(data.type)) {
        throw new BadRequestException(
          `Tipo inválido. Use: ${Object.values(QuestionType).join(', ')}`,
        );
      }
      if (data.type !== question.type && question._count.answers > 0) {
        throw new ConflictException(
          'Não é possível alterar o tipo de uma pergunta que já possui respostas',
        );
      }
      changes.type = data.type;
    }

    if (data.required !== undefined) {
      if (typeof data.required !== 'boolean') {
        throw new BadRequestException('"required" deve ser true ou false');
      }
      changes.required = data.required;
    }

    if (data.order !== undefined) {
      if (!Number.isInteger(data.order) || data.order < 0) {
        throw new BadRequestException('"order" deve ser um número inteiro');
      }
      changes.order = data.order;
    }

    // Opções: recalculadas quando o tipo ou as próprias opções mudam
    if (data.options !== undefined || data.type !== undefined) {
      const finalType = changes.type ?? question.type;
      const options = this.resolveOptions(
        finalType,
        data.options ?? (finalType === 'MULTIPLE_CHOICE' ? question.options : []),
      );

      // Não remover opções que já foram escolhidas em preenchimentos anteriores
      if (finalType === 'MULTIPLE_CHOICE' && question._count.answers > 0) {
        const used = await this.prisma.answer.findMany({
          where: { questionId },
          select: { answer: true },
          distinct: ['answer'],
        });
        const removed = used
          .map((a) => a.answer)
          .filter((a) => !options.includes(a));

        if (removed.length > 0) {
          throw new ConflictException(
            `Não é possível remover opções já respondidas: ${removed.join(', ')}`,
          );
        }
      }

      changes.options = options;
    }

    return this.prisma.question.update({
      where: { id: questionId },
      data: changes,
    });
  }

  /* Exclui uma pergunta. Perguntas com respostas são preservadas
     para não apagar o histórico do paciente. */
  async remove(formId: string, questionId: string) {
    const question = await this.findInForm(formId, questionId);

    if (question._count.answers > 0) {
      throw new ConflictException(
        'Não é possível excluir uma pergunta que já possui respostas',
      );
    }

    await this.prisma.question.delete({ where: { id: questionId } });

    return { message: 'Pergunta excluída com sucesso' };
  }

  /* Valida as opções conforme o tipo e devolve a lista que será gravada.
     MULTIPLE_CHOICE exige ao menos 2 opções distintas; os demais tipos não têm opções. */
  private resolveOptions(type: QuestionType, options?: string[]): string[] {
    const hasOptions = Array.isArray(options) && options.length > 0;

    if (type !== 'MULTIPLE_CHOICE') {
      if (hasOptions) {
        throw new BadRequestException(
          '"options" só pode ser usado em perguntas MULTIPLE_CHOICE',
        );
      }
      return [];
    }

    if (
      !Array.isArray(options) ||
      options.some((o) => typeof o !== 'string' || o.trim() === '')
    ) {
      throw new BadRequestException(
        'Perguntas MULTIPLE_CHOICE exigem "options": uma lista de textos não vazios',
      );
    }

    const cleaned = options.map((o) => o.trim());
    const unique = new Set(cleaned.map((o) => o.toLowerCase()));

    if (cleaned.length < 2) {
      throw new BadRequestException('Informe pelo menos 2 opções');
    }
    if (unique.size !== cleaned.length) {
      throw new BadRequestException('As opções não podem se repetir');
    }

    return cleaned;
  }

  /* Busca a pergunta garantindo que ela pertence ao formulário informado */
  private async findInForm(formId: string, questionId: string) {
    const question = await this.prisma.question.findFirst({
      where: { id: questionId, formId },
      include: { _count: { select: { answers: true } } },
    });

    if (!question) {
      throw new NotFoundException('Pergunta não encontrada neste formulário');
    }

    return question;
  }
}
