import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

// Enable SQLite Promises
SQLite.enablePromise(true);

const DATABASE_NAME = 'loadmaster.db';
let g_database: SQLiteDatabase | null = null;

export const initDatabase = async (): Promise<SQLiteDatabase> => {
  let databasePath: string = DATABASE_NAME;

  if (Platform.OS === 'android') {
    // Define writable location
    const writablePath = `${RNFS.DocumentDirectoryPath}/${DATABASE_NAME}`;

    // Check if DB already exists in writable location
    const exists = await RNFS.exists(writablePath);
    if (!exists) {
      // First run - copy the pre-populated DB from assets to writable location
      await RNFS.copyFileAssets(DATABASE_NAME, writablePath);
    }

    // Open the writable copy
    g_database = await SQLite.openDatabase({
      name: writablePath,
      location: 'default',
    });

    return g_database;
  } else if (Platform.OS === 'ios') {
    databasePath = DATABASE_NAME;
  } else if (Platform.OS === 'windows') {
    databasePath = `${RNFS.DocumentDirectoryPath}/${DATABASE_NAME}`;
    const exists = await RNFS.exists(databasePath);
    if (!exists) {
      const bundlePath = `ms-appx:///Assets/${DATABASE_NAME}`;
      await RNFS.copyFile(bundlePath, databasePath);
    }
  }

  try {
    g_database = await SQLite.openDatabase({
      name: DATABASE_NAME,
      location: 'default',
      createFromLocation: databasePath,
    });
    console.log('Database initialized successfully');
    return g_database;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const getDatabase = (): SQLiteDatabase => {
  if (!g_database) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return g_database;
};

export const executeQuery = async (query: string, params: any[] = []): Promise<any[]> => {
  const db = getDatabase();
  try {
    const [results] = await db.executeSql(query, params);
    const rows: any[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      rows.push(results.rows.item(i));
    }
    return rows;
  } catch (error) {
    console.error('Error executing query:', query, error);
    throw error;
  }
};
