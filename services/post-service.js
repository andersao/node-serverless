const Service = require('./service');
const { post } = require('../schemas');

module.exports = class PostService extends Service {
  constructor(serviceManager) {
    super(serviceManager, {
      schema: post,
      primaryKey: 'id',
      tableName: 'posts',
      searchable: ['titulo', 'conteudo', 'autor'],
      filterable: ['autor'],
    });
  }
};
