import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { DB_NAME, mysqlOptions } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, '..', 'database_schema.sql');

let conn;
try {
  conn = await mysql.createConnection(mysqlOptions());
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await conn.query(sql);
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS users FROM \`${DB_NAME}\`.USER`
  );
  console.log(`MySQL database "${DB_NAME}" is ready (${rows[0].users} users).`);
} catch (error) {
  console.error('Could not import database_schema.sql.');
  console.error(error.message);
  console.error('Set DB_HOST, DB_USER, and DB_PASSWORD in .env, then run npm run db:setup again.');
  process.exitCode = 1;
} finally {
  if (conn) await conn.end();
}
