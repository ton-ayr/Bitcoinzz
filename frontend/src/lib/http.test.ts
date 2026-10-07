import { describe, expect, it } from 'vitest';
import { ApiError, parseApiResponse } from './http';

describe('parseApiResponse', () => {
  it('devolve o JSON quando a resposta é de sucesso', async () => {
    await expect(parseApiResponse(Response.json({ balance: 87.5 }))).resolves.toEqual({
      balance: 87.5,
    });
  });

  it('erro da API vira ApiError com status, mensagem e detalhes por campo', async () => {
    const response = Response.json(
      {
        statusCode: 400,
        message: 'Dados inválidos',
        details: [{ field: 'amount', message: 'O valor deve ser maior que zero' }],
      },
      { status: 400 },
    );

    const error = await parseApiResponse(response).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, message: 'Dados inválidos' });
    expect((error as ApiError).fieldMessage('amount')).toBe('O valor deve ser maior que zero');
    expect((error as ApiError).fieldMessage('email')).toBeUndefined();
  });

  it('resposta de erro sem JSON (ex.: proxy fora) recebe mensagem genérica', async () => {
    const error = await parseApiResponse(new Response('<html>502</html>', { status: 502 })).catch(
      (caught: unknown) => caught,
    );
    expect(error).toMatchObject({
      status: 502,
      message: 'Não foi possível concluir a operação. Tente novamente.',
    });
  });
});
