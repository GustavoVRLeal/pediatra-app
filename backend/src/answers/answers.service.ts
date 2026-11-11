import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnswerDto } from './dto/create-answer.dto';

/* Verifica se a pergunta existe (e pertence ao pediatra) antes de registrar;
   Cadastra uma resposta vinculada a pergunta;
   Permite consultar as respostas de uma pergunta específica.
*/

@Injectable()
export class AnswersService {
  constructor(private prisma: PrismaService) {}

  private async assertQuestionOwner(questionId: string, userId: string) {
    const question = await this.prisma.question.findFirst({
      where: {
        id: questionId,
        form: { patient: { pediatricianId: userId } },
      },
    });

    if (!question) {
      throw new NotFoundException('Pergunta não encontrada');
    }

    return question;
  }

  async create(questionId: string, data: CreateAnswerDto, userId: string) {
    await this.assertQuestionOwner(questionId, userId);

    return this.prisma.answer.create({
      data: {
        answer: data.answer,
        questionId,
      },
    });
  }

  async findByQuestion(questionId: string, userId: string) {
    await this.assertQuestionOwner(questionId, userId);

    return this.prisma.answer.findMany({
      where: { questionId },
    });
  }
}
