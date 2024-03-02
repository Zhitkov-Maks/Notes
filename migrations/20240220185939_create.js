exports.up = function(knex) {
  return knex.schema.createTable('notes', (table) => {
    table.increments("_id");
    table.integer("userId").notNullable();
    table.foreign("userId").references("users.id");
    table.string("title", 200).notNullable();
    table.string("text", 10_000).notNullable();
    table.datetime("created").notNullable();
    table.boolean("isArchived").notNullable().defaultTo(false);
  });
};


exports.down = function(knex) {
  return knex.schema.dropTable("notes");
};
