const PostService = require('./post-service');
const ProductService = require('./product-service');
const OrderService = require('./orders-service');

const SERVICES = Symbol('services');

module.exports = class ServiceManager {
  constructor(connection) {
    this.connection = connection;
    this[SERVICES] = {};
  }

  getService(name, factory = () => {}) {
    if (!this[SERVICES][name]) {
      this[SERVICES] = factory();
    }

    return this[SERVICES];
  }

  get postService() {
    return this.getService('post', () => new PostService(this));
  }

  get productService() {
    return this.getService('product', () => new ProductService(this));
  }

  get orderService() {
    return this.getService('order', () => new OrderService(this));
  }

  async flush() {
    if (this.connection) await this.connection.destroy();
  }
};
