/**
 * Receipt Scanning API Route (Amazon Textract AnalyzeExpense)
 */

import express from 'express';
import { scanReceipt } from '../textract.js';

const router = express.Router();

// POST /api/scan - Scan receipt image
router.post('/scan', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(200).json({
        items: [],
        extrasCents: 0,
        totalCents: 0,
        source: 'manual',
        message: 'No image provided. Please enter items manually.',
      });
    }

    const result = await scanReceipt(image);
    return res.status(200).json(result);
  } catch (err) {
    console.warn('[Scan Route] Caught unexpected error, falling back gracefully:', err.message);
    return res.status(200).json({
      items: [],
      extrasCents: 0,
      totalCents: 0,
      source: 'manual',
      message: 'Receipt scan failed gracefully. Please enter items manually.',
    });
  }
});

export default router;

