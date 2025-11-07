// Contract Commander - Shared type definitions
// Used across frontend, backend, and API routes

export type ContractType = 
  | 'NDA' 
  | 'Service Agreement' 
  | 'MOU' 
  | 'Employment Agreement' 
  | 'Partnership Agreement' 
  | 'Custom';

export type PartyRole = 
  | 'Employer'
  | 'Client'
  | 'Company'
  | 'Service Provider'
  | 'Disclosing Party'
  | 'Receiving Party'
  | 'Contractor'
  | 'Vendor'
  | 'Consultant'
  | 'Employee'
  | 'Partner'
  | string;

export type Party = {
  name: string;
  role: PartyRole;
  address?: string;
  email?: string;
  phone?: string;
};

export type Tone = 'Professional' | 'Friendly' | 'Legal';
export type DetailLevel = 'Summary' | 'Standard' | 'Comprehensive';
export type IPOwnership = 'Company owns' | 'Contractor owns' | 'Joint';

// Frontend form input structure
export type ContractInput = {
  // Contract Setup
  contractType: ContractType;
  title: string;
  effectiveDate: string;
  
  // Parties
  partyAName: string;
  partyARole: PartyRole;
  partyBName: string;
  partyBRole: PartyRole;
  
  // Key Terms
  scope?: string;
  compensation?: string;
  term?: string;
  termination?: string;
  confidentiality?: boolean | string; // Can be boolean from form or string from API
  
  // Legal Options
  governingLaw?: string;
  ipOwnership?: IPOwnership;
  extraClauses?: string;
  
  // Output & Signature
  tone?: Tone;
  detailLevel?: DetailLevel;
  signatory1Name?: string;
  signatory1Title?: string;
  signatory2Name?: string;
  signatory2Title?: string;
  outputFormat?: 'PDF' | 'Markdown' | 'Text';
};

// Generated contract structure
export type GeneratedContract = {
  title: string;
  effectiveDate: string;
  parties: {
    partyA: Party;
    partyB: Party;
  };
  sections: {
    recitals?: string;
    definitions?: string;
    scope?: string;
    compensation?: string;
    confidentiality?: string;
    ipOwnership?: string;
    warranties?: string;
    termAndTermination?: string;
    governingLaw?: string;
    entireAgreement?: string;
    [key: string]: string | undefined;
  };
  signatures: {
    signatory1?: { name: string; title: string };
    signatory2?: { name: string; title: string };
  };
  markdown?: string; // Full markdown content
  metadata?: {
    generatedAt?: string;
    model?: string;
    version?: string;
  };
};

// API request/response types
export type GenerateContractRequest = ContractInput;

export type GenerateContractResponse = {
  success: boolean;
  contract?: GeneratedContract;
  error?: string;
};

export type SaveContractRequest = {
  userId?: string;
  contractType: string;
  title: string;
  effectiveDate: string;
  partyAName: string;
  partyARole: string;
  partyBName: string;
  partyBRole: string;
  scope?: string;
  compensation?: string;
  term?: string;
  termination?: string;
  confidentiality?: string;
  governingLaw?: string;
  ipOwnership?: string;
  extraClauses?: string;
  tone?: string;
  detailLevel?: string;
  generatedMarkdown: string;
  signatory1Name?: string;
  signatory1Title?: string;
  signatory2Name?: string;
  signatory2Title?: string;
};

export type SaveContractResponse = {
  success: boolean;
  contractId?: string;
  error?: string;
};
