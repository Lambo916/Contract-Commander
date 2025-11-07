# Contract Commander

> **AI-assisted contract drafting for NDAs, MOUs, Service Agreements, and more**

Contract Commander is an AI-powered contract generation platform that helps businesses and professionals create comprehensive, lawyer-style contracts in minutes. Featuring intelligent content generation, customizable templates, and professional PDF exports with YourBizGuru branding.

🌐 **Live Production**: [contract.yourbizguru.com](https://contract.yourbizguru.com)

---

## ✨ Features

### Core Functionality
- **🤖 AI-Powered Generation**: GPT-4o creates detailed, context-aware contract clauses
- **📄 Professional PDF Export**: Generate lawyer-ready PDFs with automatic table of contents and proper pagination
- **💾 Contract Management**: Save, load, and manage multiple contracts with Supabase PostgreSQL
- **📚 Template Library**: Pre-built templates for common contract types

### Customization Options
- **Detail Levels**: Choose between Standard, Expanded, or Comprehensive detail depth
  - Standard: 1500-2200 words
  - Expanded: 2200-3200 words
  - Comprehensive: 3200-4500 words
- **Tone Selection**: Professional, Investor-ready, Concise, or Visionary
- **Theme Toggle**: Professional light and dark themes with persistent preferences

### Contract Sections
1. **Parties & Recitals**: Legal entities and background information
2. **Scope of Work**: Detailed service or product descriptions
3. **Terms & Conditions**: Key contract terms and obligations
4. **Payment Terms**: Pricing, invoicing, and payment schedules
5. **Confidentiality**: Protection of proprietary information
6. **Termination Clauses**: Exit conditions and procedures
7. **Dispute Resolution**: Mediation and arbitration processes
8. **Governing Law**: Jurisdiction and applicable laws

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ or compatible runtime
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- Supabase account ([create free account](https://supabase.com))

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Lambo916/Contract-Commander.git
   cd Contract-Commander
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

   Required variables:
   ```env
   OPENAI_API_KEY=sk-proj-your-key-here
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   DATABASE_URL=postgresql://postgres.your-project:password@host:5432/postgres
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:5000](http://localhost:5000) in your browser

---

## 🌐 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy Contract Commander"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Framework: **Other** (auto-detected)

3. **Configure Environment Variables**
   
   Add these in Vercel Project Settings → Environment Variables:
   ```
   OPENAI_API_KEY=sk-proj-***
   DATABASE_URL=postgresql://***
   SUPABASE_URL=https://***
   SUPABASE_ANON_KEY=eyJhbGci***
   TOOL_NAME=contractcommander
   PUBLIC_SITE_URL=https://contract.yourbizguru.com
   ```

4. **Set Custom Domain**
   - Go to Project Settings → Domains
   - Add: `contract.yourbizguru.com`
   - Update DNS with CNAME record pointing to `cname.vercel-dns.com`

5. **Deploy!**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Your app is live! 🎉

---

## 🏗️ Tech Stack

### Frontend
- **Vanilla JavaScript**: Zero framework dependencies for maximum compatibility
- **Chart.js**: Interactive visualizations
- **jsPDF**: Professional PDF generation with custom formatting
- **CSS3**: Custom property-based theming system

### Backend
- **Express.js**: RESTful API server
- **TypeScript**: Type-safe server code
- **OpenAI API**: GPT-4o for content generation (SDK-free fetch for Vercel compatibility)

### Database & Storage
- **Supabase PostgreSQL**: Production-grade database with automatic backups
- **Drizzle ORM**: Type-safe database operations
- **Smart Environment System**: Flexible variable detection (VITE_*, NEXT_PUBLIC_*, SUPABASE_*)

### Deployment
- **Vercel**: Serverless function hosting with global CDN
- **GitHub**: Version control and CI/CD pipeline

---

## 📁 Project Structure

```
Contract-Commander/
├── public/                      # Frontend assets
│   ├── index.html              # Main HTML entry point
│   ├── ybg.css                 # Theme system and base styles
│   ├── bizplan-styles.css      # Application-specific styles
│   ├── bizplan-app.js          # Main application logic
│   ├── pdf-export.js           # PDF generation module
│   └── assets/                 # Images and logos
├── server/                      # Backend API
│   ├── index.ts                # Express server entry
│   ├── routes.ts               # API endpoints
│   ├── db.ts                   # Database connection
│   └── vite.ts                 # Vite dev server integration
├── shared/                      # Shared types and schemas
│   └── schema.ts               # Drizzle database schema
├── lib/                         # Utilities
│   └── supabase.ts             # Supabase client initialization
├── src/                         # Source files
│   └── config/
│       └── branding.ts         # Contract Commander branding constants
├── .env.example                # Environment variables template
├── vercel.json                 # Vercel deployment config
└── package.json                # Dependencies and scripts
```

---

## 🔌 API Endpoints

### Contract Generation
- **POST** `/api/bizplan`
  - Generates AI-powered contract content
  - Request: Company details, tone, detail level
  - Response: Structured JSON with all contract sections

### Contract Management
- **POST** `/api/bizplan/reports/save` - Save a contract
- **GET** `/api/bizplan/reports` - List all saved contracts
- **GET** `/api/bizplan/reports/:id` - Get specific contract by ID
- **DELETE** `/api/bizplan/reports/:id` - Delete a contract

### Health Checks
- **GET** `/api/health/db` - Database connection status
- **GET** `/api/db/ping` - Supabase connectivity check

---

## 🎨 Branding & Design

### Color Palette
- **Primary Gold**: `#F5C543` - Professional, premium
- **Background (Dark)**: `#111111` - Clean, modern
- **Text (Light)**: `#FFFFFF` - High contrast readability
- **Accent Gray**: `#C9C9D1` - Subtle accents

### Typography
- **Headings**: System UI font stack
- **Body**: Sans-serif optimized for readability
- **PDF**: Clean, professional formatting

### Theme System
- Persistent light/dark mode with localStorage
- Respects system preferences
- Smooth transitions between themes
- Accessible color contrast (WCAG AA compliant)

---

## 🔐 Environment Variables

### Required
| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o | `sk-proj-***` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key (public) | `eyJhbGci***` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://***` |

### Optional
| Variable | Description | Default |
|----------|-------------|---------|
| `PUBLIC_SITE_URL` | Production URL | `https://contract.yourbizguru.com` |
| `TOOL_NAME` | Application name | `contractcommander` |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | `*` (dev), production domain |
| `SESSION_SECRET` | Session encryption key | Auto-generated |
| `REPORT_CAP` | Max contracts per user | `30` |
| `RATE_LIMIT_WINDOW` | Rate limit window (seconds) | `86400` |

---

## 🤝 Contributing

This is a proprietary project for YourBizGuru. For bug reports or feature requests, contact the development team.

---

## 📄 License

© 2025 YourBizGuru - All Rights Reserved

Unauthorized copying, modification, or distribution of this software is strictly prohibited.

---

## 🆘 Support

- **Email**: support@yourbizguru.com
- **Website**: [yourbizguru.com](https://yourbizguru.com)

---

## 📊 Project Status

- ✅ **Version**: 1.0.0
- ✅ **Status**: Production Ready
- ✅ **Live URL**: [contract.yourbizguru.com](https://contract.yourbizguru.com)
- ✅ **Last Updated**: November 2025
- ✅ **Deployment**: Vercel (Serverless)

---

**Built with ❤️ by YourBizGuru**
