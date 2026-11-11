/**
 * API Client for Group Expense Court
 * Uses VITE_API_URL or defaults to current origin / proxy.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    return data;
  } catch (err) {
    console.error(`API request error on ${endpoint}:`, err);
    throw err;
  }
}

/**
 * Client-side receipt image resizer:
 * Resizes photo to max 1600px dimension and compresses to JPEG 0.8 quality
 * to strictly respect AWS API Gateway / Lambda 6MB / 10MB payload limits.
 */
export async function resizeImageToJpegBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const MAX_DIM = 1600;
        let { width, height } = img;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedBase64);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export const api = {
  // Health
  checkHealth: () => request('/api/health'),

  // Groups
  createGroup: (name) => request('/api/groups', { method: 'POST', body: JSON.stringify({ name }) }),
  joinGroup: (code, memberName) => request('/api/groups/join', { method: 'POST', body: JSON.stringify({ code, memberName }) }),
  getGroup: (code) => request(`/api/groups/${code}`),

  // Expenses
  createExpense: (code, data) => request(`/api/groups/${code}/expenses`, { method: 'POST', body: JSON.stringify(data) }),
  getExpense: (id) => request(`/api/expenses/${id}`),

  // Settle
  getSettlement: (code) => request(`/api/groups/${code}/settle`),
  markPaymentPaid: (paymentId) => request(`/api/payments/${paymentId}/paid`, { method: 'PATCH' }),

  // Claims (AI Debt Detective)
  fileClaim: (expenseId, data) => request(`/api/expenses/${expenseId}/claims`, { method: 'POST', body: JSON.stringify(data) }),
  getClaims: (expenseId) => request(`/api/expenses/${expenseId}/claims`),

  // Hall of Shame Leaderboard
  getLeaderboard: (code) => request(`/api/groups/${code}/leaderboard`),

  // Textract Scan
  scanReceipt: (base64Image) => request('/api/scan', { method: 'POST', body: JSON.stringify({ image: base64Image }) }),
};

