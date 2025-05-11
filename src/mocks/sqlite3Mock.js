// src/mocks/sqlite3Mock.js
const sqlite3Mock = {
  // Empty mock implementation
  Database: function() {
    return {};
  },
  verbose: function() {
    return this;
  },
};

module.exports = sqlite3Mock;
