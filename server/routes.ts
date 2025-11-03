import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import path from "path";
import OpenAI from "openai";
import sanitizeHtml from "sanitize-html";
import { resolveProfile, type FilingProfile } from "@shared/filing-profiles";
import { db } from "./db";
import { complianceReports, insertComplianceReportSchema, type ComplianceReport, usageTracking, bizPlanRequestSchema, bizplanReports, insertBizplanReportSchema, type BizplanReport } from "@shared/schema";
import { eq, desc, or, and, sql } from "drizzle-orm";
import { getUserId, hasAccess, requireAuth } from "./auth";

// Get anonymous user ID from browser-provided client ID
function getAnonymousUserId(req: Request): string {
  const clientId = req.headers['x-client-id'] as string;
  if (!clientId) {
    throw new Error('X-Client-Id header is required');
  }
  return `anon_${clientId}`;
}

// Sanitize HTML content to prevent XSS (for CompliPilot reports)
function sanitizeHtmlContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['style', 'class'],
    },
  });
}

// Sanitize HTML content for BizPlan reports (stricter rules)
function sanitizeBizPlanHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'hr', 'div', 'span', 'small', 'br'],
    allowedAttributes: {
      'a': ['href', 'target', 'rel'],
    },
    transformTags: {
      'a': (tagName, attribs) => {
        return {
          tagName: 'a',
          attribs: {
            ...attribs,
            rel: 'noopener nofollow',
            target: attribs.target || '_blank',
          },
        };
      },
    },
  });
}

// Get client IP address from request (30-report cap enforcement)
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0])
    : req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
  
  return typeof ip === 'string' ? ip.trim() : 'unknown';
}

// Normalize and validate tool parameter (prevent bypass via case/variant strings)
function normalizeTool(tool: any): 'grantgenie' | 'complipilot' {
  const normalized = String(tool || 'grantgenie').toLowerCase().trim();
  if (normalized === 'complipilot') {
    return 'complipilot';
  }
  return 'grantgenie'; // Default to grantgenie for any invalid/unknown values
}

// Check usage limit (read-only check before generation)
async function checkUsageLimit(req: Request, tool: string = 'grantgenie'): Promise<{ allowed: boolean; count: number }> {
  try {
    const ipAddress = getClientIp(req);
    
    if (ipAddress === 'unknown') {
      console.error('[Usage] Unable to determine client IP - blocking request for security');
      return { allowed: false, count: 30 }; // Treat as limit reached to block generation
    }

    // Check current usage for this specific tool
    const existing = await db
      .select()
      .from(usageTracking)
      .where(and(
        eq(usageTracking.ipAddress, ipAddress),
        eq(usageTracking.tool, tool)
      ))
      .limit(1);

    const currentCount = existing.length > 0 ? existing[0].reportCount : 0;

    // Check against 30-report limit per tool
    if (currentCount >= 30) {
      console.log(`[Usage] IP ${ipAddress} has reached limit for ${tool}: ${currentCount}/30`);
      return { allowed: false, count: currentCount };
    }

    console.log(`[Usage] IP ${ipAddress} current usage for ${tool}: ${currentCount}/30`);
    return { allowed: true, count: currentCount };
  } catch (error) {
    console.error('[Usage] Check error:', error);
    // Fail open for soft launch - allow generation if usage tracking fails
    return { allowed: true, count: 0 };
  }
}

