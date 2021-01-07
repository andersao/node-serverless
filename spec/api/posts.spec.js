const { handler } = require('../../index');
const { eventRequestGenerator } = require('../helper');
const entityFactory = require('../factories').postFactory;
const { connection } = require('../../config/db');

describe('API: /posts', () => {
  const headers = {
    'x-api-key': 'some-test-api-key',
  };

  beforeAll(async () => {
    await connection('posts').update('deletedAt', new Date());
  });

  afterAll(async () => {
    await connection.destroy();
  });

  beforeEach(async () => {
    await connection('posts').update('deletedAt', new Date());
  });

  test('deve criar um registro', async () => {
    const data = await entityFactory.data();
    const event = eventRequestGenerator(
      'POST',
      '/api/v1/posts',
      JSON.stringify(data),
      headers,
    );

    const response = await handler(event);

    expect(response).not.toBeUndefined();
    expect(response.statusCode).toEqual(201);

    const body = JSON.parse(response.body);
    const [entity] = await connection('posts')
      .where('id', body.id)
      .whereNull('deletedAt')
      .limit(1);

    expect(entity.titulo).toEqual(data.titulo);
    expect(entity.conteudo).toEqual(data.conteudo);
    expect(entity.autor).toEqual(data.autor);

    expect(body.titulo).toEqual(data.titulo);
    expect(body.conteudo).toEqual(data.conteudo);
    expect(body.autor).toEqual(data.autor);
    expect(body.createdAt).toBeUndefined();
    expect(body.updatedAt).toBeUndefined();
    expect(body.deletedAt).toBeUndefined();
  });

  test('deve obter um registro', async () => {
    const entity = await entityFactory.create(connection);
    const event = eventRequestGenerator(
      'GET',
      `/api/v1/posts/${entity.id}`,
      null,
      headers,
    );

    const response = await handler(event);

    expect(response).not.toBeUndefined();
    expect(response.statusCode).toEqual(200);

    const body = JSON.parse(response.body);

    expect(body.titulo).toEqual(entity.titulo);
    expect(body.conteudo).toEqual(entity.conteudo);
    expect(body.autor).toEqual(entity.autor);
    expect(body.createdAt).toBeUndefined();
    expect(body.updatedAt).toBeUndefined();
    expect(body.deletedAt).toBeUndefined();
  });

  test('deve retornar 404 para um registro inexistente', async () => {
    const event = eventRequestGenerator(
      'GET',
      '/api/v1/posts/2e053297-4638-4b75-8a5c-cb7bb1df1035',
      null,
      headers,
    );
    const response = await handler(event);
    expect(response).not.toBeUndefined();
    expect(response.statusCode).toEqual(404);
  });

  test('deve validar a ausência de dados na criação', async () => {
    const event = eventRequestGenerator(
      'POST',
      '/api/v1/posts',
      JSON.stringify({}),
      headers,
    );
    const response = await handler(event);

    expect(response).not.toBeUndefined();
    expect(response.statusCode).toEqual(422);

    const body = JSON.parse(response.body);
    expect(body.code).toEqual('UnprocessableEntityError');
    expect(body.message).toEqual('Erro na validação dos dados');
    expect(body.reasons).not.toBeUndefined();
    expect(Array.isArray(body.reasons)).toBeTruthy();
  });

  test('deve atualizar um registro', async () => {
    const entity = await entityFactory.create(connection);
    const event = eventRequestGenerator(
      'PUT',
      `/api/v1/posts/${entity.id}`,
      JSON.stringify({
        id: entity.id,
        titulo: 'Patrícia e Eloá Lorem Ipsum',
        conteudo: entity.conteudo,
        autor: 'Patrícia e Eloá',
      }),
      headers,
    );

    const response = await handler(event);

    expect(response).not.toBeUndefined();
    expect(response).not.toBeNull();
    expect(response.statusCode).toEqual(200);

    const [entityUpdated] = await connection('posts')
      .where('id', entity.id)
      .whereNull('deletedAt')
      .limit(1);

    expect(entityUpdated.titulo).toEqual('Patrícia e Eloá Lorem Ipsum');
    expect(entityUpdated.conteudo).toEqual(entity.conteudo);
    expect(entityUpdated.autor).toEqual('Patrícia e Eloá');
  });

  test('deve deletar parceiro lógicamente', async () => {
    const entity = await entityFactory.create(connection);
    const event = eventRequestGenerator(
      'DELETE',
      `/api/v1/posts/${entity.id}`,
      null,
      headers,
    );
    const response = await handler(event);

    expect(response).not.toBeUndefined();
    expect(response).not.toBeNull();
    expect(response.statusCode).toEqual(204);
    expect(response.body).toEqual('');

    const entities = await connection('posts')
      .where('id', entity.id)
      .whereNull('deletedAt')
      .limit(1);

    const [entityDeleted] = await connection('posts').where('id', entity.id).limit(1);

    expect(entities.length).toEqual(0);
    expect(entityDeleted).not.toBeUndefined();
    expect(entityDeleted.titulo).toEqual(entity.titulo);
  });
});
