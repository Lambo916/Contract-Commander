// Health check endpoint for Vercel monitoring
export default async function handler() {
  return new Response(JSON.stringify({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'BizPlan Builder API'
  }), { 
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
