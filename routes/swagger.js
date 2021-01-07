const fs = require('fs');
const path = require('path');
const { EventHttpRouter, response } = require('../lib/http-handler');

const ROOT_FOLDER = path.join(path.dirname(__dirname));
const SWAGGER_FOLDER = path.join(ROOT_FOLDER, 'swagger');
const PREFIX = process.env.PNM_API_PREFIX || 'api';

module.exports = () => {
  const router = new EventHttpRouter();

  router.get('/swagger.json', async () => {
    const file = fs.readFileSync(path.join(SWAGGER_FOLDER, 'swagger.json'));
    return response(200, JSON.parse(file.toString()), {
      'content-type': 'application/json',
    });
  });

  router.get('/swagger', async ({ request }) => {
    const { headers } = request;
    const file = fs.readFileSync(path.join(SWAGGER_FOLDER, 'index.html'));
    const template = file
      .toString()
      .replace('{URI}', headers.host)
      .replace('{PROTOCOL}', 'http') // headers['x-forwarded-proto']
      .replace('{PREFIX}', PREFIX);

    return response(200, Buffer.from(template), {
      'content-type': 'text/html',
    }, true);
  });

  return router;
};
