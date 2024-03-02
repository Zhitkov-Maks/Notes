// Создаем таблицу для пользователей

exports.up = function (knex) {
  return knex.schema.createTable('users', function (table) {
    table.increments("id");
    table.string("username", 50).notNullable().unique();
    table.string("password", 200);
    table.string("provider", 100).notNullable();
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable("users");
};
