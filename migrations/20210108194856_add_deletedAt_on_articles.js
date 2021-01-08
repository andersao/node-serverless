exports.up = (knex) => knex.schema.table('articles', (table) => {
  table.timestamp('createdAt').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP'));
  table.timestamp('updatedAt').notNullable().defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
  table.timestamp('deletedAt').nullable();
});

exports.down = (knex) => knex.schema.table('articles', (table) => {
  table.dropColumn('createdAt');
  table.dropColumn('updatedAt');
  table.dropColumn('deletedAt');
});
