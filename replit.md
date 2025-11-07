# Overview

GrantGenie is a production-grade AI-powered platform for discovering and applying to grant opportunities. The system delivers professional compliance reports with database-backed report management, Panel=PDF WYSIWYG parity, and a responsive desktop-first UX where the results panel fills available screen space. Built with a blue and yellow theme for a professional, modern interface.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes (Phase 3 - v1.1.0)

## Core Framework Extraction (November 2025)
- **Centralized Clients**: All Supabase and OpenAI client initialization now lives in `/core/clients/`
  - `core/clients/supabase.ts` - Unified Supabase client with browser/server/auth variants
  - `core/clients/openai.ts` - Singleton OpenAI client with automatic API key handling
- **Shared Utilities**: Created `/core/utils/` for reusable functions
  - `core/utils/errors.ts` - HttpError class and response helpers
- **Configuration Management**: Centralized app config in `/core/config/index.ts`
  - TOOL_NAME, REPORT_CAP, RATE_LIMIT settings
- **PDF Layer**: Created `/core/pdf/export.ts` placeholder for future server-side PDF generation
- **Type Definitions**: Consolidated contract types in `/models/contracts.ts`
  - ContractInput, GeneratedContract, Party, Clause types
- **Backward Compatibility**: Legacy imports in `lib/supabase.ts` re-export from core
- **Build Status**: ✅ All builds pass, no LSP errors, runtime verified

# System Architecture

## Frontend Architecture
- **Technology Stack**: Pure vanilla HTML, CSS, and JavaScript with no frameworks for maximum compatibility and minimal dependencies
- **Component Structure**: Single-page application with modular CSS variables for consistent GrantGenie branding (light blue primary, yellow accents)
- **UI Framework**: Uses shadcn/ui components with React for the client-side application, alongside Tailwind CSS for styling
- **Design System**: Material Design principles with custom GrantGenie branding, featuring a two-panel layout (40% input, 60% results on desktop, stacked on mobile)
- **Typography**: Montserrat for headings, Open Sans for body text with defined font weights and sizing hierarchy

## Backend Architecture
- **Development Environment**: Express.js server for local Replit development with static file serving
- **Production Deployment**: Vercel serverless functions for production scaling and cost efficiency
- **API Design**: RESTful endpoints with proper CORS headers for iframe embedding compatibility
- **Error Handling**: Comprehensive input validation and structured error responses with appropriate HTTP status codes

## Database and Storage
- **Database**: Supabase PostgreSQL for production-grade data storage with automatic backups and scaling
- **ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Schema Management**: Database migrations handled through drizzle-kit with proper connection configuration
- **Report Persistence**: PostgreSQL compliance_reports table stores saved reports with name, entity details, jurisdiction, filing type, deadline, HTML content, checksum, metadata (JSON), and creation timestamp
- **BizPlan Reports**: PostgreSQL bizplan_reports table stores business plan reports with user ID, title, company, industry, HTML content, metadata, and timestamps
- **API Endpoints**: RESTful CRUD operations (/api/reports/save, /api/reports/list, /api/reports/:id) for report management
- **Local Storage**: Browser localStorage for caching current working report
- **Session Management**: PostgreSQL sessions with connect-pg-simple for user authentication (future feature)
- **Health Monitoring**: /api/health/db endpoint provides Supabase connection status and diagnostics
- **Environment Variables**: Smart pickEnv helper in lib/supabase.ts automatically detects and uses VITE_*, NEXT_PUBLIC_*, or standard SUPABASE_* variables for maximum compatibility across Vite, Next.js, and Express stacks

## Authentication and Authorization
- **User Management**: Supabase authentication with JWT tokens for secure user management (future feature)
- **Session Handling**: Server-side session storage using PostgreSQL with proper security configurations (future feature)
- **API Security**: Environment variable protection for sensitive keys (OpenAI API, database URLs)
- **Supabase Integration**: lib/supabase.ts provides universal browser and server clients with flexible pickEnv helper that works across Vite (VITE_*), Next.js (NEXT_PUBLIC_*), and Express (SUPABASE_*) environments
- **Deployment Ready**: No duplicate environment variables required - SUPABASE_URL/SUPABASE_ANON_KEY work for both server and browser contexts via smart fallback system

## AI Integration
- **Provider**: OpenAI GPT-4o integration for content generation
- **Super Smart AI Mode**: Enhanced AI system that dynamically handles ALL 50 states with state-specific forms, fees, deadlines, penalties, and official URLs
- **Hybrid Architecture**: Tries pre-built filing profiles first (e.g., California Annual Report), falls back to super smart AI for all other jurisdictions
- **API Management**: Centralized OpenAI client initialization with proper error handling and rate limiting
- **Content Processing**: Structured 6-section JSON output (summary, checklist, timeline, riskMatrix, recommendations, references) with Panel=PDF WYSIWYG parity

# External Dependencies

## Third-Party Services
- **OpenAI API**: GPT-4o model for AI-powered content generation with configurable API key management
- **Vercel Platform**: Production deployment and serverless function hosting with custom routing configuration
- **Supabase**: PostgreSQL database service with authentication, real-time capabilities, and automatic backups

## Development Tools
- **Package Management**: npm with lockfile for consistent dependency versions
- **Build Tools**: Vite for development server and build process with React plugin support
- **TypeScript**: Full TypeScript support with proper path aliases and type definitions
- **CSS Framework**: Tailwind CSS with custom design tokens and responsive utilities

## UI Components
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives for complex interactions
- **Lucide React**: Icon library providing consistent iconography across the application
- **React Hook Form**: Form validation and management with Zod schema validation
- **TanStack Query**: Server state management for API calls and caching strategies

## Deployment Infrastructure
- **DNS**: GoDaddy DNS management for custom domain routing
- **CDN**: Vercel's edge network for global content delivery and performance optimization
- **Static Assets**: Public folder structure for favicons, logos, and brand assets
- **Environment Management**: Separate development and production configurations with environment variable support