import { API_URL } from '@/config';

/* Erro com o status HTTP, para as telas saberem, por exemplo, quando o token expirou (401). */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
}

/* Chamada genérica à API: adiciona o token JWT e converte erros em mensagens legíveis. */
export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, token }: RequestOptions = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      `Não foi possível conectar ao servidor (${API_URL}). Verifique se o backend está rodando e se o celular está na mesma rede.`,
      0,
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join('\n')
      : (data?.message ?? 'Erro inesperado');
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export function login(email: string, password: string) {
  return apiRequest<{ access_token: string }>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}
