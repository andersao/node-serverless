exports.up = (knex) => knex.schema.table('articles_batches', (table) => {
  table.text('mensagem').nullable().alter();
});

exports.down = (knex) => knex.schema.table('articles_batches', (table) => {
  table.string('mensagem', 256).alter();
});
