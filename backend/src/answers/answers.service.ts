import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnswerDto } from './dto/create-answer.dto';

/* Verifica se a pergunta existe antes de registrar;
   Cadastra uma resposta vinculada a pergunta;
   Permite consultar as respostas de uma pergunta específica. 
*/

@Injectable()
export class AnswersService {
  constructor(private prisma: PrismaService) {}

  async create(questionId: string, data: CreateAnswerDto) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException('Pergunta não encontrada');
    }

    return this.prisma.answer.create({
      data: {
        answer: data.answer,
        questionId,
      },
    });
  }

  async findByQuestion(questionId: string) {
    return this.prisma.answer.findMany({
      where: { questionId },
    });
  }
}