/* Dados enviados pelo responsável ao preencher o formulário público. */
export class SubmitAnswerDto {
  questionId!: string;
  answer!: string | number | boolean;
}

export class SubmitResponseDto {
  answers!: SubmitAnswerDto[];
}
