/* Comunicação com o backend (rotas públicas, sem JWT). */

// Endereço da API. Pode ser alterado criando um arquivo .env com VITE_API_URL=...
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type QuestionType =
  | 'TEXT'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'DATE'
  | 'MULTIPLE_CHOICE';

export interface PublicQuestion {
  id: string;
  question: string;
  type: QuestionType;
  required: boolean;
  order: number;
  options: string[];
}

export interface PublicForm {
  id: string;
  title: string;
  description: string | null;
  status: string;
  questions: PublicQuestion[];
}

/* Busca o formulário pelo token do link público */
export async function getPublicForm(token: string): Promise<PublicForm> {
  const response = await fetch(
    `${API_URL}/public/forms/${encodeURIComponent(token)}`,
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? 'Não foi possível carregar o formulário');
  }

  return response.json();
}
