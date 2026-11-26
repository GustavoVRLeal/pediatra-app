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

/* Mostra a resposta gravada no banco de forma legível, conforme o tipo da pergunta. */
export function formatAnswer(type: QuestionType, answer: string): string {
  if (answer.trim() === '') return 'Não respondida';

  switch (type) {
    case 'BOOLEAN':
      return answer === 'true' ? 'Sim' : answer === 'false' ? 'Não' : answer;
    case 'DATE': {
      const match = answer.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      return match ? `${match[3]}/${match[2]}/${match[1]}` : answer;
    }
    case 'NUMBER':
      return answer.replace('.', ',');
    default:
      return answer;
  }
}
