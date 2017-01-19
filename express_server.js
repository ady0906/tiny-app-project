var express = require("express");
var app = express();
var cookieParser = require('cookie-parser');

app.use(cookieParser());

var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");

function generateRandomString() {
  return Math.random().toString(36).slice(2,8);
}

app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    userEmail: req.cookies["userEmail"],
    urls: urlDatabase,
    usersInfo: users
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    userEmail: req.cookies["userEmail"],
    urls: urlDatabase,
    usersInfo: users
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase,
    userEmail: req.cookies["userEmail"],
    usersInfo: users
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  let templateVars = {
    userEmail: req.cookies["userEmail"],
    urls: urlDatabase,
    usersInfo: users
  };
  res.redirect(`/urls/${shortURL}`, templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.id];
  let magicCode = req.params.shortURL;
  res.redirect(urlDatabase[magicCode]);
});

app.post("/urls/:id/delete", (req, res) => {
  let templateVars = {
    userEmail: req.cookies["userEmail"],
    urls: urlDatabase,
    usersInfo: users
  };
  let key = req.params.id;
  delete urlDatabase[key];
  res.redirect('/urls', templateVars);
});

app.post("/urls/:id", (req, res) => {
  let key = req.params.id;
  delete urlDatabase[key];
  let updatedURL = req.body.updatedURL;
  let updatedShort = generateRandomString();
  urlDatabase[updatedShort] = updatedURL;
  let templateVars = {
    userEmail: req.cookies["userEmail"],
    urls: urlDatabase,
    usersInfo: users
  };
  res.redirect('/urls', templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = {
    userEmail: req.cookies["userEmail"],
    urls: urlDatabase,
    usersInfo: users
  };
  res.render("actuallogin", templateVars);
});

app.post("/login", (req, res) => {
  for (let user in users) {
    if (users[user].email === req.body.email && users[user].password === req.body.password) {
      res.cookie('userEmail', users[user].id, {maxAge: 64000});
      let templateVars = {
        userEmail: res.cookie('userEmail', users[user].id, {maxAge: 64000}),
        urls: urlDatabase,
        usersInfo: users
      };
      res.redirect("/");  //,templateVars);
      return;
    } else if (users[user].email === req.body.email && users[user].password !== req.body.password) {
      res.status(403).send('Status code 403: this is not the right password!');
      return;
    } else if (users[user].email !== req.body.email) {
      continue;
    }
  }
  res.status(403).send('Status code 403: you do not seem to be a registered user!');
});

app.post("/logout", (req, res) => {
  res.cookie('userEmail', req.body.userEmail, {maxAge: 64000});
  let templateVars = {
    userEmail: req.cookies["userEmail"],
    urls: urlDatabase,
    usersInfo: users
  };
  res.clearCookie("userEmail");
  res.redirect("/");
});

app.get("/register", (req, res) => {
  let templateVars = {
    userEmail: req.cookies["userEmail"],
    urls: urlDatabase,
    usersInfo: users
  };
  res.render("login", templateVars);
});

app.post("/register", (req, res) => {
  let userRandomID = generateRandomString();
  let userEmail = req.body.email;
  let userPassword = req.body.password;
  if (!userEmail || !userPassword) {
    res.status(400).send('Status code 400: you need an email address and a password to register!')
  }
  for (let user in users) {
    if (users[user].email === userEmail) {
      res.status(400).send('Status code 400: this email address is already in use!');
      return;
    }
  }
    users[userRandomID] = {
    id: userRandomID,
    email: userEmail,
    password: userPassword
    }
  res.redirect("/");
});


app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}!`);
});
