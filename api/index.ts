// Vercel Serverless Function Entry Point
// Properly awaits Express app initialization before handling requests

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Import and await app initialization (ensures routes are registered)
  const { getInitializedApp } = await import('./_server/index.js');
  const app = await getInitializedApp();
  
  // Pass request to Express app
  return app(req, res);
}
