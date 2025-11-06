#!/bin/bash
# Vercel build script for BizPlan Builder
# This compiles the PRODUCTION server entry point (no Vite dependencies)

# Create necessary directories
mkdir -p dist api/_server

# Copy static files (HTML, CSS, JS) to dist/
cp -r public/* dist/

# Compile the PRODUCTION TypeScript server to JavaScript
# Uses server/production.ts which has NO Vite imports
# --bundle includes application code (routes, storage, schemas)
# --packages=external keeps node_modules external (available at runtime)
npx esbuild server/production.ts \
  --outfile=api/_server/index.js \
  --platform=node \
  --format=esm \
  --bundle \
  --packages=external

echo "✅ Build complete: static files in dist/, serverless function in api/_server/"
echo "   Production build uses server/production.ts (NO Vite dependencies)"
