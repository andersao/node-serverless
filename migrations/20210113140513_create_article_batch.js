exports.up = (knex) => knex.schema.createTable('articles_batches', (table) => {
  table.string('id', 36).primary().notNullable();
  table.string('status', 36);
  table.string('mensagem', 256);
  table.timestamp('createdAt').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
  table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
});

exports.down = (knex) => knex.schema.dropTable('articles_batches');
