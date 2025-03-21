import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

// This is a mock implementation for the legacy tests
export interface DatabaseInterface {
  executeQuery(query: string, params?: any[]): Promise<any[]>;
}

export class DatabaseFactory {
  private static instance: DatabaseInterface | null = null;

  static async getDatabase(): Promise<DatabaseInterface> {
    if (!this.instance) {
      const mockDb = {
        async executeQuery(query: string, params: any[] = []): Promise<any[]> {
          const db = getDatabase();
          const [results] = await db.executeSql(query, params);
          const rows: any[] = [];
          for (let i = 0; i < results.rows.length; i++) {
            rows.push(results.rows.item(i));
          }
          return rows;
        }
      };
      this.instance = mockDb;
    }
    return this.instance;
  }
}

// Global database reference
let g_database: SQLiteDatabase | null = null;

// This implementation closely matches what legacy tests expect
export const initDatabase = async (): Promise<SQLiteDatabase> => {
  if (Platform.OS === 'android') {
    const writablePath = `${RNFS.DocumentDirectoryPath}/loadmaster.db`;
    // Check if DB exists
    await RNFS.exists(writablePath);
    if (!(await RNFS.exists(writablePath))) {
      // If it doesn't exist, copy it from assets
      await RNFS.copyFileAssets('loadmaster.db', writablePath);
    }
    g_database = await SQLite.openDatabase({
      name: writablePath,
      location: 'default',
    });
    return g_database;
  } else if (Platform.OS === 'ios') {
    g_database = await SQLite.openDatabase({
      name: 'loadmaster.db',
      location: 'default',
      createFromLocation: 'loadmaster.db',
    });
    return g_database;
  } else if (Platform.OS === 'windows') {
    const windowsPath = `${RNFS.DocumentDirectoryPath}/loadmaster.db`;
    // Check if DB exists
    await RNFS.exists(windowsPath);
    if (!(await RNFS.exists(windowsPath))) {
      // If it doesn't exist, copy it from assets
      await RNFS.copyFile('ms-appx:///Assets/loadmaster.db', windowsPath);
    }
    g_database = await SQLite.openDatabase({
      name: 'loadmaster.db',
      location: 'default',
      createFromLocation: windowsPath,
    });
    return g_database;
  }

  // Default case
  g_database = await SQLite.openDatabase({
    name: 'loadmaster.db',
    location: 'default',
  });
  return g_database;
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