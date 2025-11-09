# Overview

Contract Commander is an AI-powered legal contract drafting tool that generates professional, print-ready contracts (NDAs, Service Agreements, Employment Agreements, MOUs, Partnership Agreements) using OpenAI GPT-4o. The application features a gold/dark/white theme and produces clean legal documents with proper structure, formatting, and signature blocks. Users can export contracts as PDF or Word documents. The business vision is to provide a robust, AI-driven solution for common legal document needs, targeting individuals and small to medium-sized businesses.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Technology Stack**: Vanilla HTML, CSS, and JavaScript.
- **UI/UX Decisions**: Gold/dark/white color scheme, two-panel layout (desktop) / stacked (mobile), Montserrat for headings, Open Sans for body text. Modular CSS variables for branding.
- **Feature Specifications**: Responsive design, consistent form field heights, logical form sections (Contract Setup, Parties, Contract Terms, Legal Options, Signatures), professional PDF and Word export with standardized naming conventions and legal document margins (72pt/1 inch), clean 2-line footer. User branding feature for custom logos and letterheads with proper aspect ratio handling and professional sizing. Smart heading detection, orphan prevention, and refined footer positioning for PDF exports.
- **Technical Implementations**: Word export uses a modal-based download workaround. Keyboard shortcuts include Ctrl+Enter, Ctrl+S, Ctrl+N.

## Backend Architecture
- **Development Environment**: Express.js server.
- **Production Deployment**: Vercel serverless functions.
- **API Design**: RESTful endpoints with CORS headers.
- **Error Handling**: Input validation and structured error responses.

## Database and Storage
- **Database**: Supabase PostgreSQL.
- **ORM**: Drizzle ORM with PostgreSQL dialect.
- **Schema Management**: Drizzle-kit for migrations.
- **Report Persistence**: `compliance_reports` and `bizplan_reports` tables store generated reports (HTML content, metadata, timestamps).
- **Local Storage**: Browser localStorage for caching current working reports and branding configurations.
- **Environment Variables**: `pickEnv` helper for compatibility across Vite, Next.js, and Express.

## AI Integration
- **Provider**: OpenAI GPT-4o for content generation.
- **Super Smart AI Mode**: Dynamically handles state-specific legal information.
- **Hybrid Architecture**: Prioritizes pre-built filing profiles, falls back to AI.
- **Content Processing**: Structured 6-section JSON output (summary, checklist, timeline, riskMatrix, recommendations, references).

# External Dependencies

## Third-Party Services
- **OpenAI API**: GPT-4o model.
- **Vercel Platform**: Production deployment and serverless functions.
- **Supabase**: PostgreSQL database, authentication, and real-time capabilities.

## Development Tools
- **Package Management**: npm.
- **Build Tools**: Vite.
- **Language**: TypeScript.

## Deployment Infrastructure
- **DNS**: GoDaddy.
- **CDN**: Vercel's edge network.