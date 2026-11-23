import { QuestionType } from '@prisma/client';

export class CreateQuestionDto {
  question!: string;
  type!: QuestionType;
  required?: boolean; // padrão: false
  order?: number; // padrão: depois da última pergunta do formulário
  options?: string[]; // obrigatório (mínimo 2) quando type = MULTIPLE_CHOICE
}
