/**
 * Express Application Configuration for Group Expense Court.
 *
 * Runs locally via `node src/local.js` or in AWS Lambda via `src/lambda.js` (serverless-http).
 */

import express from 'express';
import cors from 'cors';
import { query, isNeonConfigured } from './db.js';

// Route modules
import groupsRouter from './routes/groups.js';
import expensesRouter from './routes/expenses.js';
import settleRouter from './routes/settle.js';
import claimsRouter from './routes/claims.js';
import leaderboardRouter from './routes/leaderboard.js';
import scanRouter from './routes/scan.js';

const app = express();

// Security & Body parsing
const allowedOrigin = process.env.FRONTEND_ORIGIN || '*';
app.use(
  cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Support large image payloads up to 10MB for base64 receipts
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check & Neon Warm-Up
app.get('/api/health', async (req, res) => {
  try {
    let dbConnected = false;
    if (isNeonConfigured()) {
      await query('SELECT 1');
      dbConnected = true;
    }
    return res.json({
      ok: true,
      status: 'Court is in session',
      neon: dbConnected,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Health check database warm-up error:', err.message);
    return res.status(200).json({
      ok: true,
      status: 'Court is in session (DB warm-up warning)',
      neon: false,
      error: err.message,
    });
  }
});

// Mount Court API Routes
app.use('/api', groupsRouter);
app.use('/api', expensesRouter);
app.use('/api', settleRouter);
app.use('/api', claimsRouter);
app.use('/api', leaderboardRouter);
app.use('/api', scanRouter);

// 404 Handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Court API endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Courtroom Exception:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Courtroom Error';
  res.status(status).json({ error: message });
});

export default app;
