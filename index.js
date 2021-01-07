/* eslint-disable no-param-reassign */
/* eslint-disable no-console */
const { createConnection } = require('./config/db');
const { EventHttpHandler, EventHttpErrors } = require('./lib/http-handler');
const ServiceManager = require('./services/service-manager');
const authorizerMiddleware = require('./middleware/authorizer');
const routes = require('./routes');

const TEST_ENV = process.env.NODE_ENV === 'test';

module.exports.handler = async (event) => {
  console.log('event: %j', event);

  const connection = createConnection();
  const app = await EventHttpHandler.from(event);

  try {
    const serviceManager = new ServiceManager(connection);

    app.on('internalError', (err) => {
      console.error('internalError:', err);
    });
    app.registerContext('connection', connection);
    app.registerContext('serviceManager', serviceManager);
    app.addMiddleware(authorizerMiddleware);
    app.registerRouter(routes(app));

    const response = await app.handler();
    return response.toLambda();
  } catch (error) {
    console.error(error);
    const response = EventHttpErrors.InternalServerError('Erro interno');
    return response.toLambda();
  } finally {
    if (!TEST_ENV) await app.flush();
  }
};
