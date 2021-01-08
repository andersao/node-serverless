const Service = require('./service');
const { articles } = require('../schemas');

module.exports = class ArticlesService extends Service {
  constructor(serviceManager) {
    super(serviceManager, {
      schema: articles,
      primaryKey: 'id',
      tableName: 'articles',
    });
  }
};
