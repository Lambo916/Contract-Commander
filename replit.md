# Overview

Contract Commander is an AI-powered legal contract drafting tool that generates professional, print-ready contracts (NDAs, Service Agreements, Employment Agreements, MOUs, Partnership Agreements) using OpenAI GPT-4o. The application features a gold/dark/white theme and produces clean legal documents with proper structure, formatting, and signature blocks. Users can export contracts as PDF or Word documents. The business vision is to provide a robust, AI-driven solution for common legal document needs, targeting individuals and small to medium-sized businesses.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes (November 2025)

## User Branding Feature v1.1 - DocuSign-Grade Logo & Letterhead (November 2025)
- **Critical Logo Aspect Ratio Fix**: Eliminated logo warping/stretching
  - Implemented async image loading to get actual logo dimensions before rendering
  - Calculates proper scaling to preserve true aspect ratio (not forced 3:1)
  - Supports any logo shape: square, horizontal, vertical, etc.
  - addHeader() function now async with await calls throughout
- **Professional Size Optimization**: Reduced logo to DocuSign/Adobe standards
  - Logo max height reduced from 90px to 55px for modern professional appearance
  - Prevents logo from dominating header while maintaining visibility
  - Scales width automatically based on actual aspect ratio
- **Refined Typography**: Smaller, tighter fonts for professional letterhead
  - Company name: 9pt bold in #333 (professional dark gray)
  - Address/contact: 8pt normal in #666 (medium gray)
  - Line height reduced to 10pt for compact spacing
  - 2pt vertical offset for better logo-text baseline alignment
