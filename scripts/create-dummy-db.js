const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Ensure directory exists
const dbDir = path.join(__dirname, '../assets/database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'loadmaster.db');

// Delete existing database if it exists
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

// Create a new database
const db = new sqlite3.Database(dbPath);

// Create tables and insert sample data
db.serialize(() => {
  // Create products table
  db.run(`CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    weight REAL
  )`);

  // Create categories table
  db.run(`CREATE TABLE categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT
  )`);

  // Insert sample data
  const products = [
    { name: 'Product 1', description: 'Description for product 1', weight: 5.2 },
    { name: 'Product 2', description: 'Description for product 2', weight: 3.8 },
    { name: 'Product 3', description: 'Description for product 3', weight: 7.1 },
  ];

  const categories = [
    { name: 'Category 1', description: 'First category' },
    { name: 'Category 2', description: 'Second category' },
  ];

  // Insert products
  const productStmt = db.prepare('INSERT INTO products (name, description, weight) VALUES (?, ?, ?)');
  products.forEach(product => {
    productStmt.run(product.name, product.description, product.weight);
  });
  productStmt.finalize();

  // Insert categories
  const categoryStmt = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
  categories.forEach(category => {
    categoryStmt.run(category.name, category.description);
  });
  categoryStmt.finalize();
});

// Close the database
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log(`Database created at ${dbPath}`);
  }
});
