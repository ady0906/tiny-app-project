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

const users = {};

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    userID: req.cookies["userID"],
    usersDatabase: users
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    userID: req.cookies["userID"],
    urls: users[req.cookies["userID"]].urls,
    usersDatabase: users
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    userID: req.cookies["userID"],
    urls: users[req.cookies["userID"]].urls,
    usersDatabase: users
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  let userID = req.cookies["userID"];
  users[userID].urls[shortURL] = longURL;
  let templateVars = {
    userID: req.cookies["userID"],
    urls: users[userID].urls,
    usersDatabase: users
  };
  res.redirect(`/urls/${shortURL}`);
});

// SHOULD REMAIN ACCESSIBLE TO EVERYONE
app.get("/u/:shortURL", (req, res) => {
  let userID = req.cookie["userID"];
  let longURL = users[userID].urls[req.params.id];
  let magicCode = req.params.shortURL;
  res.redirect(users.[userID].urls[magicCode]);
});

// SHOULD CORRECT THE LOGIC TO MAKE IT WORK WITH USERS
app.post("/urls/:id/delete", (req, res) => {
  let templateVars = {
    userID: req.cookies["userID"],
    urls: users[userID].urls,
    usersDatabase: users
  };
  let key = req.params.id;
  delete users[userID].urls[key];
  res.redirect('/urls');
});

// SORT OUT THE DELETE OPERATION
app.post("/urls/:id", (req, res) => {
  let key = req.params.id;
  let userID = req.cookies["userID"];
  delete users[userID].urls[key];
  let updatedURL = req.body.updatedURL;
  let updatedShort = generateRandomString();
  users[userID].urls[updatedShort] = updatedURL;
  let templateVars = {
    userID: req.cookies["userID"],
    urls: users[userID].urls,
    usersDatabase: users
  };
  res.redirect('/urls');
});

app.get("/login", (req, res) => {
  let templateVars = {
    userID: req.cookies["userID"],
    usersDatabase: users
  };
  res.render("actuallogin", templateVars);
});

app.post("/login", (req, res) => {
  for (let user in users) {
    if (users[user].email === req.body.email && users[user].password === req.body.password) {
      res.cookie('userID', users[user].id, {maxAge: 64000});
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
  res.cookie('userID', req.body.userID, {maxAge: 64000});
  let templateVars = {
    usersDatabase: users
  };
  res.clearCookie("userID");
  res.redirect("/");
});

app.get("/register", (req, res) => {
  let templateVars = {
    userID: false,
    // urls: users[userID].urls,
    usersDatabase: users
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
    password: userPassword,
    urls: {}
  }
  res.redirect("/");
});


app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}!`);
});
