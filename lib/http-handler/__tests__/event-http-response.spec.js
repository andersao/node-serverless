const fs = require('fs');
const path = require('path');
const http = require('http');
const { EventHttpResponse, response } = require('..');

describe('EventHttpResponse', () => {
  test('não deve ter nenhum atributo enumerável', () => {
    const resp = new EventHttpResponse();
    expect(Object.keys(resp).length).toEqual(0);
  });

  test('deve lançar erro ao tentar definir um statusCode inválido', () => {
    expect(() => new EventHttpResponse({ statusCode: 1000 })).toThrow();
    expect(() => new EventHttpResponse({ statusCode: 'Not Found' })).toThrow();
    expect(() => {
      const resp = new EventHttpResponse();
      resp.statusCode = 3000;
    }).toThrow();
  });

  test('deve criar uma resposta inicializando pelo o construtor', () => {
    const body = { id: 123456 };
    const resp = new EventHttpResponse({
      statusCode: 201,
      body,
    });

    expect(resp).not.toBeUndefined();
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual(JSON.stringify(body));
    expect(resp.getHeader('content-type')).toEqual('application/json');
    expect(resp.isBase64Encoded).toBeFalsy();
  });

  test('deve criar uma resposta 200 com header padrão', () => {
    const body = { id: 123456 };
    const resp = new EventHttpResponse();
    resp.statusCode = 201;
    resp.body = body;

    expect(resp).not.toBeUndefined();
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual(JSON.stringify(body));
    expect(resp.getHeader('content-type')).toEqual('application/json');
    expect(resp.isBase64Encoded).toBeFalsy();
  });

  test('deve criar uma resposta com uma imagem', () => {
    const image = fs.readFileSync(path.join(__dirname, 'fixtures/image.png'));

    const body = image;
    const resp = new EventHttpResponse({
      headers: {
        'content-type': 'image/png',
      },
      isBase64Encoded: true,
    });
    resp.statusCode = 200;
    resp.body = body;

    expect(resp).not.toBeUndefined();
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual(image.toString('base64'));
    expect(resp.getHeader('content-type')).toEqual('image/png');
    expect(resp.isBase64Encoded).toBeTruthy();
  });

  test('deve criar uma resposta com texto plano', () => {
    const resp = new EventHttpResponse({
      headers: {
        'content-type': 'text/plain',
      },
    });
    resp.statusCode = 200;
    resp.body = 'algum texto aqui';

    expect(resp).not.toBeUndefined();
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual('algum texto aqui');
    expect(resp.getHeader('content-type')).toEqual('text/plain');
    expect(resp.isBase64Encoded).toBeFalsy();
  });

  test('deve criar uma resposta com em xml a partir de um buffer', () => {
    const xmlBuffer = Buffer.from('<?xml version="1.0" encoding="UTF-8"?><nfe id="1234567">');
    const resp = new EventHttpResponse({
      headers: {
        'content-type': 'application/xml',
      },
    });
    resp.statusCode = 200;
    resp.body = xmlBuffer;

    expect(resp).not.toBeUndefined();
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual(xmlBuffer.toString('utf-8'));
    expect(resp.getHeader('content-type')).toEqual('application/xml');
    expect(resp.isBase64Encoded).toBeFalsy();
  });

  test('deve formatar a resposta para a integração da Lambda', () => {
    const body = { id: 123456 };
    const resp = new EventHttpResponse({
      statusCode: 201,
      body,
    });
    const lambdaResponse = resp.toLambda();

    expect(resp).not.toBeUndefined();
    expect(lambdaResponse).not.toBeUndefined();

    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual(JSON.stringify(body));
    expect(resp.getHeader('content-type')).toEqual('application/json');
    expect(resp.isBase64Encoded).toBeFalsy();

    expect(lambdaResponse.statusCode).toEqual(201);
    expect(lambdaResponse.body).toEqual(JSON.stringify(body));
    expect(lambdaResponse.headers['content-type']).toEqual('application/json');
    expect(lambdaResponse.isBase64Encoded).toBeFalsy();
  });

  test('deve criar uma resposta através do helper', async () => {
    const resp200 = response(200, { id: 1 });
    const resp201 = response(201, null, { location: '/v2/id' });
    const resp404 = response(404, { error: 'não encontrado' });
    const resp204 = response(204);

    expect(resp200 instanceof EventHttpResponse).toBeTruthy();
    expect(resp200.statusCode).toEqual(200);
    expect(resp200.body).toEqual(JSON.stringify({ id: 1 }));

    expect(resp201 instanceof EventHttpResponse).toBeTruthy();
    expect(resp201.statusCode).toEqual(201);

    expect(resp404 instanceof EventHttpResponse).toBeTruthy();
    expect(resp404.statusCode).toEqual(404);
    expect(resp404.body).toEqual(JSON.stringify({ error: 'não encontrado' }));

    expect(resp204 instanceof EventHttpResponse).toBeTruthy();
    expect(resp204.statusCode).toEqual(204);
  });

  test('deve validar aceitar todos os statusCodes válidos', () => {
    try {
      Object.keys(http.STATUS_CODES)
        .map((code) => parseInt(code, 10))
        .forEach((code) => {
          const resp = new EventHttpResponse({ statusCode: code });
          expect(resp.statusCode).toEqual(code);
        });
    } catch (error) {
      expect(error).toBeNull();
    }
  });
});
