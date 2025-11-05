# Vercel Deployment Instructions for BizPlan Builder

## Prerequisites
- GitHub repository: https://github.com/Lambo916/BizPlan-Builder.git
- Vercel account linked to your GitHub
- All environment variable values ready (see below)

## Step-by-Step Deployment

### 1. Import Project to Vercel

1. Go to https://vercel.com/new
2. Select "Import Git Repository"
3. Import `Lambo916/BizPlan-Builder`
4. Keep default settings:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: (auto-detected from vercel.json)

### 2. Configure Environment Variables

Add these in Vercel Project Settings → Environment Variables:

#### Required Variables
```
OPENAI_API_KEY=sk-proj-...
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
```

#### Optional Variables
```
PUBLIC_SITE_URL=https://bizplan.yourbizguru.com
CORS_ALLOWED_ORIGINS=https://bizplan.yourbizguru.com,https://*.vercel.app
TOOL_NAME=BizPlanBuilder
SESSION_SECRET=generate-a-random-string-here
REPORT_CAP=30
RATE_LIMIT_WINDOW=86400
NODE_ENV=production
```

**Note**: Copy values from your Replit Secrets or Supabase dashboard

### 3. Configure Custom Domain

1. Go to Project Settings → Domains
2. Add domain: `bizplan.yourbizguru.com`
3. Follow DNS configuration instructions
4. Update DNS records in GoDaddy:
   - Type: `CNAME`
   - Name: `bizplan` (or `@` for root domain)
   - Value: `cname.vercel-dns.com`
   - TTL: `600`

### 4. Deploy

1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Verify deployment at preview URL
4. Check custom domain propagation (may take 10-60 minutes)

### 5. Post-Deployment Verification

Test these endpoints:
```bash
# Health checks
curl https://bizplan.yourbizguru.com/api/health/db
curl https://bizplan.yourbizguru.com/api/db/ping

# Frontend
curl https://bizplan.yourbizguru.com/
```

Expected responses:
- Database health: `{"ok":true,"source":"supabase",...}`
- Database ping: `{"ok":true,"result":{"ping":1},...}`
- Frontend: HTML page with "BizPlan Builder" title

## Troubleshooting

### Build Fails
- Check that all required environment variables are set
- Verify DATABASE_URL uses Transaction Pooler (port 5432, not 6543)
- Check build logs for specific errors

### Database Connection Issues
- Confirm SUPABASE_URL and SUPABASE_ANON_KEY are correct
- Verify DATABASE_URL includes `?sslmode=require` or SSL parameters
- Check Supabase project is active and not paused

### API Routes Not Working
- Verify `vercel.json` routes configuration
- Check that X-Client-Id header is sent for protected routes
- Review Vercel Function logs for errors

### Custom Domain Not Working
- Wait 10-60 minutes for DNS propagation
- Verify CNAME record in GoDaddy DNS
- Check domain configuration in Vercel dashboard
- Try accessing via Vercel preview URL first

## Monitoring

After successful deployment:
1. Set up Vercel Analytics (optional)
2. Configure error tracking
3. Monitor database usage in Supabase dashboard
4. Review OpenAI API usage

## Rollback

If issues occur:
1. Go to Vercel → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

---

For support, contact: support@yourbizguru.com
