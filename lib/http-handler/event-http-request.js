/* eslint-disable class-methods-use-this */
const url = require('url');

module.exports = class EventHttpRequest {
  constructor(event) {
    this.validate(event);
    this.method = event.httpMethod;
    this.path = event.path;
    this.query = event.queryStringParameters || {};
    this.headers = Object.keys(event.headers || {}).reduce((acc, key) => {
      acc[key.toLowerCase()] = acc[key];
      return acc;
    }, event.headers || {});
    this.isBase64Encoded = event.isBase64Encoded;
    this.requestContext = event.requestContext;
    this.url = url.format({
      pathname: this.path,
      query: this.query,
    });
    this.body = this.parserRequestBody(event.body);
  }

  validate(event) {
    const isElb = event.requestContext && event.requestContext.elb;
    const isApiGwt = event.requestContext && event.requestContext.apiId;

    if (!isElb && !isApiGwt) throw new Error('O evento não é uma requisição http');

    return true;
  }

  parserRequestBody(body) {
    if (!body) return Buffer.from('');

    const { isBase64Encoded } = this;
    return Buffer.from(body, isBase64Encoded ? 'base64' : 'utf8');
  }

  get bodyParsed() {
    const { body } = this;

    if (this.isJson()) {
      const content = body.toString('utf8');
      return content ? JSON.parse(content) : content;
    }

    return body;
  }

  getHeader(name) {
    return this.headers[name.toLowerCase()];
  }

  isContentType(type) {
    const contentType = this.getHeader('content-type');
    return contentType && contentType.indexOf(type) === 0;
  }

  isJson() {
    return this.isContentType('application/json');
  }

  get encoding() {
    const encoding = this.getHeader('accept-encoding');
    const accept = (encoding || 'identity').split(',').map((v) => (v || '').trim().toLowerCase());

    return accept;
  }

  get wantsGzip() {
    return this.encoding.includes('gzip');
  }
};
