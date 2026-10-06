export interface ErrorDetail {
  field: string;
  message: string;
}

/**
 * Erro "esperado" da aplicação: já carrega o status HTTP e uma mensagem
 * que pode ser mostrada ao usuário. Os services lançam estes erros e o
 * error-handler os converte em `{ statusCode, message, details? }`.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: ErrorDetail[]) {
    super(400, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autenticado') {
    super(401, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado') {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}

/** A requisição é válida, mas viola uma regra de negócio (ex.: saldo insuficiente). */
export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super(422, message);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string) {
    super(429, message);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string) {
    super(503, message);
  }
}
