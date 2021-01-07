/* eslint-disable import/order */
/* eslint-disable no-param-reassign */
const { ValidationError } = require('../utils/errors');
const uuid = require('uuid').v4;

const memoryData = [];

module.exports = class ProductService {
  async validateBeforeSave(data) {
    delete data.id;
    if (!data.nome) throw new ValidationError('nome requerido');
    if (!data.idade) throw new ValidationError('idade requerida');
    return true;
  }

  async getAll() {
    return memoryData;
  }

  async getById(id) {
    return memoryData.find((item) => item.id === id);
  }

  async deleteById(id) {
    const index = memoryData.findIndex((item) => item.id === id);
    return (memoryData.splice(index, 1) || []).length;
  }

  async updateById(id, data) {
    const index = memoryData.findIndex((item) => item.id === id);
    if (await this.validateBeforeSave(data)) {
      memoryData[index] = data;
      memoryData[index].id = id;
      return data;
    }
    return null;
  }

  async create(data) {
    if (await this.validateBeforeSave(data)) {
      data.id = uuid();
      memoryData.push(data);
      return data;
    }
    return null;
  }
};
