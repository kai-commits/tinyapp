const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}), cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { username: req.cookies["username"], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  console.log(req.body);
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username", req.body.username);
  res.redirect("/urls");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { username: req.cookies["username"], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL/update", (req, res) => {
  console.log(req.body);
  urlDatabase[req.params.shortURL] = req.body.newURL;
  res.redirect("/urls");
});

const generateRandomString = () => {
  const lenOfStr = 6;
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < lenOfStr; i ++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});