var express = require('express');
var router = express.Router();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const users = require("../crud/users");

router.use(cookieParser());

// Роут для регистрации пользователя по логину и паролю
router.post("/signup", bodyParser.urlencoded({ extended: false }), async (req, resp) => {
  const { username, password } = req.body;
  if (password.length < 5 || username.length < 5) {
    return resp.redirect("/?authError=true");
  }
  const user = await users.createUser(username, password);

  if (user) {
    const sessionId = await users.createSession(user.id);
    await users.createExampleNotes(user);
    resp.cookie("sessionId", sessionId, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
    .redirect("/dashboard");
  } else {
    return resp.redirect("/?authError=true");
  }
});

// Роут для входа пользователя по логину и паролю
router.post("/login", bodyParser.urlencoded({ extended: false }), async (req, resp) => {
  const { username, password } = req.body;
  const user = await users.findUserByUserName(username, "app");
  const hashPassword = await users.passwordHash(password);

  if (!user || user.password !== hashPassword) {
    return resp.redirect("/?authError=true");
  }
  const sessionId = await users.createSession(user.id);
  resp.cookie("sessionId", sessionId, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
  .redirect("/dashboard");
});

// Роут для вохода из приложения
router.get("/logout", users.auth(), async (req, resp) => {
  if (!req.user) {
    return resp.redirect("/?authError=true");
  }
  await users.deleteSession(req.sessionId);
  resp.clearCookie("notes");
  resp.clearCookie("sessionId").redirect("/");
});

module.exports = router;
