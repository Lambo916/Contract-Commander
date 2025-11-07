// HTTP error class for consistent error handling across the application
export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

// Wrapper to convert async function results to HTTP responses
// Useful for serverless/edge functions
export function toHttpResponse<T>(fn: () => Promise<T>) {
  return async () => {
    try {
      const data = await fn();
      return new Response(JSON.stringify({ ok: true, data }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    } catch (err: any) {
      const status = err?.status ?? 500;
      return new Response(JSON.stringify({ ok: false, error: err?.message ?? 'Server error' }), {
        status,
        headers: { 'content-type': 'application/json' },
      });
    }
  };
}

// Express-compatible error response helper
export function sendErrorResponse(res: any, error: any) {
  const status = error?.status || error?.statusCode || 500;
  const message = error?.message || 'Internal server error';
  
  return res.status(status).json({
    ok: false,
    error: message,
    ...(error?.details && { details: error.details }),
  });
}
