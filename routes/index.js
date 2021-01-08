const { EventHttpRouter } = require('../lib/http-handler');

const postsRouter = require('./posts');
const productsRouter = require('./products');
const ordersRouter = require('./orders');
const articlesRouter = require('./articles');
const swaggerRouter = require('./swagger');

const router = new EventHttpRouter({ prefix: process.env.API_PREFIX || '' });

module.exports = (app) => {
  router.merge(postsRouter(app.context));
  router.merge(productsRouter(app.context));
  router.merge(ordersRouter(app.context));
  router.merge(articlesRouter(app.context));
  router.merge(swaggerRouter(app.context));
  return router;
};
