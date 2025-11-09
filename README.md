# Contract Commander

> **AI-Powered Legal Contract Drafting with Professional Export**

Contract Commander is a production-ready contract generation platform that creates legally-structured, print-ready contracts using OpenAI GPT-4o. Generate NDAs, Service Agreements, Employment Contracts, MOUs, and Partnership Agreements with professional formatting, signature blocks, and instant PDF/Word export with optional white-label branding.

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
- **PDF Export**: Clean, print-ready PDFs with 1-inch legal margins and proper pagination
- **Word Export**: Editable .docx files for further customization
- **White-Label Branding**: Optional company logo and letterhead for professional client deliverables
- **Signature Blocks**: Properly formatted signature sections for all parties
- **Smart Formatting**: Orphan prevention, heading protection, and professional footer positioning

### 🏷️ White-Label Branding System
- **Logo Upload**: Add company logo to contract headers (auto-scaled to professional dimensions)
- **Letterhead Text**: Customizable company name and contact information
- **Two Export Modes**:
  - **Standard Mode**: Clean contract without branding
  - **Branded Mode**: Professional white-label output with logo and letterhead
- **Persistent Settings**: Branding preferences saved in localStorage
- **Clear All Function**: Reset all branding and form data with one click

### 🎨 Dual-Theme Interface
- **Dark Theme**: Modern black background with gold accents (#F5C543)
- **Light Theme**: Clean white background with cornflower blue accents (#6495ED)
- **Professional Typography**: Inter font family throughout
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Theme Toggle**: Seamless switching between light and dark modes

### ⚡ Smart Features
- **Keyboard Shortcuts**: 
  - `Ctrl+Enter` - Generate contract
  - `Ctrl+S` - Export as PDF
  - `Ctrl+N` - Clear all fields
- **Auto-Save**: Prevents data loss with localStorage caching
- **Real-Time Preview**: See contract updates instantly
- **Form Validation**: Intelligent field validation and error messages

---

## 📋 Contract Sections

Every generated contract includes:

1. **Title & Effective Date** - Contract identification
2. **Parties** - Complete party information with names and roles (2-6 parties)
3. **Scope of Work** - Detailed description of services/deliverables
4. **Compensation** - Payment terms and amounts
5. **Term & Duration** - Contract timeframe
6. **Termination** - Exit conditions and procedures
7. **Confidentiality** - (Optional) Protection of proprietary information
8. **Intellectual Property** - (Optional) IP ownership and licensing
9. **Governing Law** - Jurisdiction and applicable laws
10. **Additional Clauses** - Custom terms specific to your needs
11. **Signatures** - Signature blocks for all parties with dates

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- Supabase account (optional - for contract storage)

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
   - **Important**: Add your custom domain to CORS allowed origins in `server/index.ts`

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
- **jsPDF** - Client-side PDF generation with advanced formatting
- **html-docx-js** - Word document export

### Backend
- **Express.js** - RESTful API server
- **TypeScript** - Type-safe server code
- **OpenAI GPT-4o** - AI contract generation
- **CORS** - Secure cross-origin request handling
- **Rate Limiting** - Protection against API abuse

### Database & Storage
- **Supabase PostgreSQL** - Production database with automatic backups (optional)
- **LocalStorage** - Client-side caching for autosave and branding preferences

### Deployment
- **Vercel** - Serverless functions (primary)
- **Replit Publishing** - Alternative deployment platform
- **Multi-Domain CORS** - Support for custom domains and platform deployments

---

## 📁 Project Structure

```
Contract-Commander/
├── public/                      # Frontend assets
│   ├── index.html              # Main application
│   ├── contract-app.js         # Application logic & contract generation
│   ├── pdf-export.js           # PDF generation with branding
│   ├── ybg.css                 # Base theme system
│   └── assets/                 # Logos and images
├── server/                      # Backend API
│   ├── index.ts                # Express server (dev & production)
│   └── routes.ts               # API endpoints
├── core/                        # Core utilities
│   ├── clients/
│   │   ├── openai.ts           # OpenAI client configuration
│   │   └── supabase.ts         # Supabase client (optional)
│   └── config/
│       └── index.ts            # Environment configuration
├── shared/                      # Shared types
│   └── schema.ts               # Database schemas (if using Supabase)
├── package.json                # Dependencies
└── README.md                   # This file
```

---

## 🔌 API Endpoints

### Contract Generation
- **POST** `/api/generate-contract`
  - Generates AI-powered contract using GPT-4o
  - Request body: Contract details (type, parties, terms, clauses, etc.)
  - Response: Complete contract content in markdown format
  - Rate limit: Configured in Express middleware

### Document Export
- **POST** `/api/export-word`
  - Converts HTML contract to Word document
  - Request body: `{ html: string, filename: string }`
  - Response: Binary .docx file download
  - Uses html-to-docx for clean formatting

### Health & Status
- **GET** `/api/health` - API health check
- **GET** `/api/health/db` - Database connection status (if configured)

---

## 🎨 Design System

### Color Palettes

#### Dark Theme (Default)
- **Primary Gold**: `#F5C543` - Premium, professional accent
- **Dark Background**: `#111111` - Modern, clean
- **White Text**: `#FFFFFF` - High contrast, readable
- **Gray Borders**: `#333333` - Subtle separation

#### Light Theme
- **Primary Blue**: `#6495ED` - Cornflower blue accent
- **White Background**: `#FFFFFF` - Clean, bright
- **Dark Text**: `#1A1A1A` - Excellent readability
- **Light Gray Borders**: `#E0E0E0` - Subtle definition

### Typography
- **Font Family**: Inter (clean, professional)
- **Section Titles**: 18px, bold
- **Body Text**: 16px
- **Labels**: 14px
- **Small Text**: 12px

### Form Design
1. **Contract Setup** - Type, Title, Date, Tone, Detail Level
2. **Parties** - Dynamic 2-6 party configuration with names and roles
3. **Contract Terms** - Scope, Compensation, Term, Termination
4. **Legal Options** - Governing Law, IP Ownership, Confidentiality checkbox
5. **Additional Clauses** - Custom terms and conditions
6. **Signatures** - Signatory information for all parties

---

## 🔐 Security Features

### API Protection
- **Environment Variables**: OpenAI API key secured server-side only
- **CORS Configuration**: Whitelist-based origin validation
- **Rate Limiting**: Protection against API abuse
- **Input Sanitization**: HTML escaping for user inputs
- **Error Handling**: Environment-based error messages (detailed in dev, generic in prod)

### Data Privacy
- **No Server Storage**: Contracts stored client-side in localStorage by default
- **Optional Database**: Supabase integration available but not required
- **Client-Side Export**: PDF/Word generation happens in browser

---

## 📊 Production Readiness Checklist

### ✅ Completed (November 2025)
- [x] OpenAI GPT-4o integration with proper error handling
- [x] All 5 contract types generating correctly
- [x] PDF export with professional formatting and branding
- [x] Word document export with modal download workaround
- [x] White-label branding system (logo + letterhead)
- [x] Dual-theme support (dark gold / light blue)
- [x] Security: API key protection, CORS, input sanitization
- [x] Responsive design for all screen sizes
- [x] Keyboard shortcuts for power users
- [x] Clear All functionality for form reset
- [x] Theme toggle with persistent preferences
- [x] Production code cleanup (debug statements removed)
- [x] SEO optimization with meta tags and Open Graph
- [x] Error handling and user feedback (toast notifications)
- [x] Cross-browser compatibility testing

### 🎯 Production Features
- **Zero Dependencies on Frontend**: Pure vanilla JavaScript
- **Fast Load Times**: Minimal bundle size, no framework overhead
- **Offline Capable**: All core features work without database
- **Print-Ready PDFs**: DocuSign/Adobe-compatible formatting
- **Professional Export**: 1-inch margins, proper pagination, signature blocks

---

## 🔧 Environment Variables

### Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o | `sk-proj-***` |

### Optional Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | `null` |
| `SUPABASE_ANON_KEY` | Supabase public key | `null` |
| `DATABASE_URL` | PostgreSQL connection string | `null` |
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |

---

## 💡 Usage Tips

### For Best Results
1. **Be Specific**: Provide detailed scope, compensation, and term information
2. **Use Custom Clauses**: Add industry-specific requirements in "Additional Clauses"
3. **Choose Appropriate Tone**: Professional for corporate, Legal for complex contracts
4. **Review Before Export**: Always review AI-generated content
5. **Legal Disclaimer**: AI-generated contracts should be reviewed by legal counsel

### White-Label Branding
1. Upload a company logo (PNG/JPG, recommended 400x100px)
2. Add letterhead text (company name, address, contact info)
3. Toggle "Include Branding" when exporting PDF
4. Logo appears in header, letterhead in footer
5. Use "Clear All" to remove branding and start fresh

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

- ✅ **Version**: 1.0.0 Production
- ✅ **Status**: Live & Production Ready
- ✅ **Live URL**: [contract.yourbizguru.com](https://contract.yourbizguru.com)
- ✅ **Last Updated**: November 9, 2025
- ✅ **Deployment**: Vercel (Primary), Replit Compatible
- ✅ **RDA Review**: Passed comprehensive pre-launch review

### Recent Production Deployment (Nov 9, 2025)
- ✅ Security validation complete
- ✅ All contract types tested and working
- ✅ PDF/Word export with branding validated
- ✅ Performance optimized
- ✅ Cross-platform compatibility confirmed
- ✅ Production code cleanup completed

---

**Built with ❤️ by YourBizGuru**

*Professional legal contract drafting, powered by AI, ready in minutes.*
