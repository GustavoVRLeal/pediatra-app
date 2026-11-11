import { QuestionType } from '@prisma/client';

/* Todos os campos são opcionais: envia-se apenas o que for alterado. */
export class UpdateQuestionDto {
  question?: string;
  type?: QuestionType;
  required?: boolean;
  order?: number;
  options?: string[];
}
