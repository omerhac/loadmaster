// src/mocks/better-sqlite3Mock.js
/**
 * This is a complete mock for the better-sqlite3 package that doesn't
 * rely on any native Node.js modules like fs or path
 */

// Mock SQLite error
class SqliteError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'SqliteError';
    this.code = code || 'UNKNOWN';
  }
}

// Mock statement
class Statement {
  constructor() {
    this.source = '';
    this.database = null;
    this.reader = false;
  }

  run(...params) {
    return { changes: 0, lastInsertRowid: 0 };
  }

  get(...params) {
    return null;
  }

  all(...params) {
    return [];
  }

  iterate(...params) {
    return [];
  }

  pluck(toggleState) {
    return this;
  }

  expand(toggleState) {
    return this;
  }

  raw(toggleState) {
    return this;
  }

  bind(...params) {
    return this;
  }

  columns() {
    return [];
  }
}

// Mock database
class Database {
  constructor(filename, options) {
    this.name = filename || ':memory:';
    this.open = true;
    this.inTransaction = false;
    this.readonly = options?.readonly || false;
  }

  prepare(source) {
    return new Statement();
  }

  transaction(fn) {
    return typeof fn === 'function' ? fn : function() {};
  }

  exec(source) {
    return this;
  }

  pragma(source, simplify) {
    return simplify ? {} : [{}];
  }

  function(name, fn) {
    return this;
  }

  aggregate(name, options) {
    return this;
  }

  table(name, factory) {
    return {};
  }

  close() {
    this.open = false;
    return this;
  }

  defaultSafeIntegers(toggleState) {
    return this;
  }

  backup(destination, options) {
    return {
      transfer: () => 0,
      then: (resolve) => resolve(),
      catch: (reject) => {}
    };
  }
}

// Main export
function betterSqlite3(filename, options) {
  return new Database(filename, options);
}

// Add utility properties and functions
betterSqlite3.SqliteError = SqliteError;
betterSqlite3.Database = Database;
betterSqlite3.Statement = Statement;

module.exports = betterSqlite3; 