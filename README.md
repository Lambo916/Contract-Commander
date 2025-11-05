# BizPlan-Builder

YourBizGuru Business Planning Toolkit — create professional investor-ready business plans with AI-powered insights, KPI tracking, and export-ready PDF reports.

## Live
- Production: https://bizplan.yourbizguru.com
- Preview (Vercel): https://biz-plan-builder.vercel.app

## Features

- **AI-Powered Business Plans**: Generate comprehensive, investor-ready business plans using GPT-4o
- **Detail Level Control**: Choose between Standard, Expanded, or Comprehensive narrative depth
- **Executive Snapshot**: Key business metrics and goals at a glance
- **KPI Dashboard**: Track important business metrics with visual charts
- **Financial Projections**: 12-month revenue and expense projections with interactive charts
- **AI Insights**: Strategic recommendations tailored to your business stage
- **PDF Export**: Professional PDF reports with WYSIWYG parity
- **Template Library**: Pre-built templates for common business types
- **Report Management**: Save, load, and manage multiple business plans
- **Dark/Light Themes**: Professional theme system with persistent preferences
- **Mobile Responsive**: Optimized for all device sizes

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript with Chart.js for visualizations
- **Backend**: Express.js + TypeScript
- **Database**: Supabase PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI GPT-4o
- **PDF Generation**: jsPDF with custom formatting
- **Deployment**: Vercel serverless functions

## Environment

Copy `.env.example` to your env system (Replit Secrets / Vercel Env). Do **not** commit secrets.

### Required Environment Variables

```bash
OPENAI_API_KEY=sk-***
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
PUBLIC_SITE_URL=https://bizplan.yourbizguru.com
```

## Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Add your API keys and database credentials

3. **Run development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5000`

## Deploy (Vercel)

1. Import this repo in Vercel
2. Add environment variables (match `.env.example`)
3. Set Custom Domain: `bizplan.yourbizguru.com`
4. Deploy

### Vercel Configuration

The project includes `vercel.json` with optimal settings for Node.js/Express applications. API routes are automatically handled, and the frontend is served from the root.

## Database Schema

The application uses Supabase PostgreSQL with the following main tables:

- **bizplan_reports**: Stores saved business plan reports
  - User ID, title, company, industry
  - HTML content and metadata (JSON)
  - Creation and update timestamps

All database operations use Drizzle ORM for type-safe queries.

## API Endpoints

- `POST /api/bizplan/generate` - Generate business plan with AI
- `POST /api/reports/save` - Save a business plan report
- `GET /api/reports/list` - List all saved reports
- `GET /api/reports/:id` - Get a specific report
- `DELETE /api/reports/:id` - Delete a report
- `GET /api/health/db` - Database health check
- `GET /api/db/ping` - Database connectivity check

## Security

- API key validation and secure storage
- Input validation and sanitization
- Rate limiting (configurable)
- CORS configuration for iframe embedding
- Supabase Row Level Security (future enhancement)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

© 2025 YourBizGuru - All Rights Reserved

---

**Version**: 1.0.0  
**Project**: BizPlan Builder  
**Repository**: https://github.com/Lambo916/BizPlan-Builder.git
