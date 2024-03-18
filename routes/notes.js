// Модуль для обработки роутов для работы с заметками


const notes = require("../crud/notes");
const users = require("../crud/users");
const cookieParser = require("cookie-parser");
let express = require('express');
let router = express.Router("/api");
const util = require("../util");
const { nanoid } = require("nanoid");

router.use(cookieParser());
router.use(express.json());

// Роут для получения спика заметок от пользователя
router.get("/notes", users.auth(), async (req, resp) => {
  if (!req.user) {
    return resp.redirect("/");
  }
  const { age, search, page } = req.query;
  // Сделал небольшую задержку, так как при добавлении в архив не успевали
  // обновиться данные.
  setTimeout(async function() {
    let listNotes = await notes.getListNotes(age, search, req.user, page);
    let hasMore = false;
    if (listNotes.length > (page * 20)) {
      hasMore = true;
    }
    listNotes = listNotes.slice((page - 1) * 20, page * 20)
    if (listNotes.length > 0 && search.length > 0) {
      listNotes.forEach((note) => {
        const regex = new RegExp(search, "gi");
        let matches = regex.exec(note.title)
        note.highlights = note.title.replace(matches[0], `<mark>${matches[0]}</mark>`)
      })
    }
    resp.json({ data: listNotes, hasMore: hasMore });
  }, 10);
})

// Роут для добавления новой заметки
router.post("/notes", users.auth(), async (req, resp) => {
  if (!req.user) {
    return resp.status(404).redirect("/");
  }
  const notesId = await notes.createNotes(req.body, req.user);
  resp.json(notesId[0])
})

// Роут для удаления всех заметок от пользователя
router.delete("/notes", users.auth(), async (req, resp) => {
  if (!req.user) {
    return resp.status(404).redirect("/");
  }
  await notes.deleteAllNotes(req.user);
  resp.sendStatus(200);
})

// Роут для получения одной заметки по id
router.get("/notes/:id", users.auth(), async (req, resp) => {
  if (!req.user) {
    return resp.redirect("/");
  }
  let note = await notes.getNotesById(req.params.id, req.user);
  note = await util.convertNotes(note)
  resp.json(note);
})

// Роут для загрузки pdf файла
router.get("/notes/:id/download", users.auth(), async (req, resp) => {
  if (!req.user) {
    return resp.redirect("/");
  }
  let note = await notes.getNotesById(req.params.id, req.user);
  note = await util.convertNotes(note);

  // Отправляем на генерацию html в buffer
  const buffer = await util.generatePdf(note.html);
  resp.setHeader('Content-disposition', 'attachment; filename=' + nanoid() + ".pdf");
  resp.setHeader('Content-type', 'application/pdf')
  resp.send(buffer);
})

// Роут для изменения заметки
router.put("/notes/:id", users.auth(), async (req, resp) => {
  if (!req.user) {
    return resp.status(404).redirect("/");
  }
  await notes.updateNotesById(req.params.id, req.user, req.body);
  const note = await notes.getNotesById(req.params.id, req.user);
  resp.json(note);
})

// Роут для изменения статуса isArchived
router.patch("/notes/:id", users.auth(), async (req, resp) => {
  if (!req.user) {
    return resp.status(404).redirect("/");
  }
  await notes.archivedNotesById(req.params.id, req.body, req.user);
  resp.sendStatus(200);
})

// Роут для удаления заметки по id
router.delete("/notes/:id", users.auth(), async (req, resp) => {
  if (!req.user) {
    return resp.status(404).redirect("/");
  }
  await notes.deleteNotes(req.params.id, req.user);
  resp.sendStatus(200);
})

module.exports = router;
