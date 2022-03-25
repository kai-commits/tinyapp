const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const { generateRandomString, urlsForUser, getUserByEmail } = require("./helpers");

const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({ // Encrypts cookies
  name: 'session',
  keys: ['these', 'are', 'random', 'keys'],
  maxAge: 24 * 60 * 60 * 1000,
}));
app.set("view engine", "ejs");

// These are mock-databases that should eventually be stored as proper databases in the future
const urlDatabase = {};
const users = {};

// GET REQUESTS ----------------------------------------------------------------------------------------------------------
// Redirects the homepage to the urls page
app.get("/", (req, res) => { 
  if (!req.session.user_id) { // All checks for [if (req.sesson.user_id)] are to see if the user is logged in
    return res.redirect("/login");
  }
  res.redirect("/urls");
});

// Main page of app
app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.send("Not logged in. Please sign in <a href='/login'>Here!</a>");
  }
  const user_id = req.session.user_id;
  const urls = urlsForUser(user_id.id, urlDatabase);
  const templateVars = { user_id, urls };

  res.render("urls_index", templateVars);
});

// Create new URL page
app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  const user_id = req.session.user_id;
  const templateVars = { user_id };
  
  res.render("urls_new", templateVars);
});

// Create new user
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  const user_id = req.session.user_id;
  const templateVars = { user_id };
  
  res.render("register", templateVars);
});

// Login page
app.get("/login", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  const user_id = req.session.user_id;
  const templateVars = { user_id };
  
  res.render("login", templateVars);
});

// User created url and edit page
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

// Short url redirects to long url
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return res.send("Short URL does not exist!");
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;

  res.redirect(longURL);
});

// Catch for any pages that don't exist
app.get("*", (req, res) => {
  res.send("404: Page not found");
});

// POST REQUESTS ---------------------------------------------------------------------------------------------------
// When short URL is created, add url to database
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

// Add user to database
app.post("/register", (req, res) => {
  const id = generateRandomString(6);
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password); // hashes encrypted password

  if (!email || !req.body.password) {
  return res.send("Error: Input fields cannot be left blank. <a href='/register'>Please try again!</a>").status(400);
  }
  if (getUserByEmail(email, users)) {
    return res.send("Error: User with that email already exists. <a href='/register'>Please try again!</a>").status(400);
  }

  users[id] = { id, email, password };
  req.session.user_id = users[id]; // Sets user id to session cookie
  res.redirect("/urls");
});

// Login user
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  
  if (!getUserByEmail(email, users) || // Checks if user exists, email is correct, and password is correct
    !bcrypt.compareSync(password, getUserByEmail(email, users).password) ||
    getUserByEmail(email, users).email !== email) {
    return res.send("Error: Invalid credentials. <a href='/login'>Please try again!</a>").status(403);
  }
  req.session.user_id = users[getUserByEmail(email, users).id]; // Grabs user's credentials and sets it to session cookie
  res.redirect("/urls");
});

// Logout user
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// Removes url from database
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

// Updates existing url
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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
