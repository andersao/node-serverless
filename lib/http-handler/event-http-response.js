const http = require('http');

const STATUS_CODE = Symbol('statusCode');
const BODY = Symbol('body');
const IS_BASE64_ENCODED = Symbol('isBase64Encoded');
const HEADERS = Symbol('headers');
const HTTP_STATUS_CODES = Object.keys(http.STATUS_CODES).map((code) => parseInt(code, 10));

module.exports = class EventHttpResponse {
  constructor({
    statusCode, body, headers, isBase64Encoded,
  } = {}) {
    this.statusCode = statusCode || 200;
    this[HEADERS] = {
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...(headers || {}),
    };
    this[IS_BASE64_ENCODED] = isBase64Encoded || false;
    this.body = body || null;
  }

  set statusCode(value) {
    const code = parseInt(value, 10);

    if (!HTTP_STATUS_CODES.includes(code)) {
      throw new Error(`O código ${code} não é um statusCode válido`);
    }

    this[STATUS_CODE] = code;
  }

  get statusCode() {
    return this[STATUS_CODE];
  }

  get statusDescription() {
    return `${this.statusCode} ${http.STATUS_CODES[this.statusCode]}`;
  }

  set body(value) {
    this[BODY] = value;
  }

  get body() {
    const body = this[BODY];

    if (this.isBase64Encoded && body instanceof Buffer) return body.toString('base64');
    if (this.isJson()) return JSON.stringify(body);

    return body instanceof Buffer ? body.toString('utf8') : body;
  }

  get isBase64Encoded() {
    return this[IS_BASE64_ENCODED];
  }

  get headers() {
    return this[HEADERS];
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

  toJson() {
    const body = this.body === null || this.body === 'null' ? '' : this.body;

    return {
      statusCode: this.statusCode,
      headers: this.headers,
      body,
      isBase64Encoded: this.isBase64Encoded,
    };
  }

  toLambda() {
    const obj = this.toJson();
    return obj;
  }
};
