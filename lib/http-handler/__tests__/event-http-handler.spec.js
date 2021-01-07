/* eslint-disable no-new */
const url = require('url');
const querystring = require('querystring');
const {
  EventHttpHandler,
  EventHttpRouter,
  EventHttpRequest,
  EventHttpResponse,
  EventHttpErrors,
} = require('..');

function eventRequestGenerator(httpMethod, path, body, headers) {
  const parsedPath = url.parse(path);
  const queryStringParameters = querystring.parse(parsedPath.query);

  return {
    httpMethod,
    path,
    queryStringParameters,
    requestContext: {
      elb: {
        targetGroupArn:
          'arn:aws:elasticloadbalancing:us-east-1:213048282442:targetgroup/alb-lambdas/cc86f5e86dba614b',
      },
    },
    headers: {
      accept: '*/*',
      'content-type': 'application/json',
      host: 'alb-example-2043100370.us-east-1.elb.amazonaws.com',
      'x-api-key': 'UGOc3L8CrXK22OC5XuYisQ==:93d88d065be6433bbbbcf84de3aa7f4a',
      'x-forwarded-for': '191.6.8.195',
      'x-forwarded-port': '80',
      'x-forwarded-proto': 'http',
      ...(headers || {}),
    },
    body: body || 'null',
    isBase64Encoded: false,
  };
}

function assertResponse(
  received,
  statusCode,
  body = null,
  contentType = 'application/json',
  isBase64Encoded = false,
) {
  expect(received.statusCode).toEqual(statusCode);
  expect(received.isBase64Encoded).toEqual(isBase64Encoded);
  expect(received.headers['content-type']).toEqual(contentType);

  if (body) {
    expect(received.body).toEqual(JSON.stringify(body));
  }
}

