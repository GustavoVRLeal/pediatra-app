import { QuestionType } from '@prisma/client';

export class CreateQuestionDto {
  question!: string;
  type!: QuestionType;
  required!: boolean;
  order!: number;
  options?: string[]; // obrigatório (mínimo 2) quando type = MULTIPLE_CHOICE
}
