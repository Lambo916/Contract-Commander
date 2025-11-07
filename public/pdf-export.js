/**
 * Contract Commander - Professional PDF Export System
 * Legal Document Formatting with Professional Typography
 * 
 * Features:
 * - Legal document formatting (serif font, proper margins)
 * - Repeating headers & footers with page numbers
 * - Professional legal typography & spacing
 * - Clean section rendering with proper hierarchy
 * - Signature block formatting
 */

(() => {
  'use strict';

  // ---- Library Loaders ----
  const loadJsPDF = (() => {
    let cached;
    return async () => {
      if (cached) return cached;
      if (window.jspdf?.jsPDF) {
        cached = window.jspdf.jsPDF;
        return cached;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () => reject(new Error("Failed to load jsPDF"));
        document.head.appendChild(script);
      });
      cached = window.jspdf.jsPDF;
      return cached;
    };
  })();

  const loadJsPDFAutoTable = (() => {
    let cached;
    return async () => {
      if (cached) return cached;
      if (window.jspdf?.jsPDF?.API?.autoTable) {
        cached = true;
        return cached;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.5.31/dist/jspdf.plugin.autotable.min.js";
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () => reject(new Error("Failed to load jsPDF-AutoTable"));
        document.head.appendChild(script);
      });
      cached = true;
      return cached;
    };
  })();

  // ---- Constants ----
  const PAGE = {
    width: 210,  // mm (A4)
    height: 297  // mm
  };

  const MARGINS = {
    top: 25.4,    // 1 inch
    bottom: 25.4, // 1 inch
    left: 25.4,   // 1 inch
    right: 25.4   // 1 inch
  };

  const CONTENT = {
    left: MARGINS.left,
    right: PAGE.width - MARGINS.right,
    top: MARGINS.top + 12, // Space for header
    bottom: PAGE.height - MARGINS.bottom - 15, // Space for footer
    get width() { return this.right - this.left; },
    get height() { return this.bottom - this.top; }
  };

  const TYPOGRAPHY = {
    fontFamily: "times",         // Serif font for legal documents
    sectionHeader: { size: 12, weight: "bold" },
    body: { size: 11, weight: "normal" },
    footer: { size: 9, weight: "normal" },
    lineHeight: 5.5,
    paragraphSpacing: 4,
    colorText: [0, 0, 0],        // Pure black for legal documents
    colorHeader: [0, 0, 0],      // Pure black for headers
    colorMeta: [102, 102, 102],
    colorGold: [245, 197, 67],   // #F5C543 (Contract Commander gold)
    colorAccent: [201, 201, 209]  // #C9C9D1 (light gray accent)
  };

  // ---- Helper Functions ----
  function wrapText(doc, text, maxWidth, fontSize) {
    doc.setFontSize(fontSize);
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = doc.getTextWidth(testLine);
      
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  function formatDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  function sanitizeFilename(name) {
    return name.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
  }

  // ---- PDF Writer Class ----
  class PDFWriter {
    constructor(doc) {
      this.doc = doc;
      this.yPosition = CONTENT.top;
      this.pageNumber = 1;
      this.sections = [];
    }

    addSection(title) {
      this.sections.push({ title, page: this.pageNumber });
    }

    drawHeader() {
      this.doc.setFont(TYPOGRAPHY.fontFamily, "normal");
      this.doc.setFontSize(10);
      this.doc.setTextColor(...TYPOGRAPHY.colorMeta);
      this.doc.text("Contract Commander", MARGINS.left, MARGINS.top - 5);
    }

    drawFooter(totalPages) {
      const y = PAGE.height - MARGINS.bottom + 10;
      
      // Footer text
      this.doc.setFont(TYPOGRAPHY.fontFamily, "normal");
      this.doc.setFontSize(TYPOGRAPHY.footer.size);
      this.doc.setTextColor(...TYPOGRAPHY.colorMeta);
      this.doc.text("Contract Commander    For informational purposes only. Not legal, tax, or financial advice.", 
        MARGINS.left, y);
      
      // Page number (right-aligned)
      const pageText = `Page ${this.pageNumber} of ${totalPages}`;
      const pageWidth = this.doc.getTextWidth(pageText);
      this.doc.text(pageText, CONTENT.right - pageWidth, y);
    }

    addNewPage() {
      this.doc.addPage();
      this.pageNumber++;
      this.yPosition = CONTENT.top;
      this.drawHeader();
      // Note: Footer will be added in final pass with correct total page count
    }

    needsNewPage(requiredHeight) {
      return this.yPosition + requiredHeight > CONTENT.bottom;
    }

    addDivider() {
      // Slim yellow divider (15% thinner = 0.34mm instead of 0.4mm)
      this.doc.setDrawColor(...TYPOGRAPHY.colorAccent);
      this.doc.setLineWidth(0.34);
      this.doc.line(CONTENT.left, this.yPosition, CONTENT.right, this.yPosition);
      this.yPosition += 4; // 10px top + 15px bottom spacing
    }

    addSectionHeader(title) {
      // Add spacing before section
      if (this.yPosition > CONTENT.top + 10) {
        this.yPosition += 10; // Top spacing
      }

      // Check if we need a new page
      if (this.needsNewPage(20)) {
        this.addNewPage();
      }

      // Section title
      this.doc.setFont(TYPOGRAPHY.fontFamily, TYPOGRAPHY.sectionHeader.weight);
      this.doc.setFontSize(TYPOGRAPHY.sectionHeader.size);
      this.doc.setTextColor(...TYPOGRAPHY.colorHeader);
      this.doc.text(title, CONTENT.left, this.yPosition);
      this.yPosition += 6;

      // Divider below title
      this.addDivider();
      this.yPosition += 5; // Bottom spacing
      
      // Record section for TOC
      this.addSection(title);
    }

    addParagraph(text) {
      this.doc.setFont(TYPOGRAPHY.fontFamily, TYPOGRAPHY.body.weight);
      this.doc.setFontSize(TYPOGRAPHY.body.size);
      this.doc.setTextColor(...TYPOGRAPHY.colorText);

      const lines = wrapText(this.doc, text, CONTENT.width, TYPOGRAPHY.body.size);
      
      for (const line of lines) {
        if (this.needsNewPage(TYPOGRAPHY.lineHeight)) {
          this.addNewPage();
        }
        this.doc.text(line, CONTENT.left, this.yPosition);
        this.yPosition += TYPOGRAPHY.lineHeight;
      }
      
      this.yPosition += TYPOGRAPHY.paragraphSpacing;
    }

    addTable(headers, rows, columnWidths = null) {
      const startY = this.yPosition;
      
      const tableConfig = {
        head: [headers],
        body: rows,
        startY: startY,
        margin: { left: MARGINS.left, right: MARGINS.right },
        theme: 'grid',
        headStyles: {
          fillColor: TYPOGRAPHY.colorGold,
          textColor: [255, 255, 255],
          fontSize: 11,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 10,
          textColor: TYPOGRAPHY.colorText,
          cellPadding: 2.2
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        styles: {
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        didDrawPage: (data) => {
          // Update page number and position if table spans multiple pages
          if (data.pageNumber > this.pageNumber) {
            this.pageNumber = data.pageNumber;
            this.drawHeader();
          }
        }
      };
      
      // Add custom column widths if provided
      if (columnWidths) {
        tableConfig.columnStyles = columnWidths;
      }
      
      this.doc.autoTable(tableConfig);

      this.yPosition = this.doc.lastAutoTable.finalY + 8;
    }

    addImage(imageData, caption = '') {
      if (!imageData) return;

      const maxWidth = CONTENT.width;
      const maxHeight = 80; // mm

      // Check if new page needed first
      if (this.needsNewPage(maxHeight + 25)) {
        this.addNewPage();
      }

      // Add spacing before chart AFTER page check (10-15mm as requested)
      this.yPosition += 12;

      try {
        this.doc.addImage(imageData, 'PNG', CONTENT.left, this.yPosition, maxWidth, maxHeight, '', 'FAST');
        this.yPosition += maxHeight;

        if (caption) {
          this.yPosition += 3;
          this.doc.setFont(TYPOGRAPHY.fontFamily, "normal");
          this.doc.setFontSize(9);
          this.doc.setTextColor(...TYPOGRAPHY.colorMeta);
          this.doc.text(caption, CONTENT.left, this.yPosition);
          this.yPosition += 5;
        }

        // Add more spacing after chart
        this.yPosition += 12;
      } catch (e) {
        console.warn('Failed to add image:', e);
        this.addParagraph('[Chart visualization unavailable]');
      }
    }
  }

  // ---- Main Export Function ----
  async function exportToPDF() {
    try {
      console.log('Starting contract PDF export...');
      
      // Show loading indicator
      const existingToast = document.querySelector('.toast');
      if (existingToast) existingToast.remove();
      
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = '<span class="spinner"></span> Generating PDF...';
      document.body.appendChild(toast);

      // Load jsPDF library
      const jsPDF = await loadJsPDF();
      await loadJsPDFAutoTable();

      // Initialize PDF with legal document settings
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const writer = new PDFWriter(doc);

      // Get contract data from current session
      const reportData = window.currentReportData || {};
      const contractTitle = reportData.contractType || 'Contract';
      const parties = reportData.parties || 'Parties';
      const mainContent = reportData.mainContent || reportData.markdown || '';

      // ---- Main Contract Content ----
      if (mainContent) {
        const lines = mainContent.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          
          // Handle heading levels
          if (trimmed.startsWith('# ')) {
            // Title (H1) - centered and larger
            const title = trimmed.substring(2).trim();
            doc.setFont(TYPOGRAPHY.fontFamily, "bold");
            doc.setFontSize(16);
            doc.setTextColor(...TYPOGRAPHY.colorHeader);
            const titleWidth = doc.getTextWidth(title);
            const titleX = (PAGE.width - titleWidth) / 2;
            doc.text(title, titleX, writer.yPosition);
            writer.yPosition += 10;
          } else if (trimmed.startsWith('## ')) {
            // Section heading (H2)
            const section = trimmed.substring(3).trim();
            writer.yPosition += 6;
            if (writer.needsNewPage(20)) {
              writer.addNewPage();
            }
            writer.addSectionHeader(section);
          } else if (trimmed.startsWith('### ')) {
            // Subsection (H3)
            writer.yPosition += 4;
            doc.setFont(TYPOGRAPHY.fontFamily, "bold");
            doc.setFontSize(11);
            doc.setTextColor(...TYPOGRAPHY.colorHeader);
            const subsection = trimmed.substring(4).trim();
            if (writer.needsNewPage(10)) {
              writer.addNewPage();
            }
            doc.text(subsection, CONTENT.left, writer.yPosition);
            writer.yPosition += 7;
          } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
            // Bold paragraph (for party names, signature blocks)
            const boldText = trimmed.substring(2, trimmed.length - 2);
            doc.setFont(TYPOGRAPHY.fontFamily, "bold");
            doc.setFontSize(11);
            doc.setTextColor(...TYPOGRAPHY.colorText);
            if (writer.needsNewPage(TYPOGRAPHY.lineHeight)) {
              writer.addNewPage();
            }
            doc.text(boldText, CONTENT.left, writer.yPosition);
            writer.yPosition += TYPOGRAPHY.lineHeight + 2;
          } else if (trimmed) {
            // Regular paragraph
            writer.addParagraph(trimmed);
          } else {
            // Blank line - add small spacing
            writer.yPosition += TYPOGRAPHY.paragraphSpacing * 0.5;
          }
        }
      }

      // ---- Finalize: Add headers and footers to all pages ----
      const totalPages = doc.internal.pages.length - 1;
      
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        writer.pageNumber = i;
        writer.drawHeader();
        writer.drawFooter(totalPages);
      }

      // ---- Save PDF ----
      const filename = `Contract_${sanitizeFilename(contractTitle)}_${formatDate()}.pdf`;
      doc.save(filename);

      // Success message
      toast.remove();
      const successToast = document.createElement('div');
      successToast.className = 'toast success';
      successToast.textContent = '✓ PDF exported successfully!';
      document.body.appendChild(successToast);
      setTimeout(() => successToast.remove(), 3000);

    } catch (error) {
      console.error('PDF export failed:', error);
      
      const existingToast = document.querySelector('.toast');
      if (existingToast) existingToast.remove();
      
      const errorToast = document.createElement('div');
      errorToast.className = 'toast error';
      const errorMsg = error?.message || error?.toString() || 'Unknown error';
      errorToast.textContent = '✗ PDF export failed: ' + errorMsg;
      document.body.appendChild(errorToast);
      setTimeout(() => errorToast.remove(), 5000);
      
      throw error;
    }
  }

  // Export to global scope
  window.exportBizPlanToPDF = exportToPDF;
  
  // Confirm script loaded
  console.log('✓ PDF export module loaded successfully');
})();
