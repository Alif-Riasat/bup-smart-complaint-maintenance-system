import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export function mysqlOptions(database) {
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: database || undefined,
    multipleStatements: true,
    dateStrings: true,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
  };
}

export const DB_NAME = process.env.DB_NAME || 'bup_maintenance';
