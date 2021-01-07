const knex = require('knex');
const knexConfig = require('../knexfile');

const connection = knex(knexConfig);

module.exports = {
  connection,
  createConnection: () => {
    if (process.env.APP_DATABASE_HOST) knex(knexConfig);
    return null;
  },
};
