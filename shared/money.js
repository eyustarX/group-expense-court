/**
 * Money utilities for Group Expense Court.
 * All internal money values are INTEGER CENTS (BIGINT / integer numbers) to prevent
 * floating-point rounding errors.
 * Currency: Ethiopian Birr (ETB). 1 Birr = 100 Cents.
 */

/**
 * Converts a Birr amount (number or string like "562.50") into integer cents.
 * e.g., 562.50 -> 56250
 *
 * @param {number|string} birr
 * @returns {number} Integer cents
 */
export function toCents(birr) {
  if (birr === null || birr === undefined) {
    throw new Error('Amount cannot be null or undefined');
  }

  if (typeof birr === 'string') {
    // Strip currency symbols, spaces, and commas
    const cleaned = birr.replace(/[ETB\s,]/gi, '').trim();
    if (cleaned === '') {
      throw new Error('Empty amount string');
    }
    const parsed = Number(cleaned);
    if (Number.isNaN(parsed)) {
      throw new Error(`Invalid monetary amount string: "${birr}"`);
    }
    return Math.round(parsed * 100);
  }

  const num = Number(birr);
  if (Number.isNaN(num)) {
    throw new Error(`Invalid monetary amount: ${birr}`);
  }
  return Math.round(num * 100);
}

/**
 * Formats an integer cents amount to ETB currency string.
 * e.g., 56250 -> "562.50 ETB"
 * e.g., -45000 -> "-450.00 ETB"
 *
 * @param {number|bigint|string} cents
 * @returns {string} Formatted string
 */
export function formatETB(cents) {
  const num = Number(cents ?? 0);
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(Math.round(num));
  const birr = Math.floor(abs / 100);
  const rem = abs % 100;
  return `${sign}${birr}.${rem.toString().padStart(2, '0')} ETB`;
}

