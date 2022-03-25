const generateRandomString = (length) => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i ++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

const urlsForUser = (id, database) => {
  const results = {};
  const keys = Object.keys(database);
  for (const url of keys) {
    if (database[url].userID === id) {
      results[url] = database[url].longURL;
    }
  }
  return results;
};

const getUserByEmail = (email, database) => {
  const values = Object.values(database);
  for (const user of values) {
    if (user.email === email) {
      return user;
    }
  }
  return null;
}

module.exports = { generateRandomString, urlsForUser, getUserByEmail };
