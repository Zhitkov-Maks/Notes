/*
Модуль для выполнения действий не связанных непосредствено с обработкой запросов,
работой с базой данных
*/

const puppeteer = require("puppeteer");
const showdown  = require('showdown'),
      converter = new showdown.Converter();
const users = require("./crud/users")
const convertToHtml = async (text) => {
  return converter.makeHtml(text);
}

/* Функция для преобразования markdown тескта в html,
и добавления оного в объект с заметкой. */
const convertNotes = async (note) => {
  try {
    let htmlNote = await convertToHtml(note.text)
    note["html"] = htmlNote;
    return note;
  } catch {
    // Бывает в этом месте падает приложение, если заметка уже была удалена.
    return note;
  }
}

// Функция получает нужные данные профиля полученные от сторонних сервисов
const parseUserFromNetwork = async (profile) => {
  let user;
  if (profile.provider === "google") {
    user = {
        username: profile.emails[0].value,
        password: profile.id,
        provider: profile.provider
    }
  } else if (profile.provider === "vkontakte") {
      user = {
        username: profile.username,
        password: (profile.id).toString(),
        provider: profile.provider
      }
  }
  const { username, password, provider} = user;
  return await createUserFromNetwork(username, password, provider);
}

/*
Функция для создания профиля в нашей базе на основе полученных данных
от сторонних сервисов, так же проверяем нет ли пользователя уже в нашей базе.
*/
const createUserFromNetwork = async (username, password, provider) => {
  let user = await users.createUser(username, password, provider);
  if (user) {
    await users.createExampleNotes(user);
  } else {
    user = await users.findUserByUserName(username, provider)
  }
  return user;
}

/*
Создаем pdf документ, пока не понимаю как его отправить в браузер
в данном варианте мы не сохраняем в файл, а получаем buffer.
*/
const generatePdf = async (htmlCode) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.setContent(htmlCode, { waitUntil: 'domcontentloaded' });
  await page.emulateMediaType('screen');
  const pdf = await page.pdf({
    margin: { top: '100px', right: '50px', bottom: '100px', left: '50px' },
    printBackground: true,
    format: 'A5',
  });
  await browser.close();
  return pdf;
}

module.exports.convertNotes = convertNotes;
module.exports.parseUserFromNetwork = parseUserFromNetwork;
module.exports.createUserFromNetwork = createUserFromNetwork;
module.exports.generatePdf = generatePdf;
