/**
 * AWS Lambda Handler for Group Expense Court Backend.
 * Wraps the Express app using serverless-http for AWS API Gateway HTTP API.
 */

import serverless from 'serverless-http';
import app from './app.js';

export const handler = serverless(app);
