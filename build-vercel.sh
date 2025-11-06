#!/bin/bash
# Vercel build script for BizPlan Builder

# Create necessary directories
mkdir -p dist api/_server

# Copy static files (HTML, CSS, JS) to dist/
cp -r public/* dist/

# Compile TypeScript server to JavaScript for Vercel serverless function
# Use --bundle to include application code (routes, storage, shared schemas)
# External all node_modules packages (they'll be in the Vercel lambda environment)
npx esbuild server/index.ts \
  --outfile=api/_server/index.js \
  --platform=node \
  --format=esm \
  --bundle \
  --packages=external

echo "✅ Build complete: static files in dist/, serverless function in api/_server/"
