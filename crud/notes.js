const { knex } = require("../knexfile");
const moment = require('moment');

// Функция для создания заметки, возвращает id заметки
const createNotes = async (data, user) => {
  const dateStr = moment().utc().format();
  return knex("notes").insert(
  {
    title: data.title,
    text: data.text,
    userId: user.id,
    created: dateStr
  }).returning("_id");
};

// Функция для получения заметки по user_id и id.
const getNotesById = async (id, user) => {
  return knex("notes").select().where({ _id: id, userId: user.id }).first();
}

// Функция для получения заметок с фильтрацией в 1 или 3 месяца
const timeInterval = async (age, search, user, page) => {
  age = age[0]
  const fromDate = moment().subtract(age, 'months').format();
  return knex("notes")
    .select('_id', 'created', 'isArchived', 'title')
    .whereILike('title', `%${search}%`)
    .where('created', '>=', fromDate)
    .where({
      userId: user.id,
      isArchived: false,
    })
    .orderBy("created", "desc")
    .limit(page * 20 + 1);
};

// Функция для получения заметок за все время
const allTime = async (search, user, page) => {
  return knex("notes")
    .select('_id', 'created', 'isArchived', 'title')
    .whereILike('title', `%${search}%`)
    .where({
      userId: user.id,
      isArchived: false,
    })
    .orderBy("created", "desc")
    .limit(page * 20 + 1);
}

// Для получения архивированных заметок
const archived = async (search, user, page) => {
  return knex("notes")
    .select('_id', 'created', 'isArchived', 'title')
    .whereILike('title', `%${search}%`)
    .where({
      userId: user.id,
      isArchived: true,
    })
    .orderBy("created", "desc")
    .limit(page * 20 + 1);
}

// Функция распределитель какой фильтр применить для получения заметок
const getListNotes = async (age, search, user, page) => {
  let listNotes;
  if (age === "1month" || age === "3months" ) {
    listNotes = await timeInterval(age, search, user, page);
  } else if (age === "alltime") {
    listNotes = await allTime(search, user, page)
  } else if (age === "archive") {
    listNotes = await archived(search, user, page);
  }
   return listNotes;
};

// Изменяет состояние архивации заметки
const archivedNotesById = async (id, data, user) => {
  await knex("notes")
  .update({ isArchived: data.isArchived })
  .where({ _id: id, userId: user.id })
};

// Функция для удаления одной заметки
const deleteNotes = async (id, user) => {
  await knex("notes")
  .delete()
  .where({ _id: id, userId: user.id })
};

// Функция для удаления всех заметок
const deleteAllNotes = async (user) => {
  return knex("notes")
  .delete()
  .where({
    userId: user.id,
    isArchived: true
   })
};

// Функция для изменения содержимого заметки
const updateNotesById = async (id, user, data) => {
  await knex("notes")
  .update({
    title: data.title,
    text: data.text
  })
  .where({ _id: id, userId: user.id });
}

module.exports.createNotes = createNotes;
module.exports.getNotesById = getNotesById;
module.exports.getListNotes = getListNotes;
module.exports.archivedNotesById = archivedNotesById;
module.exports.deleteNotes = deleteNotes;
module.exports.deleteAllNotes = deleteAllNotes;
module.exports.updateNotesById = updateNotesById;
