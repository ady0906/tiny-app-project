var express = require("express");
var app = express();
var cookieSession = require('cookie-session');
var bcrypt = require('bcrypt');

app.use(cookieSession({
  name: 'session',
  keys: ['secretpassword', 'supersecretpassword']
}));

var PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");

function generateRandomString() {
  return Math.random().toString(36).slice(2,8);
}

app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

const users = {};

const openURLs = {};

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/about", (req, res) => {
  let templateVars = {
    userID: req.session.user_id,
    usersDatabase: users
  };
  res.render("about", templateVars);
})

app.get("/urls", (req, res) => {
  let templateVars = {
    userID: req.session.user_id,
    usersDatabase: users
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    userID: req.session.user_id,
    urls: users[req.session.user_id],
    usersDatabase: users
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    userID: req.session.user_id,
    urls: users[req.session.user_id].urls,
    usersDatabase: users
  }
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  let userID = req.session.user_id;
  users[userID].urls[shortURL] = longURL;
  openURLs[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = openURLs[req.params.id];
  let redirectionCode = req.params.shortURL;
  res.redirect(openURLs[redirectionCode]);
});

app.post("/urls/:id/delete", (req, res) => {
  let templateVars = {
    userID: req.session.user_id,
    urls: users[req.session.user_id].urls,
    usersDatabase: users
  }
  let key = req.params.id;
  delete users[req.session.user_id].urls[key];
  res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => {
  let key = req.params.id;
  let userID = req.session.user_id;
  delete users[userID].urls[key];
  delete openURLs[userID];
  let updatedURL = req.body.updatedURL;
  let updatedShort = generateRandomString();
  users[userID].urls[updatedShort] = updatedURL;
  openURLs[updatedShort] = updatedURL;
  let templateVars = {
    userID: req.session.user_id,
    urls: users[req.session.user_id].urls,
    usersDatabase: users
  }
  res.redirect('/urls');
});

app.get("/login", (req, res) => {
  let templateVars = {
    userID: req.session.user_id,
    usersDatabase: users
  }
  res.render("actuallogin", templateVars);
});

app.post("/login", (req, res) => {
  for (let user in users) {
    if (users[user].email === req.body.email && bcrypt.compareSync(req.body.password, users[user].password)) {
      req.session.user_id = users[user].id;
      res.redirect("/");
      return;
    } else if (users[user].email === req.body.email && !bcrypt.compareSync(req.body.password, users[user].password)) {
      res.status(403).send('Status code 403: this is not the right password!');
      return;
    } else if (users[user].email !== req.body.email) {
      continue;
      }
    }
    res.status(403).send('Status code 403: you do not seem to be a registered user!');
  });


app.post("/logout", (req, res) => {
  let templateVars = {
    usersDatabase: users
  }
  req.session.user_id = null;
  req.session = null;
  res.redirect("/");
});

app.get("/register", (req, res) => {
  let templateVars = {
    userID: false,
    usersDatabase: users
  }
  res.render("login", templateVars);
});

app.post("/register", (req, res) => {
  let userID = generateRandomString();
  let userEmail = req.body.email;
  let userPassword = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync());
  if (!req.body.email || !req.body.password) {
    res.status(400).send('Status code 400: you need an email address and a password to register!')
  }
  for (let user in users) {
    if (users[user].email === userEmail) {
      res.status(400).send('Status code 400: this email address is already in use!');
      return;
    }
  }
  users[userID] = {
    id: userID,
    email: userEmail,
    password: userPassword,
    urls: {}
  }
  req.session.user_id = users[userID].id;
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}!`);
});
