const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { application } = require("express");
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}), cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const generateRandomString = () => {
  const lenOfStr = 6;
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < lenOfStr; i ++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

const emailExists = (email) => {
  for (const user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};

app.get("/urls", (req, res) => {
  const templateVars = { user_id: req.cookies["user_id"], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  console.log(req.body);
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user_id: req.cookies["user_id"] };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { user_id: req.cookies["user_id"] };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const randomID = generateRandomString();
  const userEmail = req.body.email;
  const userPassword = req.body.password;

  if (userEmail === '' || userPassword === '' || emailExists(userEmail)) {
    return res.sendStatus(400);
  }

  users[randomID] = { id: randomID, email: userEmail, password: userPassword };
  res.cookie("user_id", users[randomID]);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const templateVars = { user_id: req.cookies["user_id"] };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  
  if (emailExists(userEmail)) {
    for (const user in users) {
      if (users[user].password === userPassword && users[user].email === userEmail) {
        res.cookie("user_id", users[user]);
        res.redirect("/urls");
        return;
      }
    }
  }
  return res.sendStatus(403);
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { user_id: req.cookies["user_id"], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});