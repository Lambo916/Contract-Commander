// Shared configuration constants for Contract Commander
// These can be overridden via environment variables

export const TOOL_NAME = process.env.TOOL_NAME ?? 'Contract Commander';

export const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL ?? '';

// Per-tool report generation limits (30 reports per IP per tool)
export const REPORT_CAP = Number(process.env.REPORT_CAP ?? 30);

// Rate limiting configuration
export const RATE_LIMIT_WINDOW = Number(process.env.RATE_LIMIT_WINDOW ?? 60); // seconds
export const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 10);

// Server configuration
export const PORT = Number(process.env.PORT ?? 5000);

// Environment
export const NODE_ENV = process.env.NODE_ENV ?? 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_DEVELOPMENT = NODE_ENV === 'development';
