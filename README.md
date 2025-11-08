# Contract Commander

> **AI-Powered Legal Contract Drafting in Minutes**

Contract Commander is a professional contract generation platform that creates legally-structured, print-ready contracts using OpenAI GPT-4o. Generate NDAs, Service Agreements, Employment Contracts, MOUs, and Partnership Agreements with proper formatting, signature blocks, and instant PDF/Word export.

🌐 **Live Production**: [contract.yourbizguru.com](https://contract.yourbizguru.com)

---

## ✨ Key Features

### 🤖 AI-Powered Contract Generation
- **GPT-4o Intelligence**: Creates comprehensive, legally-structured contracts with proper terminology and clause formatting
- **5 Contract Types**: NDA, Service Agreement, Employment Agreement, MOU, Partnership Agreement
- **Smart Customization**: 
  - **Tone**: Professional, Friendly, or Legal
  - **Detail Level**: Summary, Standard, or Comprehensive
  - **Multi-Party Support**: 2-6 parties with dynamic role assignment

### 📄 Professional Document Export
- **PDF Export**: Clean, print-ready PDFs with proper pagination
- **Word Export**: Editable .docx files for further customization
- **Instant Download**: No server processing delays

### 🎨 Modern Interface
- **Gold/Dark/White Theme**: Professional branding (#F5C543, #111111, #FFFFFF)
- **Compact Form Design**: Streamlined input with logical section organization
- **Real-Time Preview**: See contract updates as you type
- **Responsive Layout**: Works on desktop, tablet, and mobile

### ⚡ Smart Features
- **Keyboard Shortcuts**: 
  - `Ctrl+Enter` - Generate contract
  - `Ctrl+S` - Save to database
  - `Ctrl+N` - New contract
- **Auto-Save**: Prevents data loss with localStorage caching
- **Database Storage**: Save and retrieve contracts with Supabase

---

## 📋 Contract Sections

Every generated contract includes:

1. **Title & Effective Date** - Contract identification
2. **Parties** - Complete party information with names and roles
3. **Scope of Work** - Detailed description of services/deliverables
4. **Compensation** - Payment terms and amounts
5. **Term & Duration** - Contract timeframe
6. **Termination** - Exit conditions and procedures
7. **Confidentiality** - (Optional) Protection of proprietary information
8. **Intellectual Property** - (Optional) IP ownership and licensing
9. **Governing Law** - Jurisdiction and applicable laws
10. **Additional Clauses** - Custom terms specific to your needs
11. **Signatures** - Signature blocks for all parties

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
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
   
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=sk-your-openai-key-here
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   DATABASE_URL=postgresql://postgres.your-project:password@host:5432/postgres
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:5000](http://localhost:5000)

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy Contract Commander"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Framework preset: **Other**

3. **Configure Environment Variables**
   
   Add in Vercel Project Settings → Environment Variables:
   ```
   OPENAI_API_KEY=sk-proj-***
   DATABASE_URL=postgresql://***
   SUPABASE_URL=https://***
   SUPABASE_ANON_KEY=eyJhbGci***
   NODE_ENV=production
   ```

4. **Set Custom Domain** (Optional)
   - Project Settings → Domains
   - Add your domain (e.g., `contract.yourbizguru.com`)
   - Update DNS with CNAME: `cname.vercel-dns.com`
   - **Important**: Add your custom domain to CORS allowed origins in `server/production.ts`

5. **Deploy** 🎉

### Deploy to Replit

1. **Publish via Replit**
   - Click "Publish" in your Replit workspace
   - Your app gets a `.replit.app` domain automatically
   - CORS is pre-configured for `.replit.app` domains

---

## 🏗️ Tech Stack

### Frontend
- **Vanilla JavaScript** - Zero framework dependencies, maximum compatibility
- **HTML/CSS** - Semantic markup with custom property theming
- **jsPDF** - Client-side PDF generation
- **html-docx-js** - Word document export

### Backend
- **Express.js** - RESTful API server
- **TypeScript** - Type-safe server code
- **OpenAI GPT-4o** - AI contract generation
- **Drizzle ORM** - Type-safe database operations

### Database & Storage
- **Supabase PostgreSQL** - Production database with automatic backups
- **LocalStorage** - Client-side caching for autosave

### Deployment
- **Vercel** - Serverless functions (primary)
- **Replit Publishing** - Alternative deployment platform
- **CORS** - Multi-domain support (yourbizguru.com, vercel.app, replit.app)

---

## 📁 Project Structure

```
Contract-Commander/
├── public/                      # Frontend assets
│   ├── index.html              # Main application
│   ├── ybg.css                 # Base theme system
│   ├── bizplan-styles.css      # Contract Commander styles
│   ├── bizplan-app.js          # Main application logic
│   ├── pdf-export.js           # PDF generation
│   └── assets/                 # Logos and images
├── server/                      # Backend API
│   ├── index.ts                # Development server
│   ├── production.ts           # Production server (Vercel)
│   ├── routes.ts               # API endpoints
│   ├── db.ts                   # Database connection
│   └── auth.ts                 # Authentication middleware
├── core/                        # Core utilities
│   ├── clients/
│   │   ├── openai.ts           # OpenAI client
│   │   └── supabase.ts         # Supabase client
│   └── config/
│       └── index.ts            # App configuration
├── shared/                      # Shared types
│   └── schema.ts               # Drizzle schemas
├── models/                      # Type definitions
│   └── contracts.ts            # Contract types
├── vercel.json                 # Vercel config
├── build-vercel.sh             # Vercel build script
└── package.json                # Dependencies
```

---

## 🔌 API Endpoints

### Contract Generation
- **POST** `/api/bizplan`
  - Generates AI-powered contract
  - Request body: Contract details (type, parties, terms, etc.)
  - Response: Complete contract content in structured format
  - Rate limit: 60 requests/minute

### Contract Management
- **POST** `/api/bizplan/reports/save` - Save contract to database
- **GET** `/api/bizplan/reports` - List all saved contracts
- **GET** `/api/bizplan/reports/:id` - Get specific contract
- **DELETE** `/api/bizplan/reports/:id` - Delete contract

### Health & Status
- **GET** `/api/health/db` - Database connection status
- **GET** `/api/db/ping` - Supabase connectivity check

---

## 🎨 Design System

### Color Palette
- **Primary Gold**: `#F5C543` - Professional, premium feel
- **Dark Background**: `#111111` - Modern, clean
- **White Text**: `#FFFFFF` - High contrast, readable
- **Accent Gray**: `#C9C9D1` - Subtle UI elements

### Form Sections (In Order)
1. **Contract Setup** - Type, Title, Date, Tone, Detail Level
2. **Parties** - Compact header with party count selector, 2-column name/role pairing
3. **Contract Terms** - Scope, Compensation, Term, Termination
4. **Legal Options** - Governing Law, IP Ownership, Confidentiality
5. **Signatures** - Signatory names and titles

### UI Improvements (Nov 2025)
- ✅ Unified 48px height for all inputs/selects
- ✅ 120px height for textareas
- ✅ Consistent 8px border radius
- ✅ Gold focus outlines (#F5C543)
- ✅ Ultra-compact party selector (70px dropdown)
- ✅ 2-column name/role layout for better scanning

---

## 🔐 Environment Variables

### Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o | `sk-proj-***` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase public key | `eyJhbGci***` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://***` |

### Optional Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |

---

## 🔧 CORS Configuration

Production CORS allows these origins:
- `grant.yourbizguru.com`
- `bizplan.yourbizguru.com`
- `contract.yourbizguru.com`
- `*.vercel.app` (Vercel deployments)
- `*.replit.app` (Replit deployments)

**Adding a new domain?** Edit `server/production.ts` and add to `allowedOrigins` array.

---

## 📊 Recent Updates

### November 2025 - v1.0.0
- ✅ **Form UI Overhaul**: Compact, logical section organization
- ✅ **Multi-Party Support**: Dynamic 2-6 party contracts
- ✅ **Export Options**: Both PDF and Word (.docx)
- ✅ **CORS Fix**: Support for Replit and custom domains
- ✅ **Keyboard Shortcuts**: Power user productivity features
- ✅ **Consistent Styling**: Unified field heights and focus states

---

## 🤝 Support

**YourBizGuru Contract Commander**
- 📧 Email: support@yourbizguru.com
- 🌐 Website: [yourbizguru.com](https://yourbizguru.com)
- 📄 Live App: [contract.yourbizguru.com](https://contract.yourbizguru.com)

---

## 📄 License

© 2025 YourBizGuru - All Rights Reserved

Proprietary software. Unauthorized copying, modification, or distribution is prohibited.

---

## ✨ Project Status

- ✅ **Version**: 1.0.0
- ✅ **Status**: Production Ready
- ✅ **Live URL**: [contract.yourbizguru.com](https://contract.yourbizguru.com)
- ✅ **Last Updated**: November 2025
- ✅ **Platforms**: Vercel (Primary), Replit (Alternative)

---

**Built with ❤️ by YourBizGuru**
