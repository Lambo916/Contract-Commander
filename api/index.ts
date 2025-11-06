// Vercel Serverless Function Entry Point
// Wraps Express app in Vercel-compatible handler

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Dynamic import to handle async initialization
let appPromise: Promise<any> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = import('./_server/index.js').then(module => module.default);
  }
  return appPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();
  return app(req, res);
}