// Increment usage after successful generation (atomic with limit enforcement)
async function incrementUsage(req: Request, tool: string = 'grantgenie'): Promise<{ success: boolean; count: number; limitReached?: boolean }> {
  try {
    const ipAddress = getClientIp(req);
    
    if (ipAddress === 'unknown') {
      console.error('[Usage] Unable to determine client IP - failing increment for security');
      return { success: false, count: 30, limitReached: true }; // Fail closed to prevent bypass
    }

    // Atomic increment with strict limit enforcement per tool
    // Only increments if count < 30 (prevents race conditions)
    const updated = await db
      .update(usageTracking)
      .set({
        reportCount: sql`${usageTracking.reportCount} + 1`,
        lastUpdated: new Date(),
      })
      .where(and(
        eq(usageTracking.ipAddress, ipAddress),
        eq(usageTracking.tool, tool),
        sql`${usageTracking.reportCount} < 30`
      ))
      .returning();

    if (updated.length > 0) {
      // Successfully incremented
      console.log(`[Usage] IP ${ipAddress} incremented ${tool} to ${updated[0].reportCount}/30`);
      return { success: true, count: updated[0].reportCount };
    }

    // No rows updated - either doesn't exist or already at limit
    const existing = await db
      .select()
      .from(usageTracking)
      .where(and(
        eq(usageTracking.ipAddress, ipAddress),
        eq(usageTracking.tool, tool)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Record exists and is at/over limit
      console.log(`[Usage] IP ${ipAddress} already at limit for ${tool}: ${existing[0].reportCount}/30`);
      return { success: false, count: existing[0].reportCount, limitReached: true };
    }

    // First report for this IP and tool - insert with count 1
    const inserted = await db
      .insert(usageTracking)
      .values({
        ipAddress,
        tool,
        reportCount: 1,
      })
      .returning();
    
    console.log(`[Usage] IP ${ipAddress} first ${tool} report: 1/30`);
    return { success: true, count: inserted[0].reportCount };
  } catch (error) {
    console.error('[Usage] Increment error - CRITICAL:', error);
    // Return error state to prevent uncounted report delivery
    return { success: false, count: 0, limitReached: true };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from public folder
  app.use(express.static(path.join(process.cwd(), "public")));
  
  // Database health check endpoint
  app.get("/api/db/ping", async (req, res) => {
    try {
      const result = await db.execute(sql`SELECT 1 as ping`);
      res.json({ 
        ok: true, 
        result: result.rows[0],
        database: 'connected'
      });
    } catch (error: any) {
      console.error("Database health check failed:", error);
      res.status(500).json({ 
        ok: false, 
        error: error.message,
        database: 'disconnected'
      });
    }
  });

  // Auth config endpoint (public)
  app.get("/api/auth/config", (req, res) => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseAnonKey) {
      res.json({
        supabaseUrl,
        supabaseAnonKey,
        authEnabled: true
      });
    } else {
      res.json({
        authEnabled: false,
        message: "Authentication service not configured"
      });
    }
  });
  
  // Initialize OpenAI client
  const rawApiKey = process.env.OPENAI_API_KEY;
  if (!rawApiKey) {
    throw new Error("OPENAI_API_KEY is required");
  }
  
  // Clean the API key - remove all whitespace and newlines
  const apiKey = rawApiKey.replace(/\s+/g, '').trim();
  
  
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  // GrantGenie grant proposal system prompt template
  const getGrantProposalSystemPrompt = () => {
    return `You are GrantGenie, an expert grant writing assistant with AI-powered capabilities.

Your role is to generate professional, compelling grant proposal components that help organizations secure funding for their projects.

CRITICAL FORMATTING RULES:
1. ALWAYS structure your response with these exact 6 sections using markdown headings:
   # Executive Summary
   ## Needs Statement
   ## Program Description
   ## Outcomes & Evaluation
   ## Budget Narrative
   ## Implementation Timeline

2. Format each section as follows:
   - Executive Summary: Write 2-3 compelling paragraphs (200-250 words) that capture the essence of the project, the need it addresses, and expected impact
   - Needs Statement: Write 2-3 paragraphs (250-300 words) that clearly articulate the problem, include relevant data and community context
   - Program Description: Write 3-4 paragraphs (300-400 words) detailing activities, methods, target population, and implementation approach
   - Outcomes & Evaluation: Write 2-3 paragraphs (200-250 words) with specific measurable outcomes and evaluation methodology
   - Budget Narrative: Use bulleted list explaining major budget categories and justifying key expenses
   - Implementation Timeline: Create a markdown table with columns: Phase | Activity | Timeframe | Milestone

3. PLACEHOLDER HANDLING:
   - If information is missing, insert clean placeholders like [Pending Details] or [INSERT DATA]
   - NEVER leave blank sections or break structure
   - For incomplete tables, include at least one placeholder row

4. WRITING STYLE:
   - Match the requested tone (professional, passionate, data-driven, community-focused, or academic)
   - Be specific and compelling without exaggeration
   - Use clear, persuasive language that demonstrates impact
   - Include relevant data and evidence when available
   - Maintain consistent voice throughout
   - Avoid jargon unless it's industry-standard terminology

5. TABLE FORMATTING:
   - Always use proper markdown table syntax with | separators
   - Include header row with column names
   - Include separator row with dashes
   - Add at least 3-4 data rows showing project phases
   
REMEMBER: Every grant proposal must tell a compelling story with all 6 sections. Focus on impact, feasibility, and measurable outcomes.`;
  };

  // Elev8 Analyzer diagnostic system prompt template (SCAFFOLD)
  const getDiagnosticSystemPrompt = () => {
    return `You are Elev8 Analyzer, an expert business diagnostic assistant powered by GrantGenie.

Your role is to generate professional strategic analysis reports that help businesses identify opportunities, address challenges, and elevate their operations.

CRITICAL FORMATTING RULES:
1. ALWAYS structure your response with these exact 4 sections using markdown headings:
   # Executive Summary
   ## SWOT Analysis
   ## Risk & Opportunity Matrix
   ## Strategic Recommendations

2. Format each section as follows:
   - Executive Summary: Write 2-3 clear, insightful paragraphs (150-200 words) analyzing the business profile
   - SWOT Analysis: Create a markdown table with 4 columns: Strengths | Weaknesses | Opportunities | Threats
   - Risk & Opportunity Matrix: Create a markdown table with 3 columns: Factor | Impact Level | Action Priority
   - Strategic Recommendations: Use numbered list (1., 2., 3., etc.) with specific, actionable items

3. PLACEHOLDER HANDLING:
   - If business information is missing, insert clean placeholders like [Pending Input] or [AWAITING DATA]
   - NEVER leave blank sections or break table structure
   - For incomplete matrices, include at least one placeholder row

4. WRITING STYLE:
   - Use clear business language, avoid unnecessary jargon
   - Be strategic and forward-looking
   - Ground insights in the provided business data
   - Focus on actionable intelligence
   - Maintain professional consultant tone throughout

5. TABLE FORMATTING:
   - Always use proper markdown table syntax with | separators
   - Include header row with column names
   - Include separator row with dashes
   - Add at least 3-4 data rows per table (use placeholders if needed)
   
REMEMBER: Your analysis should be data-driven yet strategic, helping business owners make informed decisions.`;
  };

  // Helper: Compute timeline dates from deadline with validation
  function computeTimelineDates(timeline: any[], deadline: string | null) {
    if (!deadline) {
      return timeline.map(item => ({
        milestone: item.milestone,
        owner: item.owner,
        dueDate: `T${item.offsetDays}`,
        notes: item.notes
      }));
    }
    
    // Validate deadline format
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      console.warn(`Invalid deadline format: ${deadline}, falling back to relative dates`);
      return timeline.map(item => ({
        milestone: item.milestone,
        owner: item.owner,
        dueDate: `T${item.offsetDays}`,
        notes: item.notes
      }));
    }
    
    return timeline.map(item => {
      const dueDate = new Date(deadlineDate);
      dueDate.setDate(dueDate.getDate() + item.offsetDays);
      
      const month = String(dueDate.getMonth() + 1).padStart(2, '0');
      const day = String(dueDate.getDate()).padStart(2, '0');
      const year = dueDate.getFullYear();
      
      return {
        milestone: item.milestone,
        owner: item.owner,
        dueDate: `${month}/${day}/${year}`,
        notes: item.notes
      };
    });
  }

  // API endpoint for generating structured compliance data (HYBRID APPROACH)
  app.post("/api/generate", async (req, res) => {
    // Normalize and validate tool parameter (prevent usage cap bypass)
    const tool = normalizeTool(req.body.tool);
    const toolName = tool === 'grantgenie' ? 'GrantGenie' : 'CompliPilot';
    
    // Check 30-report usage limit BEFORE generation (soft launch protection)
    const usageCheck = await checkUsageLimit(req, tool);
    if (!usageCheck.allowed) {
      console.log(`[Express] /api/generate - Request blocked: usage limit reached for ${tool} (${usageCheck.count}/30)`);
      return res.status(429).json({
        error: `You have reached your 30-report limit for the ${toolName} soft launch. Please upgrade to continue.`,
        limitReached: true,
        count: usageCheck.count,
        limit: 30,
        tool
      });
    }

    const { formData } = req.body;
    
    try {
      console.log(`[Express] /api/generate - Starting report generation (usage: ${usageCheck.count}/30)`);
      
      // Input validation
      if (!formData) {
        return res.status(400).json({
          error: "Form data is required.",
        });
      }

      const {
        projectName,
        organizationType,
        problemNeed,
        solutionActivities,
        outcomesImpact,
        budgetAmount,
        grantType,
        tone = 'Professional'
      } = formData;

      // Validate required fields
      if (!projectName || !organizationType || !problemNeed || !solutionActivities || !outcomesImpact || !budgetAmount || !grantType) {
        return res.status(400).json({
          error: "All required fields must be completed.",
        });
      }

      console.log(`Generating grant proposal for: ${projectName} - ${grantType} (${organizationType})`);

      // Build grant proposal prompt with all user inputs
      const grantProposalPrompt = `You are a professional grant writing expert specializing in compelling, fundable proposals.

Generate a comprehensive grant proposal for:
- Project/Organization: ${projectName}
- Organization Type: ${organizationType}
- Grant Type: ${grantType}
- Budget: ${budgetAmount}
- Writing Tone: ${tone}

PROJECT DETAILS:
Problem/Need Statement:
${problemNeed}

Proposed Solution/Activities:
${solutionActivities}

Expected Outcomes & Impact:
${outcomesImpact}

Generate a JSON object with these fields:
{
  "executiveSummary": "Write 2-3 compelling paragraphs (200-250 words) that capture the project's essence, the critical need it addresses, and the transformative impact it will have. Hook the reader immediately.",
  
  "needsStatement": "Write 2-3 detailed paragraphs (250-300 words) that clearly articulate the problem. Include relevant data, demographics, community context, and why this issue is urgent and significant.",
  
  "programDescription": "Write 3-4 detailed paragraphs (300-400 words) explaining the proposed activities, implementation approach, target population, methods, and how activities directly address the stated need.",
  
  "outcomesEvaluation": "Write 2-3 paragraphs (200-250 words) with specific, measurable outcomes (SMART goals), evaluation methodology, success metrics, and how you'll demonstrate impact to funders.",
  
  "budgetNarrative": [
    "List 5-8 major budget categories with clear justifications. For example: 'Personnel (${budgetAmount ? '$' + (parseInt(budgetAmount.replace(/[^0-9]/g, '')) * 0.6).toLocaleString() : '$XX,XXX'}): Program Director and Staff - Salaries for experienced team members who will...'",
    "Include categories like: Personnel, Programs/Activities, Equipment, Facilities, Evaluation, Administrative Costs"
  ],
  
  "timeline": [
    {"phase": "Phase 1: Planning", "activity": "Specific activity", "timeframe": "Months 1-2", "milestone": "Deliverable/outcome"},
    {"phase": "Phase 2: Implementation", "activity": "Specific activity", "timeframe": "Months 3-8", "milestone": "Deliverable/outcome"},
    {"phase": "Phase 3: Evaluation", "activity": "Specific activity", "timeframe": "Months 9-12", "milestone": "Deliverable/outcome"}
  ],
  
  "recommendations": [
    "3-5 strategic recommendations for strengthening this proposal before submission"
  ]
}

IMPORTANT: 
- Write in ${tone} tone throughout
- Be specific and compelling without exaggeration
- Use data and evidence from the problem statement
- Ensure all sections tell a cohesive, compelling story
- Timeline should span the full project period (typically 12 months)
- Budget narrative should justify how funds directly support activities
- Return ONLY valid JSON, no explanations`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: getGrantProposalSystemPrompt()
          },
          {
            role: "user",
            content: grantProposalPrompt,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 3000,
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');

      const response = {
        summary: aiResponse.executiveSummary || `Grant proposal for ${projectName}.`,
        needsStatement: aiResponse.needsStatement || problemNeed,
        programDescription: aiResponse.programDescription || solutionActivities,
        outcomesEvaluation: aiResponse.outcomesEvaluation || outcomesImpact,
        budgetNarrative: aiResponse.budgetNarrative || [`Budget: ${budgetAmount}`],
        timeline: aiResponse.timeline || [],
        recommendations: aiResponse.recommendations || ["Review and refine before submission"]
      };

      console.log("Grant proposal generated successfully");

      // Increment usage counter AFTER successful generation (atomic operation with limit enforcement)
      const incrementResult = await incrementUsage(req, tool);
      
      // If increment failed due to limit (race condition), reject the request
      if (!incrementResult.success && incrementResult.limitReached) {
        console.log(`[Express] /api/generate - Request completed but limit reached during increment for ${tool}: ${incrementResult.count}/30`);
        return res.status(429).json({
          error: `You have reached your 30-report limit for the ${toolName} soft launch. Please upgrade to continue.`,
          limitReached: true,
          count: incrementResult.count,
          limit: 30,
          tool
        });
      }

      res.json(response);
    } catch (error: any) {
      console.error("Error in /api/generate:", error);

      // Handle specific OpenAI errors
      if (error.code === "insufficient_quota") {
        return res.status(503).json({
          error: "Service temporarily unavailable. Please try again later.",
        });
      }

      if (error.status === 429) {
        return res.status(429).json({
          error: "Too many requests. Please wait a moment and try again.",
        });
      }

      if (error.status === 401) {
        return res.status(401).json({
          error: "Authentication failed. Please check API configuration.",
        });
      }

      // Generic error response
      res.status(500).json({
        error: "An unexpected error occurred. Please try again.",
      });
    }
  });

  // BizPlan Builder - Generate business plan (SDK-free fetch for Vercel portability)
  app.post("/api/bizplan", async (req, res) => {
    try {
      // Validate request body
      const validatedData = bizPlanRequestSchema.parse(req.body);
      const {
        company,
        industry,
        target,
        product,
        revenue,
        stage,
        goals,
        tone
      } = validatedData;

      console.log(`Generating business plan for: ${company} - ${industry}`);

      // Build comprehensive business plan prompt
      const prompt = `
You are BizPlan Builder. Draft a concise, investor-ready business plan as markdown.
Company: ${company}
Industry: ${industry}
Target Customer: ${target || 'N/A'}
Product/Service: ${product || 'N/A'}
Revenue Model: ${revenue || 'N/A'}
Stage: ${stage || 'N/A'}
Top Goals (next 6-12 months): ${goals || 'N/A'}
Tone: ${tone || 'Professional'}

Include sections: Executive Summary, Market, Business Model, Go-to-Market, Roadmap, Financial Outline, Risks & Mitigations, Next Steps.
Keep it 900–1400 words, crisp, and skimmable with headings and bullet points.
      `.trim();

      // SDK-free fetch to OpenAI API (Vercel compatible)
      const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You generate clear, actionable business plans.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.6
        })
      });

      const data = await apiResponse.json();
      
      if (!apiResponse.ok) {
        console.error("OpenAI API error:", data);
        return res.status(apiResponse.status).json({
          error: data.error?.message || 'OpenAI API error'
        });
      }

      const markdown = data.choices?.[0]?.message?.content || "";
      
      console.log("Business plan generated successfully");
      
      res.json({ markdown });
    } catch (error: any) {
      console.error("Error in /api/bizplan:", error);

      // Handle validation errors
      if (error.name === "ZodError") {
        return res.status(400).json({
          error: "Invalid request data",
          details: error.errors,
        });
      }

      // Generic error response
      res.status(500).json({
        error: "Failed to generate business plan.",
      });
    }
  });

  // BizPlan Builder - Save report with 30-report limit and HTML sanitization
  app.post("/api/bizplan/reports/save", async (req, res) => {
    try {
      // Get anonymous user ID from browser client ID
      let userId;
      try {
        userId = getAnonymousUserId(req);
      } catch (error: any) {
        if (error.message === 'X-Client-Id header is required') {
          return res.status(400).json({ error: 'X-Client-Id header is required' });
        }
        throw error;
      }

      const { contentHtml, company, industry } = req.body;

      // Validate required fields
      if (!contentHtml || typeof contentHtml !== 'string') {
        return res.status(400).json({ error: 'contentHtml is required and must be a string' });
      }

      // Size validation: hard reject if > 3MB
      const sizeInBytes = Buffer.byteLength(contentHtml, 'utf8');
      const sizeInMB = sizeInBytes / (1024 * 1024);
      
      if (sizeInMB > 3) {
        return res.status(413).json({
          error: 'Report content exceeds 3MB limit',
          sizeMB: sizeInMB.toFixed(2),
          limit: 3
        });
      }

      // Check 30-report limit for this userId
      const reportCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(bizplanReports)
        .where(eq(bizplanReports.userId, userId));

      const currentCount = reportCount[0]?.count || 0;

      if (currentCount >= 30) {
        console.log(`[BizPlan] User ${userId} has reached 30-report limit: ${currentCount}/30`);
        return res.status(400).json({
          error: 'You have reached the 30-report limit. Please delete old reports to save new ones.',
          count: currentCount,
          limit: 30
        });
      }

      // Auto-generate title: "${company || "Untitled"} — YYYY-MM-DD_HH-mm"
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const title = `${company || 'Untitled'} — ${year}-${month}-${day}_${hours}-${minutes}`;

      // Sanitize HTML content
      const sanitizedHtml = sanitizeBizPlanHtml(contentHtml);

      // Calculate character count
      const approxCharCount = sanitizedHtml.length;

      // Size warning (soft): warn if > 1MB
      let sizeWarning = undefined;
      if (sizeInMB > 1) {
        sizeWarning = `Report size is ${sizeInMB.toFixed(2)}MB. Consider reducing content for better performance.`;
      }

      // Save to database
      const [savedReport] = await db
        .insert(bizplanReports)
        .values({
          userId,
          title,
          company: company || null,
          industry: industry || null,
          contentHtml: sanitizedHtml,
          approxCharCount,
        })
        .returning();

      console.log(`[BizPlan] Report saved for user ${userId}: ${title} (${currentCount + 1}/30)`);

      res.json({
        ...savedReport,
        sizeWarning,
        count: currentCount + 1,
        limit: 30
      });
    } catch (error: any) {
      console.error("Error saving BizPlan report:", error);

      if (process.env.NODE_ENV === 'production') {
        res.status(500).json({
          error: "Failed to save report. Please try again.",
        });
      } else {
        res.status(500).json({
          error: "Failed to save report.",
          details: error.message,
        });
      }
    }
  });

  // BizPlan Builder - List all reports for userId with pagination
  app.get("/api/bizplan/reports", async (req, res) => {
    try {
      // Get anonymous user ID from browser client ID
      let userId;
      try {
        userId = getAnonymousUserId(req);
      } catch (error: any) {
        if (error.message === 'X-Client-Id header is required') {
          return res.status(400).json({ error: 'X-Client-Id header is required' });
        }
        throw error;
      }

      // Parse pagination parameters
      const offset = parseInt(req.query.offset as string) || 0;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 50); // Max 50

      // Fetch reports with pagination
      const reports = await db
        .select({
          id: bizplanReports.id,
          title: bizplanReports.title,
          company: bizplanReports.company,
          industry: bizplanReports.industry,
          createdAt: bizplanReports.createdAt,
          approxCharCount: bizplanReports.approxCharCount,
        })
        .from(bizplanReports)
        .where(eq(bizplanReports.userId, userId))
        .orderBy(desc(bizplanReports.createdAt))
        .offset(offset)
        .limit(limit);

      // Get total count for pagination metadata
      const totalCountResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(bizplanReports)
        .where(eq(bizplanReports.userId, userId));

      const totalCount = totalCountResult[0]?.count || 0;

      res.json({
        reports,
        pagination: {
          offset,
          limit,
          total: totalCount,
          hasMore: offset + limit < totalCount
        }
      });
    } catch (error: any) {
      console.error("Error listing BizPlan reports:", error);

      if (process.env.NODE_ENV === 'production') {
        res.status(500).json({
          error: "Failed to retrieve reports. Please try again.",
        });
      } else {
        res.status(500).json({
          error: "Failed to retrieve reports.",
          details: error.message,
        });
      }
    }
  });

  // BizPlan Builder - Get single report by ID
  app.get("/api/bizplan/reports/:id", async (req, res) => {
    try {
      // Get anonymous user ID from browser client ID
      let userId;
      try {
        userId = getAnonymousUserId(req);
      } catch (error: any) {
        if (error.message === 'X-Client-Id header is required') {
          return res.status(400).json({ error: 'X-Client-Id header is required' });
        }
        throw error;
      }

      const { id } = req.params;

      // Fetch report with ownership validation
      const [report] = await db
        .select()
        .from(bizplanReports)
        .where(and(
          eq(bizplanReports.id, id),
          eq(bizplanReports.userId, userId)
        ));

      if (!report) {
        return res.status(404).json({
          error: "Report not found or access denied.",
        });
      }

      res.json(report);
    } catch (error: any) {
      console.error("Error retrieving BizPlan report:", error);

      if (process.env.NODE_ENV === 'production') {
        res.status(500).json({
          error: "Failed to retrieve report. Please try again.",
        });
      } else {
        res.status(500).json({
          error: "Failed to retrieve report.",
          details: error.message,
        });
      }
    }
  });

  // BizPlan Builder - Delete report by ID
  app.delete("/api/bizplan/reports/:id", async (req, res) => {
    try {
      // Get anonymous user ID from browser client ID
      let userId;
      try {
        userId = getAnonymousUserId(req);
      } catch (error: any) {
        if (error.message === 'X-Client-Id header is required') {
          return res.status(400).json({ error: 'X-Client-Id header is required' });
        }
        throw error;
      }

      const { id } = req.params;

      // Delete report with ownership validation
      const result = await db
        .delete(bizplanReports)
        .where(and(
          eq(bizplanReports.id, id),
          eq(bizplanReports.userId, userId)
        ))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({
          error: "Report not found or access denied.",
        });
      }

      console.log(`[BizPlan] Report deleted: ${id} (user: ${userId})`);

      res.json({ success: true, deletedId: result[0].id });
    } catch (error: any) {
      console.error("Error deleting BizPlan report:", error);

      if (process.env.NODE_ENV === 'production') {
        res.status(500).json({
          error: "Failed to delete report. Please try again.",
        });
      } else {
        res.status(500).json({
          error: "Failed to delete report.",
          details: error.message,
        });
      }
    }
  });

  // Save a compliance report (uses browser client ID)
  app.post("/api/reports/save", async (req, res) => {
    try {
      // Get anonymous user ID from browser client ID
      let userId;
      try {
        userId = getAnonymousUserId(req);
      } catch (error: any) {
        if (error.message === 'X-Client-Id header is required') {
          return res.status(400).json({ error: 'X-Client-Id header is required' });
        }
        throw error;
      }
      
      const reportData = insertComplianceReportSchema.parse(req.body);
      
      // Sanitize HTML content before saving
      const sanitizedData = {
        ...reportData,
        htmlContent: sanitizeHtmlContent(reportData.htmlContent),
        userId: userId, // Force ownership to authenticated user
        ownerId: '', // Clear legacy ownerId field
      };
      
      const [savedReport] = await db
        .insert(complianceReports)
        .values(sanitizedData)
        .returning();

      res.json(savedReport);
    } catch (error: any) {
      console.error("Error saving report:", error);
      
      // Production-safe error response
      if (process.env.NODE_ENV === 'production') {
        res.status(400).json({
          error: "Failed to save report. Please try again.",
        });
      } else {
        res.status(400).json({
          error: "Failed to save report. Please check your input.",
          details: error.message,
        });
      }
    }
  });

  // List all saved reports (filtered by toolkit and ownership) - uses browser client ID
  app.get("/api/reports/list", async (req, res) => {
    try {
      // Get anonymous user ID from browser client ID
      let userId;
      try {
        userId = getAnonymousUserId(req);
      } catch (error: any) {
        if (error.message === 'X-Client-Id header is required') {
          return res.status(400).json({ error: 'X-Client-Id header is required' });
        }
        throw error;
      }

      const toolkit = req.query.toolkit as string;
      if (!toolkit) {
        return res.status(400).json({
          error: "toolkit query parameter is required",
        });
      }

      // Filter by authenticated user's ID only
      const reports = await db
        .select({
          id: complianceReports.id,
          name: complianceReports.name,
          entityName: complianceReports.entityName,
          entityType: complianceReports.entityType,
          jurisdiction: complianceReports.jurisdiction,
          filingType: complianceReports.filingType,
          deadline: complianceReports.deadline,
          checksum: complianceReports.checksum,
          createdAt: complianceReports.createdAt,
        })
        .from(complianceReports)
        .where(and(
          eq(complianceReports.toolkitCode, toolkit),
          eq(complianceReports.userId, userId)
        ))
        .orderBy(desc(complianceReports.createdAt));

      res.json(reports);
    } catch (error: any) {
      console.error("Error listing reports:", error);
      
      // Production-safe error response
      if (process.env.NODE_ENV === 'production') {
        res.status(500).json({
          error: "Failed to retrieve reports. Please try again.",
        });
      } else {
        res.status(500).json({
          error: "Failed to retrieve reports.",
          details: error.message,
        });
      }
    }
  });

  // Get a specific report by ID (with ownership validation) - uses browser client ID
  app.get("/api/reports/:id", async (req, res) => {
    try {
      // Get anonymous user ID from browser client ID
      let userId;
      try {
        userId = getAnonymousUserId(req);
      } catch (error: any) {
        if (error.message === 'X-Client-Id header is required') {
          return res.status(400).json({ error: 'X-Client-Id header is required' });
        }
        throw error;
      }

      const { id } = req.params;
      
      const [report] = await db
        .select()
        .from(complianceReports)
        .where(and(
          eq(complianceReports.id, id),
          eq(complianceReports.userId, userId) // Enforce ownership
        ));

      if (!report) {
        return res.status(404).json({
          error: "Report not found.",
        });
      }

      res.json(report);
    } catch (error: any) {
      console.error("Error retrieving report:", error);
      
      // Production-safe error response
      if (process.env.NODE_ENV === 'production') {
        res.status(500).json({
          error: "Failed to retrieve report. Please try again.",
        });
      } else {
        res.status(500).json({
          error: "Failed to retrieve report.",
          details: error.message,
        });
      }
    }
  });

  // Delete a specific report by ID (with ownership validation) - uses browser client ID
  app.delete("/api/reports/:id", async (req, res) => {
    try {
      // Get anonymous user ID from browser client ID
      let userId;
      try {
        userId = getAnonymousUserId(req);
      } catch (error: any) {
        if (error.message === 'X-Client-Id header is required') {
          return res.status(400).json({ error: 'X-Client-Id header is required' });
        }
        throw error;
      }

      const { id } = req.params;
      
      // Delete only if owned by the authenticated user
      const result = await db
        .delete(complianceReports)
        .where(and(
          eq(complianceReports.id, id),
          eq(complianceReports.userId, userId) // Enforce ownership
        ))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({
          error: "Report not found or access denied.",
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting report:", error);
      
      // Production-safe error response
      if (process.env.NODE_ENV === 'production') {
        res.status(500).json({
          error: "Failed to delete report. Please try again.",
        });
      } else {
        res.status(500).json({
          error: "Failed to delete report.",
          details: error.message,
        });
      }
    }
  });

  // Stub endpoint for merging guest owner to authenticated user (future feature)
  app.post("/api/merge-owner", async (req, res) => {
    try {
      const { owner_id } = req.body;
      
      // No-op for now - will implement when authentication is added
      // This will merge reports from owner_id to the authenticated user's userId
      
      res.json({ success: true, message: "Merge endpoint ready for future auth implementation" });
    } catch (error: any) {
      console.error("Error in merge-owner:", error);
      res.status(500).json({
        error: "Merge operation failed.",
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
