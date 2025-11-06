import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { authenticateToken } from "./auth";

// Simple logger function
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();

// Trust proxy - Required for accurate IP detection behind Vercel/Replit proxies
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS Configuration
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = isProduction 
  ? [
      'https://grant.yourbizguru.com',
      'https://bizplan.yourbizguru.com',
      /\.vercel\.app$/, // Allow Vercel preview deployments
    ]
  : [
      'http://localhost:5000', 
      'http://localhost:5173',
      /\.replit\.dev$/, // Allow Replit development domains
    ];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      }
      return allowed.test(origin);
    });
    
    if (allowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Owner-Id', 'X-Client-Id'],
  credentials: true,
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Add authentication middleware
app.use(authenticateToken);

// Prevent aggressive caching of favicon and icon files
app.use((req, res, next) => {
  if (req.path.includes('favicon') || req.path.includes('apple-icon') || req.path.includes('chrome-')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize routes and middleware - PRODUCTION VERSION (NO VITE)
async function initializeApp() {
  const server = await registerRoutes(app);

  // Production-safe error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // Log full error server-side
    console.error('Server error:', {
      message: err.message,
      stack: err.stack,
      status,
    });
    
    // Return generic message in production, detailed in development
    if (process.env.NODE_ENV === 'production') {
      res.status(status).json({ 
        error: 'Something went wrong. Please try again later.' 
      });
    } else {
      res.status(status).json({ 
        error: err.message || 'Internal Server Error',
        stack: err.stack 
      });
    }
  });

  // Static files are served directly by Vercel from dist/ - no Express static middleware needed

  return server;
}

// Initialize app promise for Vercel serverless
// This ensures routes are registered before handling requests
let appInitPromise: Promise<any> | null = null;

export async function getInitializedApp() {
  if (!appInitPromise) {
    appInitPromise = initializeApp();
  }
  await appInitPromise;
  return app;
}

// Export the Express app for Vercel
export default app;
