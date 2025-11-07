import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const complianceReports = pgTable("compliance_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  entityName: text("entity_name").notNull(),
  entityType: text("entity_type").notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  filingType: text("filing_type").notNull(),
  deadline: text("deadline"),
  htmlContent: text("html_content").notNull(),
  checksum: text("checksum").notNull(),
  metadata: json("metadata"),
  toolkitCode: text("toolkit_code").notNull().default('grantgenie'),
  ownerId: text("owner_id").notNull().default(''),
  userId: varchar("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertComplianceReportSchema = createInsertSchema(complianceReports).omit({
  id: true,
  createdAt: true,
});

export type InsertComplianceReport = z.infer<typeof insertComplianceReportSchema>;
export type ComplianceReport = typeof complianceReports.$inferSelect;

export const usageTracking = pgTable("usage_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ipAddress: text("ip_address").notNull(),
  tool: text("tool").notNull().default('grantgenie'),
  reportCount: integer("report_count").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
}, (table) => ({
  uniqueIpTool: unique().on(table.ipAddress, table.tool),
}));

export const insertUsageTrackingSchema = createInsertSchema(usageTracking).omit({
  id: true,
  lastUpdated: true,
});

export type InsertUsageTracking = z.infer<typeof insertUsageTrackingSchema>;
export type UsageTracking = typeof usageTracking.$inferSelect;

// BizPlan Builder schemas
export const bizPlanRequestSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  industry: z.string().min(1, "Industry is required"),
  target: z.string().optional(),
  product: z.string().optional(),
  revenue: z.string().optional(),
  stage: z.string().optional(),
  goals: z.string().optional(),
  tone: z.string().optional().default("Professional"),
  detailLevel: z.string().optional().default("standard"),
});

export type BizPlanRequest = z.infer<typeof bizPlanRequestSchema>;

// BizPlan Reports table
export const bizplanReports = pgTable("bizplan_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().default(''),
  title: text("title").notNull(),
  company: text("company"),
  industry: text("industry"),
  contentHtml: text("content_html").notNull(),
  metadata: json("metadata"),
  approxCharCount: integer("approx_char_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBizplanReportSchema = createInsertSchema(bizplanReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBizplanReport = z.infer<typeof insertBizplanReportSchema>;
export type BizplanReport = typeof bizplanReports.$inferSelect;

// Contract Commander table
export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().default(''),
  
  // Contract metadata
  contractType: text("contract_type").notNull(),
  title: text("title").notNull(),
  effectiveDate: text("effective_date").notNull(),
  
  // Parties
  partyAName: text("party_a_name").notNull(),
  partyARole: text("party_a_role").notNull(),
  partyBName: text("party_b_name").notNull(),
  partyBRole: text("party_b_role").notNull(),
  
  // Terms
  scope: text("scope"),
  compensation: text("compensation"),
  term: text("term"),
  termination: text("termination"),
  confidentiality: text("confidentiality").notNull().default('true'),
  governingLaw: text("governing_law").notNull().default('California, USA'),
  ipOwnership: text("ip_ownership").notNull().default('Company owns'),
  extraClauses: text("extra_clauses"),
  
  // Generation settings
  tone: text("tone").notNull().default('Professional'),
  detailLevel: text("detail_level").notNull().default('Standard'),
  
  // Generated content
  generatedMarkdown: text("generated_markdown").notNull(),
  generatedPdfUrl: text("generated_pdf_url"),
  
  // Signatures
  signatory1Name: text("signatory1_name"),
  signatory1Title: text("signatory1_title"),
  signatory2Name: text("signatory2_name"),
  signatory2Title: text("signatory2_title"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

// Contract request validation schema
export const contractRequestSchema = z.object({
  contractType: z.string().min(1, "Contract type is required"),
  title: z.string().min(1, "Contract title is required"),
  effectiveDate: z.string().min(1, "Effective date is required"),
  
  numberOfParties: z.string().optional().default('2'),
  partyAName: z.string().min(1, "Your organization name is required"),
  partyARole: z.string().min(1, "Your role is required"),
  partyBName: z.string().min(1, "Counterparty name is required"),
  partyBRole: z.string().min(1, "Counterparty role is required"),
  partyCName: z.string().optional(),
  partyCRole: z.string().optional(),
  partyDName: z.string().optional(),
  partyDRole: z.string().optional(),
  partyEName: z.string().optional(),
  partyERole: z.string().optional(),
  partyFName: z.string().optional(),
  partyFRole: z.string().optional(),
  
  scope: z.string().optional(),
  compensation: z.string().optional(),
  term: z.string().optional(),
  termination: z.string().optional(),
  confidentiality: z.union([z.string(), z.boolean()]).optional().default('true').transform(val => typeof val === 'boolean' ? (val ? 'true' : 'false') : val),
  governingLaw: z.string().optional().default('California, USA'),
  ipOwnership: z.string().optional().default('Company owns'),
  extraClauses: z.string().optional(),
  
  tone: z.string().optional().default('Professional'),
  detailLevel: z.string().optional().default('Standard'),
  
  signatory1Name: z.string().optional(),
  signatory1Title: z.string().optional(),
  signatory2Name: z.string().optional(),
  signatory2Title: z.string().optional(),
});

export type ContractRequest = z.infer<typeof contractRequestSchema>;
