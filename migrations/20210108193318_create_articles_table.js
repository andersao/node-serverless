exports.up = (knex) => knex.schema.createTable('articles', (table) => {
  table.string('id', 36).primary().notNullable();
  table.string('title', 30);
  table.string('content');
});

exports.down = (knex) => knex.schema.dropTable('articles');
