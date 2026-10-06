import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
}

/**
 * Valida (e converte) `req.body` e `req.query` com schemas Zod antes do controller.
 * Se a validação falhar, o ZodError segue para o error-handler, que responde 400.
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  return (req, _res, next) => {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body ?? {});
    }

    if (schemas.query) {
      // No Express 5, `req.query` é um getter somente leitura; por isso
      // definimos uma propriedade própria com o valor já validado.
      Object.defineProperty(req, 'query', {
        value: schemas.query.parse(req.query),
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }

    next();
  };
}
