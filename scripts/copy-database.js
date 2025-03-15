const fs = require('fs');
const path = require('path');

// Source database file
const sourceDbPath = path.join(__dirname, '../src/assets/database/loadmaster.db');

// Destination paths for each platform
const destinations = [
  {
    platform: 'Android',
    path: path.join(__dirname, '../android/app/src/main/assets/loadmaster.db'),
    directory: path.join(__dirname, '../android/app/src/main/assets')
  },
  {
    platform: 'iOS',
    path: path.join(__dirname, '../ios/loadmaster/loadmaster.db'),
    directory: path.join(__dirname, '../ios/loadmaster')
  },
  {
    platform: 'Windows',
    path: path.join(__dirname, '../windows/loadmaster/Assets/loadmaster.db'),
    directory: path.join(__dirname, '../windows/loadmaster/Assets')
  }
];

// Check if source file exists
if (!fs.existsSync(sourceDbPath)) {
  console.error(`Source database not found at ${sourceDbPath}`);
  console.log('Run "node scripts/create-dummy-db.js" first to create the database');
  process.exit(1);
}

// Copy file to each destination
destinations.forEach(dest => {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(dest.directory)) {
      fs.mkdirSync(dest.directory, { recursive: true });
    }
    
    // Copy the file
    fs.copyFileSync(sourceDbPath, dest.path);
    console.log(`Successfully copied database to ${dest.platform} location: ${dest.path}`);
  } catch (error) {
    console.error(`Error copying to ${dest.platform}:`, error.message);
  }
});

console.log('Database copy process completed'); 