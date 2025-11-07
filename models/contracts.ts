// Contract Commander - Shared type definitions
// Used across frontend, backend, and API routes

export type Party = {
  name: string;
  role?: 'Company' | 'Client' | 'Contractor' | 'Employee' | string;
  address?: string;
  email?: string;
  phone?: string;
};

export type Clause = {
  title: string;
  text: string;
  section?: string;
  order?: number;
};

export type ContractInput = {
  // Core information
  companyName: string;
  industry?: string;
  productOrService?: string;
  paymentModel?: string;
  currentStage?: string;
  objectives?: string[];
  
  // Contract-specific
  contractType?: 'NDA' | 'Service Agreement' | 'Employment Agreement' | 'MOU' | 'Consulting Agreement' | 'Partnership Agreement' | string;
  parties?: Party[];
  
  // Generation preferences
  tone?: 'Professional' | 'Investor-ready' | 'Plain-language' | 'Technical' | string;
  detailLevel?: 'Brief' | 'Standard' | 'Comprehensive' | string;
  
  // Additional context
  specialTerms?: string[];
  jurisdiction?: string;
  duration?: string;
};

export type GeneratedContract = {
  title: string;
  summary: string;
  clauses: Clause[];
  notes?: string[];
  warnings?: string[];
  raw?: string; // Raw HTML content
  metadata?: {
    generatedAt?: string;
    model?: string;
    version?: string;
  };
};

// BizPlan/Contract report database schema types
export type SavedReport = {
  id: number;
  userId: string | null;
  title: string;
  companyName: string;
  industry: string | null;
  htmlContent: string;
  checksum: string;
  metadata: any;
  createdAt: Date;
};

// API request/response types
export type GenerateContractRequest = ContractInput;

export type GenerateContractResponse = {
  success: boolean;
  contract?: GeneratedContract;
  error?: string;
};

export type SaveReportRequest = {
  title: string;
  companyName: string;
  industry?: string;
  htmlContent: string;
  metadata?: any;
};

export type SaveReportResponse = {
  success: boolean;
  reportId?: number;
  error?: string;
};
