const { ServiceManager } = require('../../services');
const entityFactory = require('../factories').postFactory;
const { connection } = require('../../config/db');

describe('Post Service', () => {
  let serviceManager = null;
  let entityService = null;

  beforeAll(async () => {
    serviceManager = new ServiceManager(connection);
    entityService = serviceManager.postService;
  });

  beforeEach(async () => {
    await connection('posts').update('deletedAt', new Date());
  });

  afterAll(async () => {
    await serviceManager.flush();
  });

  test('deve criar um registro', async () => {
    const data = await entityFactory.data();
    const entity = await entityService.create(data);

    expect(entity).not.toBeNull();
    expect(entity.titulo).toEqual(data.titulo);
    expect(entity.conteudo).toEqual(data.conteudo);
    expect(entity.autor).toEqual(data.autor);
  });

  test('deve validar dados obrigatórios na criação', async () => {
    try {
      const data = await entityService.create({});
      expect(data).toBeNull();
    } catch (err) {
      expect(err).not.toBeNull();
      expect(err.name).toMatch(/UnprocessableEntity/gi);
      expect(Array.isArray(err.reasons)).toBeTruthy();
    }
  });

  test('deve validar dados obrigatórios no update', async () => {
    try {
      const entity = await entityFactory.create(connection);
      const data = { ...entity, titulo: '' };
      const updated = await entityService.update(entity.id, data);
      expect(updated).toBeUndefined();
    } catch (err) {
      expect(err).not.toBeNull();
      expect(err.name).toMatch(/UnprocessableEntity/gi);
      expect(Array.isArray(err.reasons)).toBeTruthy();
    }
  });

  test('deve atualizar um registro', async () => {
    await entityFactory.create(connection);

    const [entity] = await connection('posts').whereNull('deletedAt').limit(1);
    expect(entity).not.toBeNull();

    const data = {
      id: entity.id,
      titulo: 'Patrícia e Eloá Vidros Ltda',
      conteudo: entity.conteudo,
      autor: 'Anderson',
    };

    await entityService.update(entity.id, data);

    const [entityUpdated] = await connection('posts')
      .where({ id: entity.id })
      .whereNull('deletedAt')
      .limit(1);

    expect(entityUpdated).not.toBeNull();
    expect(entityUpdated.id).toEqual(entity.id);
    expect(entityUpdated.titulo).toEqual(data.titulo);
    expect(entityUpdated.conteudo).toEqual(data.conteudo);
    expect(entityUpdated.autor).toEqual(data.autor);
  });

  test('deve deletar lógicamente', async () => {
    const entity = await entityFactory.create(connection);
    await entityService.destroy(entity.id);
    const entityFound = await entityService.findById(entity.id);

    const [entityRow] = await connection('posts')
      .where({ id: entity.id })
      .limit(1);

    expect(entityFound).toBeNull();
    expect(entityRow).not.toBeUndefined();
    expect(entityRow.titulo).toEqual(entity.titulo);
  });
});
