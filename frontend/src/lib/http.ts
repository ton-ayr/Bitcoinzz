export interface ApiErrorDetail {
  field: string;
  message: string;
}

const FALLBACK_MESSAGE = 'Não foi possível concluir a operação. Tente novamente.';

/** Erro vindo da API, no formato `{ statusCode, message, details? }`. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Mensagem do campo (para mostrar embaixo do input do formulário). */
  fieldMessage(field: string): string | undefined {
    return this.details.find((detail) => detail.field === field)?.message;
  }
}

const CONNECTION_ERROR = 'Não foi possível conectar. Verifique sua internet e tente novamente.';

/** Mensagem para o usuário: a da API (ex.: "Saldo insuficiente…") ou a de falha de conexão. */
export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : CONNECTION_ERROR;
}

/** Lê a resposta: devolve o JSON se deu certo; senão, lança `ApiError` com a mensagem da API. */
export async function parseApiResponse<T>(response: Response): Promise<T> {
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (body ?? {}) as { message?: unknown; details?: unknown };
    throw new ApiError(
      response.status,
      typeof error.message === 'string' ? error.message : FALLBACK_MESSAGE,
      Array.isArray(error.details) ? (error.details as ApiErrorDetail[]) : [],
    );
  }

  return body as T;
}
