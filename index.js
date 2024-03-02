/*
Главный модуль нашего приложения, в нем запускаем сервер, обрабатываем две наши
странички, настраиваем аутентификацию от сторонних сервисов
 */

require("dotenv").config();
const express = require("express");
const nunjucks = require("nunjucks");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const users = require("./crud/users");
const userRout = require('./routes/auth');
const notesRout = require("./routes/notes");
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const VKontakteStrategy = require('passport-vkontakte').Strategy;
const util = require("./util");

const app = express();

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

//============ GOOGLE========================
passport.use('google', new GoogleStrategy({
        clientID: process.env.CLIENT_ID_GOOGLE,
        clientSecret: process.env.CLIENT_SECRET_GOOGLE,
        callbackURL: process.env.CLIENT_URI_GOOGLE,
        scope: [ 'profile', 'email' ],
        state: true
    },
    async function(request, accessToken, refreshToken, profile, done) {
      const user = await util.parseUserFromNetwork(profile);
      done(null, user)
}));

// ============= VK.COM ========================
passport.use('vkontakte', new VKontakteStrategy({
        clientID: process.env.CLIENT_ID_VK,
        clientSecret: process.env.CLIENT_SECRET_VK,
        callbackURL: process.env.CLIENT_URI_VK,
        scope: [ 'profile', 'email' ],
        state: true
    },
    async function(request, accessToken, refreshToken, profile, done) {
      const user = await util.parseUserFromNetwork(profile);
      done(null, user)
    }));

nunjucks.configure("views", {
  autoescape: true,
  express: app,
});

app.use("/", userRout);
app.use("/api", notesRout)
app.set("view engine", "njk");

app.use(require('cookie-parser')());
app.use(require('express-session')({
    secret : 'Simple Notes',
    resave: true,
    key: "notes",
    saveUninitialized: false,
    cookie: {
      "path": "/",
      "httpOnly": true,
      "maxAge": 120 * 60 * 60 * 1000
    }
}));

// ------------------------------------
app.use(passport.initialize());
app.use(passport.session());
// ------------------------------------

app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());
app.use(morgan("':method :url :status :res[content-length] - :response-time ms'"));


// Роут для запроса аутентификации у гугла
app.get('/registration/google', passport.authenticate('google'));

// Роут для аутентификации от гугла
app.get('/registration/google/callback',
  passport.authenticate('google', { failureRedirect: '/?authError=true', failureMessage: true }),
  async function(req, res) {
    if (req.user) {
      const sessionId = await users.createSession(req.user.id);
      res.cookie("sessionId", sessionId, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
      .redirect("/dashboard");
    }
});

// Роут для запроса аутентификации у vkontakte
app.get('/registration/vkontakte', passport.authenticate('vkontakte'));

// Роут для аутентификации от vkontakte
app.get('/registration/vkontakte/callback',
  passport.authenticate('vkontakte', { failureRedirect: '/?authError=true', failureMessage: true }),
  async function(req, res) {
    if (req.user) {
      const sessionId = await users.createSession(req.user.id);
      res.cookie("sessionId", sessionId, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
      .redirect("/dashboard");
    }
});

// Роут для обработки страницы авторизации
app.get("/", users.auth(), async (req, res) => {
  if (req.user) {
    return res.redirect("/dashboard")
  }
  res.render("index", {
    user: req.user,
    authError: req.query.authError === "true" ? "Wrong username or password" : req.query.authError,
  });
});

// Роут для обработки страницы с заметками
app.get("/dashboard", users.auth(), async (req, res) => {
  if (req.user) {
    res.render("dashboard", {
      user: req.user
    });
  } else {
    return res.redirect("/?authError=true")
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
