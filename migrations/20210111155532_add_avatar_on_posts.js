exports.up = (knex) => knex.schema.table('posts', (table) => {
  table.string('avatarPath', 255).nullable();
});

exports.down = (knex) => knex.schema.table('posts', (table) => {
  table.dropColumn('avatarPath');
});
