// Vercel Serverless Function Entry Point
// Simple JavaScript handler without TypeScript complexity

export default async function handler(req, res) {
  // Lazy load the Express app
  const { getInitializedApp } = await import('./_server/index.js');
  const app = await getInitializedApp();
  
  // Pass request to Express app
  return app(req, res);
}