const fs = require('fs');
const path = require('path');
const { EventHttpRequest } = require('..');

const EVENT_PLAIN = require('./fixtures/alb-request.json');
const EVENT_BASE64 = require('./fixtures/alb-request-with-base64.json');
const EVENT_EMPTY_BODY = require('./fixtures/alb-request-empty.json');

describe('EventHttpRequest', () => {
  test('deve lançar erro ao tentar inicializar com um evento inválido', () => {
    expect(() => new EventHttpRequest()).toThrow();
    expect(() => new EventHttpRequest({})).toThrow();
    expect(
      () => new EventHttpRequest({
        httpMethod: 'GET',
        path: 'some',
        queryStringParameters: {},
      }),
    ).toThrow();
  });

  test('deve inicializar a partir de um evento do ALB com body json', async () => {
    const request = new EventHttpRequest(EVENT_PLAIN);
    expect(request).not.toBeUndefined();
    expect(request.method).toEqual('POST');
    expect(request.url).toEqual(
      '/v2/fiscal/nfes/lote/emissao?id=bbcb3e49-b3a6-47e4-bc7d-bf4f5313ea9a',
    );
    expect(request.path).toEqual('/v2/fiscal/nfes/lote/emissao');
    expect(request.query).toEqual({ id: 'bbcb3e49-b3a6-47e4-bc7d-bf4f5313ea9a' });
    expect(typeof request.headers).toEqual('object');
    expect(request.getHeader('Content-Type')).toEqual('application/json');
    expect(request.getHeader('Accept')).toEqual('*/*');
    expect(request.getHeader('x-api-key')).toEqual(
      'UGOc3L8CrXK22OC5XuYisQ==:1b2c46ca-fe64-4679-a0b6-c615e394b618',
    );
    expect(request.isJson()).toBeTruthy();
    expect(request.body instanceof Buffer).toBeTruthy();
    expect(request.body.toString()).toEqual('{"name":"lorem"}');
    expect(request.bodyParsed).toEqual(JSON.parse('{"name":"lorem"}'));
  });

  test('deve inicializar a partir de um evento do ALB com body base64', async () => {
    const image = fs.readFileSync(path.join(__dirname, 'fixtures/image.png'));

    const request = new EventHttpRequest(EVENT_BASE64);
    expect(request).not.toBeUndefined();
    expect(request.method).toEqual('POST');
    expect(request.url).toEqual('/admin/upload');
    expect(request.path).toEqual('/admin/upload');
    expect(request.query).toEqual({});
    expect(typeof request.headers).toEqual('object');
    expect(request.getHeader('Content-Type')).toEqual('image/png');
    expect(request.getHeader('Accept')).toEqual('*/*');
    expect(request.isJson()).toBeFalsy();
    expect(request.isContentType('image/png')).toBeTruthy();
    expect(request.body instanceof Buffer).toBeTruthy();
    expect(request.body.toString('base64')).toEqual(image.toString('base64'));
    expect(request.bodyParsed instanceof Buffer).toBeTruthy();
  });

  test('deve inicializar a partir de um evento do ALB com body vazio', async () => {
    const request = new EventHttpRequest(EVENT_EMPTY_BODY);
    expect(request).not.toBeUndefined();
    expect(request.method).toEqual('GET');
    expect(request.url).toEqual('/');
    expect(request.path).toEqual('/');
    expect(request.query).toEqual({});
    expect(typeof request.headers).toEqual('object');
    expect(request.getHeader('Content-Type')).toEqual('application/json');
    expect(request.isJson()).toBeTruthy();
    expect(request.body instanceof Buffer).toBeTruthy();
    expect(request.body.toString('utf8')).toEqual('');
    expect(request.bodyParsed).toEqual('');
  });
});