- **Optimized Spacing**: DocuSign-style compact layout
  - Header starts at 32pt from top (down from 40pt)
  - Logo-to-text gap reduced to 10pt (down from 15pt)
  - Divider positioned 6pt below header (down from 8pt)
  - Professional light gray divider (#ddd) for clean separation
- **Implementation Quality**: Production-ready PDF export system
  - Async/await pattern ensures images load before dimensions are calculated
  - Fallback dimensions (150x50) if image fails to load
  - No forced aspect ratios - preserves whatever logo user uploads
  - All branding rendering is DocuSign/Adobe Acrobat professional grade

## PDF Export Formatting v2.0 - Professional Layout & Spacing (November 2025)
- **Compact, Professional Layout**: Reduced margins and spacing for modern SaaS-style contract exports
  - Margins reduced from 72pt (1 inch) to 54pt (0.75 inch) for better space utilization
  - Title font size optimized to 15pt with compact 18pt spacing
  - Meta line font reduced to 10pt with 14pt spacing
  - Header starts at 40pt from top for professional appearance
- **Optimized Typography**: Improved readability with tighter, balanced spacing
  - Body text line height: 14.5pt (~1.32 ratio for 11pt font) for optimal readability
  - Paragraph spacing: 6pt for compact yet readable layout
  - Letterhead text: 9.5pt bold company name, 8.7pt address/contact
  - Letterhead line height: 11.5pt for compact header
- **Improved Logo Rendering**: Smaller, proportional logo display
  - Logo height: 90px (down from 180px wide) with maintained 3:1 aspect ratio
  - Prevents logo from dominating the page
  - Professional sizing similar to DocuSign/PandaDoc templates
- **Smart Page Breaks**: Enhanced pagination logic
  - Footer detection threshold reduced to 120pt for better space usage
  - New pages start at 16pt offset for consistent flow
  - Prevents awkward page breaks and empty spaces
- **Refined Footer**: Compact legal disclaimer positioning
  - Footer positioned at 100pt from bottom (up from 120pt)
  - Font size: 8.5pt with 10.5pt line spacing
  - Divider positioned 8pt above footer text

## User Branding Feature v1.0 - Custom Logo & Letterhead (Phase 1 & 2 ✅ Complete)
- **Client Letterhead Customization**: Users can now add their own branding to exported PDFs
  - Logo upload (PNG/JPEG, max 1MB) with Base64 storage in localStorage
  - SVG detection with user-friendly warning (not yet supported in PDF export)
  - Letterhead fields: Company name, address (multi-line), contact line
  - Position options: Top-left (default, hidden in MVP UI)
  - Pages options: First page only (default, hidden in MVP UI)
  - Optional neutral legal footer on last page (Advanced Options dropdown)
- **PDF Rendering Enhancements**: Professional, compact header layout with intelligent positioning
  - Logo height 90px (maintains 3:1 aspect ratio) for professional appearance
  - Letterhead text block: Company (bold, 9.5pt) + Address + Contact (8.7pt, gray #555)
  - **Center Alignment Logic**: Measures actual text widths using doc.getTextWidth()
    - Logo-only: Centers logo alone on page
    - Text-only: Centers text block on page
    - Logo + text: Centers both as a unit with 15pt gap
  - Left alignment: Standard positioning with logo first, text offset by logo width + 15pt
  - Hairline divider (#ccc, 0.5pt) below header for clean separation
  - Compact title offset (70pt) when branding is active to prevent overlap
- **Storage & Persistence**: Phase 1 & 2 use client-side localStorage only
  - Key: 'ybg.contractCommander.branding'
  - Fields: enabled, logoDataUrl, company, address, contact, position, pages, addLegalFooter
  - All branding config persists across sessions
  - Reset Branding button to clear all settings (Phase 2)
- **Validation & UX**: Smart error handling and user feedback
  - File type validation (PNG/JPEG recommended, SVG shows warning)
  - File size validation (≤300KB)
  - Image format detection from data URL MIME type
  - Inline warning when branding toggle is on but no content provided
  - Preview, replace, and remove logo functionality
  - Collapsible branding section for clean UI
- **Implementation Quality**: Architect-reviewed and approved
  - All center alignment scenarios tested and working correctly
  - No regressions to existing white-label mode or left alignment
  - Proper handling of edge cases (SVG, logo-only, text-only)
  - Phase 3 (Supabase backend integration) remains pending

## Production Polish v1.3 - White-Label Mode Implementation
- **Complete Branding Removal**: PDFs now export without visible YourBizGuru branding
  - Removed all "Generated by Contract Commander" headers
  - Removed "Page X of Y" and "YourBizGuru.com" footers from pages 1..N-1
  - Clean, professional output suitable for client-facing deliverables
- **Minimalist Footer (Last Page Only)**: Clean disclaimer-only footer
  - Light divider line (#e0e0e0) above footer
  - Centered disclaimer text in 9pt gray (#777777)
  - No copyright notice or company branding visible
  - Text: "Disclaimer: This document is generated automatically for informational and drafting purposes only and does not constitute legal, tax, or financial advice. No attorney-client relationship is created."
- **Hidden Metadata Attribution**: Maintains ownership tracking without user visibility
  - Author: "YourBizGuru LLC"
  - Creator: "Contract Commander | YourBizGuru.com"
  - Subject: "Generated by Contract Commander"
  - Embedded in PDF properties for traceability and compliance

## Production Polish v1.2 - Final Typography & Signature Block Refinements
- **Inter Font Implementation**: Upgraded from system fonts to Google Fonts Inter
  - Added preconnect links for optimal font loading performance
  - Updated body font-family to prioritize Inter with system fallbacks
  - Ensures consistent, professional typography across all devices
- **Signature Block Optimization**: Compact, professional 3-line format per signer
  - Party name on first line
  - Signature line and Date on same line (instead of separate lines)
  - Name and Title combined on third line
  - Moderate spacing between signers for visual separation
  - Reduced from 4-5 lines to 3 lines per signature block
- **Contract Structure Improvements**: Enhanced readability and legal document standards
  - Line height: 1.4-1.5em for optimal readability
  - Body text: 11-12pt professional legal standard
  - Section headings: 14-16pt bold for clear hierarchy
  - Consistent spacing throughout document sections

## Production Polish v1.1 - Footer Cleanup & Professional PDF Margins
- **Duplicate Footer Fix**: Removed duplicate footer injection from pdf-export.js
  - Disabled automatic footer mounting code that was creating a second footer
  - Single clean 2-line footer now appears only once at bottom of page
  - Eliminated redundancy and improved page layout
- **Professional PDF Margins**: Upgraded to standard legal document margins
  - All margins increased to 72pt (1 inch) on all sides (top, right, bottom, left)
  - Header repositioned to 50pt from top to respect new margins
  - Footer repositioned to 50pt from bottom with proper spacing
- **PDF Content Spacing Improvements**: Enhanced readability and prevented overlap
  - Increased line spacing from 14pt to 15pt for better readability
  - Increased paragraph spacing from 6pt to 10pt for clearer section separation
  - Bottom margin check increased from 60pt to 150pt to prevent footer overlap
  - Last page legal footer moved from 70pt to 120pt from bottom for better spacing
  - Legal notice line spacing increased from 11pt to 13pt for improved readability
- **Enhanced PDF Layout**: Professional document structure
  - Content starts 35pt below top margin (after header space)
  - Title and metadata sections have increased spacing (20pt, 16pt, 20pt)
  - New pages start 20pt below header for consistent flow
  - No content overlaps with footers on any page

## Production Polish v1.0 - App Footer & PDF Export System
- **App Footer Redesign**: Implemented clean 2-line footer structure across all screens
  - Line 1: "Powered by YourBizGuru.com • Privacy Policy • Terms of Service" (12.5px)
  - Line 2: Full legal disclaimer in plain language (11.5px, 60% gray, centered, max-width 800px)
  - Mobile responsive with center alignment
  - Footer links open in new tab with proper rel="noopener" attribute
- **PDF Export System Overhaul**: Professional document output with minimal branding
  - Header (every page): Contract type (left, 10pt) + "Generated by Contract Commander" (right, 10pt)
  - Footer pages 1..N-1: "Page X of Y" (left) + "YourBizGuru.com" (right)
  - Footer last page only: Divider line + copyright (auto-year) + full legal notice (multi-line, 9pt)
  - Removed all mid-page banners, duplicate disclaimers, and repeating legal text
  - Removed watermark for clean professional appearance
- **PDF Metadata Updates**: Professional document properties
  - Title: "{ContractType} — {Title} — {YYYY-MM-DD}"
  - Author: "YourBizGuru LLC"
  - Subject: "Generated by Contract Commander"
  - Keywords: "Contract Commander, YourBizGuru, AI Document Generator, Legal Contract"
- **Filename Pattern**: Standardized naming convention
  - Format: "{YYYY}-{MM}-{DD}_ContractCommander_{ContractType}_{Counterparty}.pdf"
  - Example: "2025-11-08_ContractCommander_Service_Agreement_Acme_Corp.pdf"

# System Architecture

## Frontend Architecture
- **Technology Stack**: Vanilla HTML, CSS, and JavaScript.
- **UI/UX Decisions**: Gold/dark/white color scheme (#F5C543, #111111, #FFFFFF, #C9C9D1). Two-panel layout (40% input form, 60% contract preview on desktop, stacked on mobile). Montserrat for headings, Open Sans for body text.
- **Design System**: Modular CSS variables for branding.
- **Feature Specifications**: Responsive design, consistent form field heights (48px for inputs/selects, 120px for textareas), logical form sections (Contract Setup, Parties, Contract Terms, Legal Options, Signatures), professional PDF and Word export with standardized naming conventions and legal document margins (72pt/1 inch), clean 2-line footer.
- **Technical Implementations**: Word export uses a modal-based download workaround for browser security. Keyboard shortcuts include Ctrl+Enter for generation, Ctrl+S to save, Ctrl+N for new contract.

## Backend Architecture
- **Development Environment**: Express.js server for local development.
- **Production Deployment**: Vercel serverless functions.
- **API Design**: RESTful endpoints with CORS headers.
- **Error Handling**: Input validation and structured error responses.

## Database and Storage
- **Database**: Supabase PostgreSQL.
- **ORM**: Drizzle ORM with PostgreSQL dialect.
- **Schema Management**: Drizzle-kit for migrations.
- **Report Persistence**: `compliance_reports` and `bizplan_reports` tables store generated reports including HTML content, metadata, and timestamps.
- **Local Storage**: Browser localStorage for caching current working reports.
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