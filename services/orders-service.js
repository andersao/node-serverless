/* eslint-disable import/order */
/* eslint-disable no-param-reassign */
const { ValidationError } = require('../utils/errors');
const uuid = require('uuid').v4;

module.exports = class OrderService {
  constructor() {
    this.memoryData = [];
  }

  async validateBeforeSave(data) {
    delete data.id;
    if (!data.nome) throw new ValidationError('nome requerido');
    return true;
  }

  async getAll() {
    return this.memoryData;
  }

  async getById(id) {
    return this.memoryData.find((item) => item.id === id);
  }

  async deleteById(id) {
    const index = this.memoryData.findIndex((item) => item.id === id);
    return (this.memoryData.splice(index, 1) || []).length;
  }

  async updateById(id, data) {
    const index = this.memoryData.findIndex((item) => item.id === id);
    if (await this.validateBeforeSave(data)) {
      this.memoryData[index] = data;
      this.memoryData[index].id = id;
      return data;
    }
    return null;
  }

  async create(data) {
    if (await this.validateBeforeSave(data)) {
      data.id = uuid();
      this.memoryData.push(data);
      return data;
    }
    return null;
  }
};
