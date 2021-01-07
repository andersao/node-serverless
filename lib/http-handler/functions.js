const pako = require('pako');
const EventHttpResponse = require('./event-http-response');
const EventHttpErrors = require('./event-http-errors');

function response(statusCode, body = null, headers = {}, isBase64Encoded = false) {
  return new EventHttpResponse({
    statusCode,
    body,
    headers,
    isBase64Encoded,
  });
}

function responseCompression(originalReponse, encoding = 'gzip') {
  const { body, statusCode, headers } = originalReponse;
  const compressed = pako.gzip(typeof body === 'string' ? body : JSON.stringify(body));
  return new EventHttpResponse({
    statusCode,
    body: Buffer.from(compressed),
    headers: { ...headers, 'content-encoding': encoding },
    isBase64Encoded: true,
  });
}

function response404(message) {
  return EventHttpErrors.NotFoundError(message || 'Recurso não localizado');
}

function link(request, path) {
  const { headers } = request;
  const { host } = headers;
  const protocol = headers['x-forwarded-proto'] || 'https';
  const prefix = process.env.NWT_API_PREFIX || 'api/v2';

  return `${protocol}://${host}${prefix ? `/${prefix}` : ''}${path || ''}`;
}

function responseAccepted(request, location) {
  const href = link(request, location);
  const headers = { location: href };
  const body = {
    links: [
      {
        rel: 'self',
        href,
      },
    ],
  };

  return response(202, body, headers);
}

module.exports = {
  response,
  responseCompression,
  response404,
  responseAccepted,
  link,
};
