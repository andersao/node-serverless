const { EventHttpRouter, response, response404 } = require('../lib/http-handler');

module.exports = ({ serviceManager }) => {
  const router = new EventHttpRouter({ prefix: '/products' });
  const service = serviceManager.productService;

  router.get('/', async ({ request }) => {
    const data = await service.getAll(request.query);
    return response(200, data);
  });

  router.post('/', async ({ bodyParsed }) => {
    const data = await service.create(bodyParsed);
    return response(201, data);
  });

  router.get('/{id}', async ({ params }) => {
    const entity = await service.getById(params.id);
    return !entity ? response404('Produto não localizado') : entity;
  });

  router.put('/{id}', async ({ params, bodyParsed }) => {
    const data = await service.updateById(params.id, bodyParsed);
    return response(200, data);
  });

  router.delete('/{id}', async ({ params }) => {
    const { id } = params;
    await service.deleteById(id);
    return response(204);
  });

  return router;
};
