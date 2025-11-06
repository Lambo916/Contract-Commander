# BizPlan Builder

> **Create professional, investor-ready business plans powered by AI**

BizPlan Builder is an AI-powered business planning platform that helps entrepreneurs and business owners generate comprehensive, actionable business plans in minutes. Featuring intelligent content generation, interactive financial projections, KPI tracking, and professional PDF exports with YourBizGuru branding.

🌐 **Live Production**: [bizplan.yourbizguru.com](https://bizplan.yourbizguru.com)

---

## ✨ Features

### Core Functionality
- **🤖 AI-Powered Generation**: GPT-4o creates detailed, context-aware business plan sections
- **📊 Interactive Charts**: Real-time KPI dashboard and 12-month financial projections with Chart.js
- **📄 Professional PDF Export**: Generate investor-ready PDFs with automatic table of contents, proper pagination, and WYSIWYG parity
- **💾 Report Management**: Save, load, and manage multiple business plans with Supabase PostgreSQL
- **📚 Template Library**: Pre-built templates for common business types (coming soon)

### Customization Options
- **Detail Levels**: Choose between Standard, Expanded, or Comprehensive narrative depth
  - Standard: 1500-2200 words
  - Expanded: 2200-3200 words
  - Comprehensive: 3200-4500 words
- **Tone Selection**: Professional, Investor-ready, Concise, or Visionary
- **Theme Toggle**: Professional light and dark themes with persistent preferences

### Business Plan Sections
1. **Executive Summary**: Overview and mission statement
2. **Market Analysis**: Target market, competition, and positioning
3. **Products & Services**: Detailed offering descriptions
4. **Marketing & Sales**: Go-to-market strategy
5. **Operations Plan**: Day-to-day execution strategy
6. **Financial Plan**: Revenue model and projections
7. **KPI Dashboard**: Key performance indicators
8. **AI Insights**: Strategic recommendations based on business stage
9. **Financial Projections**: 12-month revenue and expense forecasts

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or compatible runtime
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- Supabase account ([create free account](https://supabase.com))

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Lambo916/BizPlan-Builder.git
   cd BizPlan-Builder
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
   git commit -m "Deploy BizPlan Builder"
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
   ```

4. **Set Custom Domain**
   - Go to Project Settings → Domains
   - Add: `bizplan.yourbizguru.com`
   - Update DNS with CNAME record pointing to `cname.vercel-dns.com`

5. **Deploy!**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Your app is live! 🎉

For detailed deployment instructions, see [VERCEL_SETUP.md](./VERCEL_SETUP.md)

---

## 🏗️ Tech Stack

### Frontend
- **Vanilla JavaScript**: Zero framework dependencies for maximum compatibility
- **Chart.js**: Interactive KPI and financial projection charts
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
BizPlan-Builder/
├── public/                      # Frontend assets
│   ├── index.html              # Main HTML entry point
│   ├── ybg.css                 # Theme system and base styles
│   ├── bizplan-styles.css      # BizPlan-specific styles
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
├── .env.example                # Environment variables template
├── vercel.json                 # Vercel deployment config
├── VERCEL_SETUP.md             # Detailed deployment guide
└── package.json                # Dependencies and scripts
```

---

## 🔌 API Endpoints

### Business Plan Generation
- **POST** `/api/bizplan/generate`
  - Generates AI-powered business plan content
  - Request: Business details, tone, detail level
  - Response: Structured JSON with all sections

### Report Management
- **POST** `/api/reports/save` - Save a business plan
- **GET** `/api/reports/list` - List all saved reports
- **GET** `/api/reports/:id` - Get specific report by ID
- **DELETE** `/api/reports/:id` - Delete a report

### Health Checks
- **GET** `/api/health/db` - Database connection status
- **GET** `/api/db/ping` - Supabase connectivity check

---

## 🎨 Branding & Design

### Color Palette
- **Primary Blue**: `#4DB6E7` - Trust, professionalism
- **Accent Yellow**: `#FFEB3B` - Energy, optimism
- **Background (Dark)**: `#0f141a` → `#121820` gradient
- **Background (Light)**: `#e0eff6` → `#ffffff` gradient

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
| `PUBLIC_SITE_URL` | Production URL | `https://bizplan.yourbizguru.com` |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | `*` (dev), production domain |
| `TOOL_NAME` | Application name | `BizPlanBuilder` |
| `SESSION_SECRET` | Session encryption key | Auto-generated |
| `REPORT_CAP` | Max reports per user | `30` |
| `RATE_LIMIT_WINDOW` | Rate limit window (seconds) | `86400` |

---

## 🧪 Testing

### Health Checks
```bash
# Database connectivity
curl https://bizplan.yourbizguru.com/api/health/db

# Supabase ping
curl https://bizplan.yourbizguru.com/api/db/ping
```

### Generate a Business Plan
1. Fill in company details
2. Select tone and detail level
3. Click "Generate Plan"
4. Review sections and charts
5. Export to PDF or save to database

---

## 📝 Database Schema

### `bizplan_reports`
```typescript
{
  id: integer (primary key, auto-increment)
  userId: text (nullable - future auth integration)
  title: text (required)
  company: text (required)
  industry: text (required)
  htmlContent: text (full HTML report)
  metadata: jsonb {
    executiveSnapshot: {...}
    mainContent: {...}
    kpiTable: {...}
    aiInsights: {...}
    financialProjections: {...}
    stage: string
  }
  createdAt: timestamp (default: now())
  updatedAt: timestamp (auto-update)
}
```

---

## 🤝 Contributing

This is a proprietary project for YourBizGuru. For bug reports or feature requests, contact the development team.

---

## 📄 License

© 2025 YourBizGuru - All Rights Reserved

Unauthorized copying, modification, or distribution of this software is strictly prohibited.

---

## 🆘 Support

- **Documentation**: [VERCEL_SETUP.md](./VERCEL_SETUP.md)
- **Email**: support@yourbizguru.com
- **Website**: [yourbizguru.com](https://yourbizguru.com)

---

## 📊 Project Status

- ✅ **Version**: 1.0.0
- ✅ **Status**: Production Ready
- ✅ **Live URL**: [bizplan.yourbizguru.com](https://bizplan.yourbizguru.com)
- ✅ **Last Updated**: November 2025
- ✅ **Deployment**: Vercel (Serverless)

---

**Built with ❤️ by YourBizGuru**
