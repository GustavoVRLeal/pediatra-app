import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';

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
}
