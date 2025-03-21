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

  // Create a special test_markers table to identify this as the loadmaster.db file
  db.run(`CREATE TABLE test_markers (
    id INTEGER PRIMARY KEY,
    marker_name TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);

  // Insert sample data
  const products = [
    { name: 'Product 1', description: 'Description for product 1', weight: 5.2 },
    { name: 'Product 2', description: 'Description for product 2', weight: 3.8 },
    { name: 'Product 3', description: 'Description for product 3', weight: 7.1 },
    { name: 'LoadMaster Special Product', description: 'This is a unique product only found in loadmaster.db', weight: 9.9 },
  ];

  const categories = [
    { name: 'Category 1', description: 'First category' },
    { name: 'Category 2', description: 'Second category' },
    { name: 'LoadMaster Special Category', description: 'This category only exists in the loadmaster.db file' },
  ];

  // Insert a unique test marker to verify we're reading from this specific database
  const testMarkers = [
    {
      marker_name: 'database_version',
      value: '1.0',
      created_at: new Date().toISOString(),
    },
    {
      marker_name: 'database_id',
      value: `loadmaster-${Date.now()}`,
      created_at: new Date().toISOString(),
    },
    {
      marker_name: 'unique_test_marker',
      value: 'LoadMaster Special Test Database',
      created_at: new Date().toISOString(),
    },
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

  // Insert test markers
  const markerStmt = db.prepare('INSERT INTO test_markers (marker_name, value, created_at) VALUES (?, ?, ?)');
  testMarkers.forEach(marker => {
    markerStmt.run(marker.marker_name, marker.value, marker.created_at);
  });
  markerStmt.finalize();
});

// Close the database
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log(`Database created at ${dbPath}`);
  }
});
