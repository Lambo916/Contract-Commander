// PDF export utilities for Contract Commander
// This is a thin wrapper around the browser-based PDF generation
// The actual implementation lives in public/pdf-export.js for now

export type PdfSection = {
  title?: string;
  body: string;
};

export type PdfOptions = {
  filename?: string;
  metadata?: {
    title?: string;
    subject?: string;
    author?: string;
    creator?: string;
  };
};

// Placeholder for server-side PDF generation
// Currently, PDF generation happens in the browser via public/pdf-export.js
// This wrapper provides a consistent API for future server-side generation
export async function exportPdf(sections: PdfSection[], options: PdfOptions = {}) {
  // TODO: Implement server-side PDF generation using a library like pdfkit or puppeteer
  // For now, this is a placeholder that would be called from serverless functions
  
  return {
    buffer: Buffer.from(''),
    filename: options.filename ?? 'document.pdf',
    contentType: 'application/pdf',
  };
}

// Type definitions for the browser-based PDF export
// (Used by public/pdf-export.js and public/bizplan-app.js)
export interface BrowserPdfExportOptions {
  filename?: string;
  metadata?: {
    companyName?: string;
    industry?: string;
    generatedDate?: string;
  };
}

// Re-export for convenience
export { type PdfSection as Section, type PdfOptions as Options };
