const _ = require('lodash');
const http = require('http');
const EventHttpResponse = require('./event-http-response');

function errorName(description) {
  const parts = description.split(/\s+/);

  let name = parts.reduce((acc, part) => {
    const normalized = _.capitalize(part.toLowerCase());
    return acc + normalized;
  }, '');

  name = name.replace(/\W+/g, '');

  if (!_.endsWith(description, 'Error')) {
    name += 'Error';
  }

  return name;
}

function createResponseError(statusCode, error, attributes = {}) {
  let message = error;
  // eslint-disable-next-line prefer-destructuring
  if (error instanceof Error) message = error.message;

  const body = {
    code: errorName(http.STATUS_CODES[statusCode]),
    message,
    ...attributes,
  };

  return new EventHttpResponse({ statusCode, body });
}

const HTTP_ERRORS = Object.keys(http.STATUS_CODES).reduce((acc, code) => {
  const statusCode = parseInt(code, 10);

  if (statusCode >= 400) {
    acc[errorName(http.STATUS_CODES[code])] = statusCode;
  }

  return acc;
}, {});

/**
 * @module http-handler/event-http-error
 * Http Errors Responses
 *
 * Criação amigavél de respostas com erros Http.
 * Para criar uma nova resposta, basta apenas converter as descricão do erro de forma captalizada
 * adicionado do suffixo "Error" caso já não exista na descricão.
 *
 * Exemplos de definicão das descricões
 *
 * - 400 Bad Request se torna BadRequestError
 * - 404 Not Found se torna NotFoundError
 * - 407 Proxy Authentication Required se torna ProxyAuthenticationRequiredError
 *
 * @see https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Status
 *
 * @example
 * const { EventHttpErrors } = require('./lib/http-handler')
 *
 * const response = EventHttpErrors.InternalServerError()
 * const response = EventHttpErrors.BadRequestError('Dados inválidos')
 * const response = EventHttpErrors.BadRequestError('Dados inválidos')
 * const response = EventHttpErrors.BadRequestError('Dados inválidos')
 */
module.exports = Object.keys(HTTP_ERRORS).reduce((acc, name) => {
  const statusCode = HTTP_ERRORS[name];
  acc[name] = (message, attributes = {}) => createResponseError(statusCode, message, attributes);
  return acc;
}, {});
