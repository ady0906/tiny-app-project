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
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(users);
});

app.get("/urls", (req, res) => {
  if (req.session.user_id) {
    let templateVars = {
      userID: req.session.user_id,
      usersDatabase: users
      }
      res.render("urls_index", templateVars);
  } else {
      let templateVars = {
        userID: null
      }
      res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    let templateVars = {
      userID: req.session.user_id,
      urls: users[req.session.user_id],
      usersDatabase: users
      }
    res.render("urls_new", templateVars);
  } else {
    let templateVars = {
      userID: null
    }
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  if (req.session.user_id && openURLs.hasOwnProperty(req.params.id)) {
    let templateVars = {
      shortURL: req.params.id,
      userID: req.session.user_id,
      urls: users[req.session.user_id].urls,
      usersDatabase: users
    }
    res.render("urls_show", templateVars);
  } else if (!req.session.user_id) {
      let templateVars = {
        userID: null
      }
      res.render("urls_show", templateVars);
  } else if (!openURLs.hasOwnProperty(req.params.id)) {
    res.status(404).send("Link not found!");
  }
});

app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    let longURL = req.body.longURL;
    let shortURL = generateRandomString();
    let userID = req.session.user_id;
    users[userID].urls[shortURL] = longURL;
    openURLs[shortURL] = longURL;
    res.redirect(`/urls/${shortURL}`);
  } else {
    let templateVars = {
      userID: null
    }
    res.redirect("/urls");
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (openURLs.hasOwnProperty(req.params.shortURL)) {
    res.redirect(openURLs[req.params.shortURL]);
  } else {
    res.status(404).send("Link not found!");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  let templateVars = {
    userID: req.session.user_id,
    urls: users[req.session.user_id].urls,
    usersDatabase: users
  }
  let key = req.params.id;
  delete users[req.session.user_id].urls[key];
  delete openURLs[key];
  res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => {
  if (req.session.user_id) {
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
  } else if (!req.session.user_id) {
    let templateVars = {
      userID: null
    }
    res.redirect('/urls');
  } else if (!openURLs.hasOwnProperty(req.params.id)) {
    res.status(404).send("Link not found!");
  }
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/');
  } else {
    let templateVars = {
      userID: req.session.user_id,
      usersDatabase: users
    }
    res.render("actuallogin", templateVars);
  }
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
  res.redirect("/");
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/');
  } else {
    let templateVars = {
      userID: null,
      usersDatabase: users
    }
    res.render("login", templateVars);
  }
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
