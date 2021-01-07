const faker = require('faker/locale/pt_BR');
const factory = require('./factory');

module.exports = {
  postFactory: factory('posts', 'id', async () => ({
    id: faker.random.uuid(),
    titulo: faker.lorem.word(),
    conteudo: faker.lorem.text(),
    autor: faker.name.firstName(),
  })),
};
