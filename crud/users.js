const { nanoid } = require("nanoid");
const crypto = require("crypto");
const { knex } = require("../knexfile");
const fs = require("fs");
const path = require("path");
const notes = require("./notes");

// Функция для хэширования паролей
const passwordHash = async (pass) => {
  return crypto.createHash("sha256").update(pass).digest("hex");
};

// Функция для создания пользователя
const createUser = async (username, pass, provider = "app") => {
  const checkUser = await findUserByUserName(username, provider);
  if (checkUser) {
    return false;
  } else {
    const password = await passwordHash(pass);
    const [id] = await knex("users")
    .insert({ username, password, provider })
    .returning("id");
    return id;
  }
};

// Функция для аутентификации
const auth = () => async (req, resp, next) => {
  if (!req.cookies["sessionId"]) {
    return next();
  }
  const user = await findUserBySessionId(req.cookies["sessionId"]);
  if (user) {
    req.user = user;
    req.sessionId = req.cookies["sessionId"];
    next();
  }
};

// Функция для поиска пользователя по имени и провайдеру(app, googgle, vk)
const findUserByUserName = async (username, provider) => {
  return knex("users").select().where({ username, provider }).first();
}

// Функция для поиска пользователя по сессии
const findUserBySessionId = async (sessionId) => {
  const session = await knex("sessions")
    .select("userId")
    .where({ sessionId })
    .first();
  if (!session) {
    return null;
  }
  return knex("users").select().where({ id: session.userId }).first();
};

// Функция для создания сесии
const createSession = async (userId) => {
  const sessionId = nanoid();
  await knex("sessions").insert({ userId, sessionId } )
  return sessionId;
};

// Функция для удаления сесии
const deleteSession = async (sessionId) => {
  await knex("sessions").where({ sessionId }).delete();
};

// Функция для для создания демо заметки по работе с markdown
const createExampleNotes = async (user) => {
  const pathToFile = path.resolve(__dirname, "./example.md")
  const markdownFile = fs.readFileSync(pathToFile, "utf-8");
  const body = {
    title: "DEMO",
    text: markdownFile
  }
  await notes.createNotes(body, user);
}

module.exports.auth = auth;
module.exports.findUserByUserName = findUserByUserName;
module.exports.createSession = createSession;
module.exports.deleteSession = deleteSession;
module.exports.createUser = createUser;
module.exports.passwordHash = passwordHash;
module.exports.createExampleNotes = createExampleNotes;
module.exports.findUserBySessionId = findUserBySessionId;
