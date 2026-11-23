import type { FormStatus, QuestionType } from '@/types';

/* Rótulo e cores de cada status do formulário, usados nos "badges". */
export const formStatusInfo: Record<FormStatus, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Rascunho', color: '#5b6878', bg: '#eef1f5' },
  SENT: { label: 'Enviado', color: '#2a7ab8', bg: '#e6f0f8' },
  ANSWERED: { label: 'Respondido', color: '#1e8449', bg: '#e8f6ee' },
  CLOSED: { label: 'Encerrado', color: '#c0392b', bg: '#fdecea' },
};

/* Nome de cada tipo de pergunta em português */
export const questionTypeLabel: Record<QuestionType, string> = {
  TEXT: 'Texto',
  NUMBER: 'Número',
  BOOLEAN: 'Sim/Não',
  DATE: 'Data',
  MULTIPLE_CHOICE: 'Múltipla escolha',
};
