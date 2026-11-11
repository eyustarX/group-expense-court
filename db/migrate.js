/**
 * Database Migration Script for Group Expense Court.
 *
 * Runs db/schema.sql (and optionally db/seed.sql) against the Neon Postgres database
 * specified by the DATABASE_URL environment variable.
 *
 * Usage:
 *   node db/migrate.js
 *   node db/migrate.js --seed
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool, neon } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load .env file if present
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('\n❌ ERROR: DATABASE_URL is not set.');
  console.error('Please configure DATABASE_URL in your .env file or environment.\n');
  console.error('Example:');
  console.error('DATABASE_URL=postgresql://user:password@ep-court.us-east-1.aws.neon.tech/court_db?sslmode=require\n');
  process.exit(1);
}

const shouldSeed = process.argv.includes('--seed');

async function runMigration() {
  console.log('🏛️  Group Expense Court - Database Migration');
  console.log('Connecting to Neon PostgreSQL database...');

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    console.log(`Reading schema from: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema.sql...');
    await pool.query(schemaSql);
    console.log('✅ Schema migration completed successfully.');

    if (shouldSeed) {
      const seedPath = path.resolve(__dirname, 'seed.sql');
      console.log(`Reading seed data from: ${seedPath}`);
      const seedSql = fs.readFileSync(seedPath, 'utf8');

      console.log('Executing seed.sql (COURT-4821 Demo Court)...');
      await pool.query(seedSql);
      console.log('✅ Demo seed data inserted successfully.');
    }
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

