import { QuestionType } from '@prisma/client';

export class CreateQuestionDto {
  question!: string;
  type!: QuestionType;
  required!: boolean;
  order!: number;
}
