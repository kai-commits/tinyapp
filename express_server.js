const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}), cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userRandomID"
  } 
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "test"
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

const urlsForUser = (id) => {
  let urls = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      urls[url] = urlDatabase[url].longURL;
    }
  }
  return urls;
};

app.get("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.redirect("/login");
  }

  const templateVars = { user_id: req.cookies["user_id"], urls: urlsForUser(req.cookies["user_id"].id) };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.send("Error: Need to be valid user\n");
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.cookies["user_id"].id };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user_id: req.cookies["user_id"] };
  if (!req.cookies["user_id"]) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = { user_id: req.cookies["user_id"] };
  if (req.cookies["user_id"]) {
    return res.redirect("/urls");
  }
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const randomID = generateRandomString();
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(userPassword);

  if (userEmail === '' || userPassword === '') return res.send("Error: Input fields cannot be left blank").status(400);
  if (emailExists(userEmail)) return res.send("Error: User with that email already exists").status(400);

  users[randomID] = { id: randomID, email: userEmail, password: hashedPassword };
  res.cookie("user_id", users[randomID]);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const templateVars = { user_id: req.cookies["user_id"] };
  if (req.cookies["user_id"]) {
    return res.redirect("/urls");
  }
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  
  if (emailExists(userEmail)) {
    for (const user in users) {
      if (bcrypt.compareSync(userPassword, users[user].password) && users[user].email === userEmail) {
        res.cookie("user_id", users[user]);
        res.redirect("/urls");
        return;
      }
    }
  }
  return res.send("Error: Invalid email or password").status(403);
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/urls/:shortURL", (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.redirect("/login");
  }
  if (req.cookies["user_id"].id !== urlDatabase[req.params.shortURL].userID) {
    return res.redirect("/urls");
  }
  const templateVars = { user_id: req.cookies["user_id"], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.send("Short URL does not exist!");
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.send("Error: Not valid user\n");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL/update", (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.send("Error: Not valid user\n");
  }
  urlDatabase[req.params.shortURL] = req.body.newURL;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});