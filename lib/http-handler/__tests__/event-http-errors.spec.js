const { EventHttpErrors } = require('..');

describe('Http Errors', () => {
  test('deve gerar uma resposta com error 400', () => {
    const response = EventHttpErrors.BadRequestError('Requisição inválida');
    expect(response).not.toBeNull();
    expect(response.statusCode).toEqual(400);
    expect(response.statusDescription).toEqual('400 Bad Request');
    expect(response.body).toEqual(
      JSON.stringify({
        code: 'BadRequestError',
        message: 'Requisição inválida',
      }),
    );
  });

  test('deve gerar uma resposta com error 404', () => {
    const response = EventHttpErrors.NotFoundError('Usuário não encontrado');
    expect(response).not.toBeNull();
    expect(response.statusCode).toEqual(404);
    expect(response.statusDescription).toEqual('404 Not Found');
    expect(response.body).toEqual(
      JSON.stringify({
        code: 'NotFoundError',
        message: 'Usuário não encontrado',
      }),
    );
  });

  test('deve gerar uma resposta com error 500', () => {
    const response = EventHttpErrors.InternalServerError('Erro interno');
    expect(response).not.toBeNull();
    expect(response.statusCode).toEqual(500);
    expect(response.statusDescription).toEqual('500 Internal Server Error');
    expect(response.body).toEqual(
      JSON.stringify({
        code: 'InternalServerError',
        message: 'Erro interno',
      }),
    );
  });
});
