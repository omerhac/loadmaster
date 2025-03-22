/**
 * Database operations for User entities
 */

import { DatabaseFactory } from '../DatabaseService';
import { DatabaseResponse } from '../DatabaseTypes';
import { User } from './types';

/**
 * Create a new user
 */
export async function createUser(user: User): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  const sql = `
    INSERT INTO user (username, last_login)
    VALUES (?, ?);
  `;
  return db.executeQuery(sql, [user.username, user.last_login || null]);
}

/**
 * Get user by ID
 */
export async function getUserById(id: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('SELECT * FROM user WHERE id = ?;', [id]);
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('SELECT * FROM user WHERE username = ?;', [username]);
}

/**
 * Update user
 */
export async function updateUser(user: User): Promise<DatabaseResponse> {
  if (!user.id) {
    throw new Error('User ID is required for update');
  }

  const db = await DatabaseFactory.getDatabase();
  const sql = `
    UPDATE user
    SET username = ?, last_login = ?
    WHERE id = ?;
  `;
  return db.executeQuery(sql, [user.username, user.last_login || null, user.id]);
}

/**
 * Delete user
 */
export async function deleteUser(id: number): Promise<DatabaseResponse> {
  const db = await DatabaseFactory.getDatabase();
  return db.executeQuery('DELETE FROM user WHERE id = ?;', [id]);
}