describe('EventHttpHandler', () => {
  test('deve inicializar um router e request pelo o construtor', async () => {
    const payload = eventRequestGenerator('GET', '/v2/users');
    const request = new EventHttpRequest(payload);
    const router = new EventHttpRouter({ prefix: '/v2' });
    const handler = new EventHttpHandler({ router, request });

    expect(handler).not.toBeUndefined();
    expect(handler.router instanceof EventHttpRouter).toBeTruthy();
    expect(handler.request instanceof EventHttpRequest).toBeTruthy();
    expect(typeof handler.context).toEqual('object');
    expect(handler.context).toEqual({});
  });

  test('deve lançar erro ao configurar um roteador inválido', () => {
    expect(() => {
      new EventHttpHandler({ router: {} });
    }).toThrowError();
  });

  test('deve lançar erro ao executar o handler sem configurar um router', async () => {
    try {
      const router = new EventHttpRouter({ prefix: '/v2' });
      const handler = new EventHttpHandler({ router });
      const response = await handler.handler();
      expect(response).toBeUndefined();
    } catch (err) {
      expect(err).not.toBeNull();
    }
  });

  test('deve lançar erro ao executar o handler sem configurar uma request', async () => {
    try {
      const payload = eventRequestGenerator('GET', '/v2/users');
      const request = new EventHttpRequest(payload);
      const handler = new EventHttpHandler({ request });
      const response = await handler.handler();
      expect(response).toBeUndefined();
    } catch (err) {
      expect(err).not.toBeNull();
    }
  });

  test('deve lançar erro ao configurar uma request inválida', () => {
    expect(() => {
      new EventHttpHandler({ request: {} });
    }).toThrowError();
  });

  test('deve emitir eventos', async () => {
    const payload = eventRequestGenerator('GET', '/v2/admin/custom-response');
    const handler = await EventHttpHandler.from(payload);
    const router = new EventHttpRouter({ prefix: '/v2' });
    const responseBody = { nome: 'lorem' };
    const events = {
      beforeRouteHandler: false,
      beforeResponse: false,
      afterResponse: false,
    };

    Object.keys(events).forEach((key) => handler.on(key, () => {
      events[key] = true;
    }));

    router.get(
      '/admin/custom-response',
      () => new EventHttpResponse({
        statusCode: 201,
        body: responseBody,
      }),
    );

    handler.registerRouter(router);
    const response = await handler.handler();

    Object.keys(events).forEach((key) => expect(events[key]).toBeTruthy());

    assertResponse(response, 201, responseBody);
  });

  test('deve adicionar valores de contexto dinâmicamente', async () => {
    const payload = eventRequestGenerator('GET', '/v2/users');
    const request = new EventHttpRequest(payload);
    const router = new EventHttpRouter({ prefix: '/v2' });
    const handler = new EventHttpHandler();

    handler.request = request;
    handler.router = router;
    handler.registerContext('assinanteId', '12345');
    handler.registerContext('someValue', { id: 123 });

    expect(handler).not.toBeUndefined();
    expect(handler.router instanceof EventHttpRouter).toBeTruthy();
    expect(handler.request instanceof EventHttpRequest).toBeTruthy();

    expect(handler.assinanteId).toBeUndefined();
    expect(handler.someValue).toBeUndefined();
    expect(typeof handler.context).toEqual('object');
    expect(handler.context).toEqual({
      assinanteId: '12345',
      someValue: { id: 123 },
    });
  });

  test('deve processar uma rota retornando um json com status 200', async () => {
    const payload = eventRequestGenerator('GET', '/v2/admin/123456');
    const handler = await EventHttpHandler.from(payload);
    const router = new EventHttpRouter({ prefix: '/v2' });
    const responseBody = [{ id: 1 }];

    router.get('/admin/{id}', () => responseBody);
    handler.registerRouter(router);

    const response = await handler.handler();
    const { request } = handler;

    expect(request).not.toBeUndefined();
    expect(request.resource).toEqual('/v2/admin/{id}');
    expect(request.params).toEqual({ id: '123456' });

    assertResponse(response, 200, responseBody);
  });

  test('deve gerar erro 404 ao não dar match na rota', async () => {
    const payload = eventRequestGenerator('GET', '/v2/admin/404');
    const handler = await EventHttpHandler.from(payload);
    const router = new EventHttpRouter({ prefix: '/v2' });
    router.get('/admin', () => [{ id: 1 }]);
    handler.registerRouter(router);

    const response = await handler.handler();

    assertResponse(response, 404, {
      code: 'NotFoundError',
      message: 'Recurso não localizado',
    });
  });

  test('deve gerar erro 500 para um erro interno', async () => {
    const payload = eventRequestGenerator('GET', '/v2/admin/error');
    const handler = await EventHttpHandler.from(payload);
    const router = new EventHttpRouter({ prefix: '/v2' });

    // eslint-disable-next-line no-undef
    router.get('/admin/error', () => functionNotExists());
    handler.registerRouter(router);

    const response = await handler.handler();

    expect(response).not.toBeUndefined();
    expect(response.statusCode).toEqual(500);
    expect(response.isBase64Encoded).toBeFalsy();
    expect(response.headers['content-type']).toEqual('application/json');
    expect(response.body).toContain('InternalServerError');
  });

  test('deve enviar a resposta do handler router', async () => {
    const payload = eventRequestGenerator('GET', '/v2/admin/custom-response');
    const handler = await EventHttpHandler.from(payload);
    const router = new EventHttpRouter({ prefix: '/v2' });
    const responseBody = { nome: 'lorem' };

    router.get(
      '/admin/custom-response',
      () => new EventHttpResponse({
        statusCode: 201,
        body: responseBody,
      }),
    );

    handler.registerRouter(router);

    const response = await handler.handler();
    assertResponse(response, 201, responseBody);
  });

  test('deve enviar o erro do handler router utilizando o EventHttpErrors', async () => {
    const payload = eventRequestGenerator('GET', '/v2/admin/custom-error');
    const handler = await EventHttpHandler.from(payload);
    const router = new EventHttpRouter({ prefix: '/v2' });
    const { ConflictError } = EventHttpErrors;
    router.get('/admin/custom-error', () => {
      throw ConflictError('Entidade já existe');
    });
    handler.registerRouter(router);

    const response = await handler.handler();

    assertResponse(response, 409, {
      code: 'ConflictError',
      message: 'Entidade já existe',
    });
  });

  test('deve enviar o erro do handler router utilizando pelo nome do error', async () => {
    const payload = eventRequestGenerator('GET', '/v2/admin/custom-error');
    const handler = await EventHttpHandler.from(payload);
    const router = new EventHttpRouter({ prefix: '/v2' });

    router.get('/admin/custom-error', () => {
      // eslint-disable-next-line no-throw-literal
      throw {
        name: 'ForbiddenError',
        message: 'Você não tem permissão',
      };
    });
    handler.registerRouter(router);

    const response = await handler.handler();

    assertResponse(response, 403, {
      code: 'ForbiddenError',
      message: 'Você não tem permissão',
    });
  });

  test('deve chamar o método flush dos objetos registrados no contexto', async () => {
    const mockFlush = { flush: jest.fn() };
    const mockService = { create: jest.fn() };

    const payload = eventRequestGenerator('GET', '/v2/admin');
    const handler = await EventHttpHandler.from(payload);

    handler.registerContext('foo', mockFlush);
    handler.registerContext('service', mockService);

    await handler.flush();

    expect(mockFlush.flush).toBeCalled();
    expect(mockService.create).not.toBeCalled();
  });

  test('deve registrar e executar os middlewares antes do handle da rota', async () => {
    const validMiddleware = jest.fn();
    const invalidaMiddleware = {};

    const payload = eventRequestGenerator('GET', '/v2/admin');
    const handler = await EventHttpHandler.from(payload);

    handler.registerRouter(new EventHttpRouter());
    handler.addMiddleware(validMiddleware);
    handler.addMiddleware(invalidaMiddleware);

    await handler.handler();

    expect(validMiddleware).toHaveBeenCalledTimes(1);
    expect(validMiddleware).toHaveBeenCalledWith({
      context: {},
      request: handler.request,
      route: null,
      router: handler.router,
    });
  });
});
