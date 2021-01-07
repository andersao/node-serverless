/* eslint-disable no-param-reassign */
const uuid = require('uuid').v4;

module.exports = class Service {
  constructor(serviceManager, options = {}) {
    this.manager = serviceManager;
    this.primaryKey = options.primaryKey || 'id';
    this.tableName = options.tableName;
    this.schema = options.schema || undefined;
    this.guarded = options.guarded || [this.primaryKey, 'createdAt', 'updatedAt', 'deletedAt'];
  }

  get connection() {
    return this.manager.connection;
  }

  queryBuilder(tableName, options = {}) {
    const { transaction } = options || {};
    const query = this.connection(tableName);

    if (transaction) query.transacting(transaction);

    return query;
  }

  async prepareDataForCreation(data) {
    return data;
  }

  async prepareDataForUpdate(data) {
    return data;
  }

  async prepareResultObject(data) {
    if (!data) return data;

    if (Array.isArray(data)) {
      return Promise.all(data.map(this.prepareResultObject));
    }

    delete data.createdAt;
    delete data.updatedAt;
    delete data.deletedAt;

    return data;
  }

  async prepareData(data, allowed = []) {
    const guarded = this.guarded || [];
    const fillable = (this.fillable || []).concat(allowed);
    const dataKeys = Object.keys(data);
    const validKeys = dataKeys.filter((key) => {
      const allow = fillable.includes(key) || !guarded.includes(key);
      return !key.startsWith('_') && allow;
    });

    return validKeys.reduce((obj, key) => {
      obj[key] = data[key];
      return obj;
    }, {});
  }

  async ensurePrimaryKey(data) {
    data[this.primaryKey] = data[this.primaryKey] || uuid();
  }

  async executeInsert(table, data, options = {}) {
    const values = await this.prepareData(data, [this.primaryKey]);
    const query = this.queryBuilder(table, options);

    await query.insert(values);
    const entityId = values[this.primaryKey];

    if (!entityId) throw new Error('O registro não foi criado');

    return entityId;
  }

  async executeUpdate(table, data, where, options = {}) {
    const query = this.queryBuilder(table, options);
    const values = await this.prepareData(data, ['deletedAt']);
    const result = await query.where(where).update(values);
    return result || null;
  }

  async pagination(where = {}, query = { offset: 0, limit: 30 }, options = {}) {
    const paging = {
      offset: query.offset ? parseInt(query.offset, 10) : 0,
      limit: query.limit ? parseInt(query.limit, 10) : 30,
    };

    const [{ total }, records] = await Promise.all([
      this.getAllCount(where || {}, options),
      this.getAll(where || {}, { paging, ...query, ...options }),
    ]);

    return {
      page: {
        hasNext: paging.offset + paging.limit < total,
        total,
        offset: paging.offset,
        limit: paging.limit,
        count: records.length,
      },
      data: records,
    };
  }

  async findById(id, options = {}) {
    const query = this.queryBuilder(this.tableName, options);
    const [entity] = await query
      .where({ [this.primaryKey]: id })
      .whereNull('deletedAt')
      .limit(1)
      .select('*');

    return await this.prepareResultObject(entity || null);
  }

  async getAllCount(where = {}, options = {}) {
    const query = this.queryBuilder(this.tableName, options);

    if (options.paranoid !== false) {
      query.whereNull('deletedAt');
    }

    const [counter] = await query.count('*').where(where);

    return counter;
  }

  async getAll(where = {}, options = {}) {
    const { paging, sortBy, orderBy } = options;
    const queryBuilder = this.queryBuilder(this.tableName, options);

    if (options.paranoid !== false) {
      queryBuilder.whereNull('deletedAt');
    }

    if (sortBy) {
      const order = String(orderBy).toLowerCase().trim();
      queryBuilder.orderBy(sortBy, order === 'desc' ? 'desc' : 'asc');
    } else {
      queryBuilder.orderBy('createdAt', 'asc');
    }

    if (paging) {
      queryBuilder.limit(paging.limit).offset(paging.offset);
    }

    const rows = await queryBuilder.where(where).select('*');

    return this.prepareResultObject(rows || null);
  }

  async getOne(where = {}, options = {}) {
    const rows = await this.getAll(where, options);
    return Array.isArray(rows) ? rows[0] : null;
  }

  async exists(id, options = {}) {
    const { total } = await this.getAllCount({ [this.primaryKey]: id }, options);
    return total !== 0;
  }

  async create(data, options = {}) {
    await this.ensurePrimaryKey(data);
    await this.prepareDataForCreation(data);

    const value = await this.validateSchemaCreate(data, options);
    const insertId = await this.executeInsert(this.tableName, value, options);

    return this.findById(insertId, options);
  }

  async update(id, data, options = {}) {
    const exists = await this.exists(id, options);
    let values = { ...data, [this.primaryKey]: id };

    if (!exists) {
      throw {
        name: 'NotFoundError',
        message: 'Recurso não encontrado',
      };
    }

    await this.prepareDataForUpdate(values);
    values = await this.validateSchemaUpdate(values, options);
    await this.executeUpdate(this.tableName, values, { [this.primaryKey]: id }, options);

    return await this.findById(id);
  }

  async destroy(id, options = {}) {
    const exists = await this.exists(id, options);

    if (!exists) {
      throw {
        name: 'NotFoundError',
        message: 'Recurso não encontrado',
      };
    }

    await this.executeUpdate(
      this.tableName,
      { deletedAt: new Date() },
      { [this.primaryKey]: id },
      options,
    );
  }

  async validateSchemaCreate(data, options) {
    return this.validateSchema('create', data, options);
  }

  async validateSchemaUpdate(data, options) {
    return this.validateSchema('update', data, options);
  }

  async validateSchema(action, data, options = {}) {
    try {
      if (this.schema) await this.schema.validate(data, options);
      return data;
    } catch (err) {
      if (err.name === 'ValidationError') {
        throw {
          name: 'UnprocessableEntityError',
          message: 'Erro na validação dos dados',
          reasons: err.errors,
        };
      }

      throw err;
    }
  }
};
