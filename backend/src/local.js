/**
 * Local Development Server for Group Expense Court Backend.
 * Runs Express directly on port 3001.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import app from './app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root if present
function loadEnv() {
  const rootEnv = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(rootEnv)) {
    const lines = fs.readFileSync(rootEnv, 'utf8').split('\n');
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

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n⚖️  Group Expense Court Backend running locally!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🩺 Health: http://localhost:${PORT}/api/health`);
  console.log(`📜 Press Ctrl+C to dismiss the court.\n`);
});

