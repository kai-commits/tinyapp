const { assert } = require('chai');

const { generateRandomString, urlsForUser, getUserByEmail } = require('../helpers.js');

const testUrlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userRandomID"
  } 
};

const testUsers = {
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

describe('generateRandomString', () => {
  it('returns a string of correct length', () => {
    const string = generateRandomString(6);
    assert.equal(string.length, 6);
  });
});

describe('urlsForUser', () => {
  it('returns object with correct shortURL-longURL pairs', () => {
    const id = 'userRandomID';
    const urls = urlsForUser(id, testUrlDatabase);
    const expected = { 'b2xVn2': 'http://www.lighthouselabs.ca', '9sm5xK': 'http://www.google.com' };
    assert.deepEqual(urls, expected);
  });
});

describe('getUserByEmail', () => {
  it('returns a user with registered email', () => {
    const user = getUserByEmail('user@example.com', testUsers);
    const expectedUserID = 'userRandomID';
    assert.equal(user.id, expectedUserID);
  });
  it('returns null with non-registered email', () => {
    const user = getUserByEmail('invalid@email.com', testUsers);
    assert.isNull(user);
  });
  it('returns null with empty email', () => {
    const user = getUserByEmail('', testUsers);
    assert.isNull(user);
  });
});
