/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const EventEmitter = require('events');
const EventHttpRouter = require('./event-http-router');
const EventHttpRequest = require('./event-http-request');
const EventHttpResponse = require('./event-http-response');
const EventHttpErrors = require('./event-http-errors');

const ROUTER = Symbol('router');
const REQUEST = Symbol('request');
const CONTEXT = Symbol('context');
const MIDDLEWARES = Symbol('middlewares');

const { responseCompression } = require('./functions');

module.exports = class EventHttpHandler extends (
  EventEmitter
) {
  /* istanbul ignore next */
  constructor({ request, router } = {}) {
    super();
    this[ROUTER] = null;
    this[REQUEST] = null;
    this[CONTEXT] = {};
    this[MIDDLEWARES] = [];

    if (router) this.router = router;
    if (request) this.request = request;
  }

  set request(value) {
    if (!value || !(value instanceof EventHttpRequest)) {
      throw new Error('A requisição precisar ser uma instância de EventHttpRequest');
    }

    this[REQUEST] = value;
  }

  get request() {
    return this[REQUEST];
  }

  set router(value) {
    if (!value || !(value instanceof EventHttpRouter)) {
      throw new Error('O router precisar ser uma instância de EventHttpRouter');
    }

    this[ROUTER] = value;
  }

  get router() {
    return this[ROUTER];
  }

  registerContext(name, value) {
    this[CONTEXT][name] = value;
    return this;
  }

  get context() {
    return this[CONTEXT];
  }

  get middlewares() {
    return this[MIDDLEWARES];
  }

  addMiddleware(middleware) {
    this[MIDDLEWARES].push(middleware);
    return this;
  }

  registerRouter(router) {
    this.router = router;
  }

  async handler() {
    try {
      const { router, request, context } = this;

      if (request.method === 'OPTIONS') {
        return new EventHttpResponse({
          statusCode: 200,
          body: null,
          headers: {
            'Access-Control-Allow-Headers': 'Authorization, x-dominio-id, *',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      if (!router) throw new Error('O roteador não foi configurado');
      if (!request) throw new Error('A request não foi inicializada');

      const matched = router.matchRoute(request.method, request.path);

      const middlewares = this.middlewares
        .filter((m) => typeof m === 'function')
        .map((middleware) => middleware({
          request,
          router,
          route: matched,
          context,
        }));

      await Promise.all(middlewares);

      if (!matched) return EventHttpErrors.NotFoundError('Recurso não localizado');

      const { handler, resource, params } = matched;

      request.resource = resource;
      request.params = params;

      this.emit('beforeRouteHandler', { router, request, route: matched });

      const data = await handler({
        request,
        context,
        params,
        bodyParsed: request.bodyParsed,
        authorizer: context.authorizer,
      });

      this.emit('beforeResponse', { request, data });

      const response = this.makeResponse(data);

      this.emit('afterResponse', { request, response });

      return response;
    } catch (error) {
      this.emit('err', error);
      return this.makeErrorResponse(error);
    }
  }

  makeResponse(data) {
    let response = null;

    if (data instanceof EventHttpResponse) response = data;
    else response = new EventHttpResponse({ statusCode: 200, body: data });

    if (this.request.wantsGzip) {
      return responseCompression(response, 'gzip');
    }

    return response;
  }

  makeErrorResponse(error) {
    if (error instanceof EventHttpResponse) return error;

    if (!(error instanceof Error) && error.name && error.message) {
      const httpError = EventHttpErrors[error.name];
      const attributes = {};
      if ('reasons' in error) attributes.reasons = error.reasons;
      if (httpError) return httpError(error.message, attributes);
    }

    this.emit('internalError', error);

    return EventHttpErrors.InternalServerError('Erro interno do Servidor');
  }

  async flush() {
    try {
      Object.keys(this.context).forEach((key) => {
        const object = this.context[key];
        if (object && typeof object === 'object' && 'flush' in object && typeof object.flush === 'function') {
          object.flush();
        }
      });
    } catch (error) {
      console.error('flush error:', error);
    }
  }

  static async from(event) {
    const request = new EventHttpRequest(event);
    return new EventHttpHandler({ request });
  }
};
