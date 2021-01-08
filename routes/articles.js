const { EventHttpRouter, response, response404 } = require('../lib/http-handler');

module.exports = ({ serviceManager }) => {
  const router = new EventHttpRouter({ prefix: '/articles' });
  const service = serviceManager.articlesService;

  router.get('/', async ({ request }) => {
    const data = await service.pagination(request.query);
    return response(200, data);
  });

  router.post('/', async ({ bodyParsed }) => {
    const data = await service.create(bodyParsed);
    return response(201, data);
  });

  router.get('/{id}', async ({ params }) => {
    const entity = await service.findById(params.id);
    return !entity ? response404('Article não localizado') : entity;
  });

  router.put('/{id}', async ({ params, bodyParsed }) => {
    const data = await service.update(params.id, { ...bodyParsed, id: params.id });
    return response(200, data);
  });

  router.delete('/{id}', async ({ params }) => {
    const { id } = params;
    await service.destroy(id);
    return response(204);
  });

  return router;
};
