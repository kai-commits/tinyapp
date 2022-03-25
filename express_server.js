const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['these', 'are', 'random', 'keys'],
  maxAge: 24 * 60 * 60 * 1000,
}));
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
    password: "$2a$10$G6baTP5jb8KclekGKqYcgOYhmV1jrQ7tOF9sWMiS4EJaC8NfsY3qS" // === 'test'
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const generateRandomString = (length) => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i ++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

const urlsForUser = (id) => {
  const results = {};
  const keys = Object.keys(urlDatabase);
  for (const url of keys) {
    if (urlDatabase[url].userID === id) {
      results[url] = urlDatabase[url].longURL;
    }
  }
  return results;
};

const getUserByEmail = (email) => {
  const values = Object.values(users);
  for (const user of values) {
    if (user.email === email) {
      return user;
    }
  }
  return null;
}

app.get("/", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.send("Not logged in. Please sign in <a href='/login'>Here!</a>");
  }
  const user_id = req.session.user_id;
  const urls = urlsForUser(user_id.id);
  const templateVars = { user_id, urls };

  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.send("Error: Need to be valid user").status(400);
  }
  const shortURL = generateRandomString(6);
  const longURL = req.body.longURL;
  const userID = req.session.user_id.id;

  urlDatabase[shortURL] = { longURL, userID };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  const user_id = req.session.user_id;
  const templateVars = { user_id };
  
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  const user_id = req.session.user_id;
  const templateVars = { user_id };
  
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const id = generateRandomString(6);
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password);

  if (!email || !password) {
  return res.send("Error: Input fields cannot be left blank. <a href='/register'>Please try again!</a>").status(400);
  }
  if (getUserByEmail(email)) {
    return res.send("Error: User with that email already exists. <a href='/register'>Please try again!</a>").status(400);
  }

  users[id] = { id, email, password };
  req.session.user_id = users[id];
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  const user_id = req.session.user_id;
  const templateVars = { user_id };
  
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  
  if (!getUserByEmail(email) || !bcrypt.compareSync(password, getUserByEmail(email).password) || getUserByEmail(email).email !== email) {
    return res.send("Error: Invalid credentials. <a href='/login'>Please try again!</a>").status(403);
  }
  req.session.user_id = users[getUserByEmail(email).id];
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/urls/:shortURL", (req, res) => {
  if (!req.session.user_id) {
    return res.send("Not logged in. Please sign in <a href='/login'>Here!</a>");
  }
  if (!urlDatabase[req.params.shortURL]) {
    return res.send("Error: Short URL does not exist. <a href='/urls'>Please try again!</a>").status(400);
  }
  if (req.session.user_id.id !== urlDatabase[req.params.shortURL].userID) {
    return res.send("Error: You do not own that URL. <a href='/urls'>Please try again!</a>").status(400);
  }
  const user_id = req.session.user_id;
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const templateVars = { user_id, shortURL, longURL };

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
  if (!req.session.user_id) {
    return res.send("Error: Not valid user");
  }
  if (req.session.user_id.id !== urlDatabase[req.params.shortURL].userID) {
    return res.send("Error: You do not own that URL. ").status(400);
  }
  delete urlDatabase[req.params.shortURL];

  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  if (!req.session.user_id) {
    return res.send("Error: Not valid user").status(400);
  }
  if (req.session.user_id.id !== urlDatabase[req.params.shortURL].userID) {
    return res.send("Error: You do not own that URL. ").status(400);
  }
  const shortURL = req.params.shortURL;
  const newURL = req.body.newURL;
  urlDatabase[shortURL].longURL = newURL;
  
  res.redirect("/urls");
});

app.get("*", (req, res) => {
  res.send("404: Page not found");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});