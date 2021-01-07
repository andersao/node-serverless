exports.up = (knex) => knex.schema.createTable('posts', (table) => {
  table.string('id', 36).primary().notNullable();
  table.string('titulo', 255).notNullable();
  table.text('conteudo', 255).nullable();
  table.string('autor', 255).nullable();
  table.timestamp('createdAt').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
  table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
  table.timestamp('deletedAt').nullable();
});

exports.down = (knex) => knex.schema.dropTable('posts');
