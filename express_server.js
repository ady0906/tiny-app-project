var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");

function generateRandomString() {
  return Math.random().toString(36).slice(2,8);
}

app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.redirect("urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// app.get("/hello", (req, res) => {
//   res.end("<html><body>Hello <b>World</b></body></html>\n");
// });

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  // console.log("urls/new");
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  console.log('params', req.params.id);
  let templateVars = {shortURL: req.params.id,
                      longURL: urlDatabase};
  console.log(templateVars);
  res.render("urls_show", {templateVars: templateVars});
});

app.post("/urls", (req, res) => { // is that referring to /urls/create
  // console.log(req.body.longURL);
  let longURL = req.body.longURL;
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.id];
  var magicCode = req.params.shortURL;
  console.log(req.params.shortURL);
  res.redirect(urlDatabase[magicCode]);
  // res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}!`);
});
