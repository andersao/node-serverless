/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const ROUTES = Symbol('routes');
const PREFIX = Symbol('prefix');

module.exports = class EventHttpRouter {
  constructor({ prefix } = {}) {
    this[ROUTES] = {};
    this[PREFIX] = prefix || '';
  }

  get routes() {
    return this[ROUTES];
  }

  get prefix() {
    const prefix = (this[PREFIX] || '').trim();
    if (!prefix) return '';
    return prefix.startsWith('/') ? prefix : `/${prefix}`;
  }

  normalizePath(path) {
    const trimed = `${this.prefix}${path.trim()}`;

    if (trimed.endsWith('/') && trimed.length > 1) {
      return trimed.substring(0, trimed.length - 1);
    }

    return trimed;
  }

  registerAction(resource, method, action) {
    if (typeof action !== 'function') throw new Error('O callback da rota deve ser uma função');

    const path = this.normalizePath(resource);
    const routes = this[ROUTES][path] || {};

    routes[method] = action;

    this[ROUTES][path] = routes;
  }

  get(resource, action) {
    return this.registerAction(resource, 'GET', action);
  }

  post(resource, action) {
    return this.registerAction(resource, 'POST', action);
  }

  put(resource, action) {
    return this.registerAction(resource, 'PUT', action);
  }

  patch(resource, action) {
    return this.registerAction(resource, 'PATCH', action);
  }

  delete(resource, action) {
    return this.registerAction(resource, 'DELETE', action);
  }

  merge(otherRouter) {
    if (!(otherRouter instanceof EventHttpRouter)) {
      throw new Error('router deve ser uma instância de EventRouter');
    }
    const { routes } = otherRouter;

    Object.keys(routes).forEach((path) => {
      const methods = routes[path];
      Object.keys(methods).forEach((method) => {
        this.registerAction(path, method.toUpperCase(), methods[method]);
      });
    });
  }

  compilePath(path) {
    path = path.replace(/{(.*?)}/gi, '(?<$1>[^/]+?)');
    const regex = `^${path}(?:/)?$`;
    return new RegExp(regex);
  }

  matchPath(pathname) {
    const { routes } = this;
    const paths = Object.keys(routes);

    return paths
      .map((path) => {
        const regexp = this.compilePath(path);
        const match = regexp.exec(pathname);

        if (!match) return null;

        const [url] = match;
        const params = Object.keys(match.groups || {}).reduce((acc, key) => {
          acc[key] = match.groups[key];
          return acc;
        }, {});

        return {
          resource: path,
          url,
          params,
        };
      })
      .filter((matched) => matched)
      .shift();
  }

  matchRoute(method, url) {
    const matched = this.matchPath(url);

    if (!matched) return null;

    const { routes } = this;
    const { resource } = matched;

    const methods = routes[resource];
    const handler = methods[method];

    if (!handler) return null;

    return {
      handler,
      ...matched,
    };
  }
};
