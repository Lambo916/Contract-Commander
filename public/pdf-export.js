/**
 * BizPlan Builder - Professional PDF Export System
 * Investor-Ready, Clean Layout with Chart Capture
 * 
 * Features:
 * - Automatic Table of Contents
 * - Chart capture with html2canvas (scale: 2 for crisp rendering)
 * - Repeating headers & footers with page numbers
 * - Professional typography & spacing
 * - jsPDF autoTable for clean table rendering
 * - Consistent margins and visual hierarchy
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

  const loadHtml2Canvas = (() => {
    let cached;
    return async () => {
      if (cached) return cached;
      if (window.html2canvas) {
        cached = window.html2canvas;
        return cached;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () => reject(new Error("Failed to load html2canvas"));
        document.head.appendChild(script);
      });
      cached = window.html2canvas;
      return cached;
    };
  })();

  // ---- Constants ----
  const PAGE = {
    width: 210,  // mm (A4)
    height: 297  // mm
  };

  const MARGINS = {
    top: 25,
    bottom: 25,
    left: 20,
    right: 20
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
    fontFamily: "helvetica",
    sectionHeader: { size: 14, weight: "bold" },
    body: { size: 11, weight: "normal" },
    footer: { size: 9, weight: "normal" },
    lineHeight: 5.5,
    paragraphSpacing: 4,
    colorText: [33, 33, 33],
    colorHeader: [17, 17, 17],
    colorMeta: [102, 102, 102],
    colorBlue: [77, 182, 231],   // #4DB6E7
    colorYellow: [255, 235, 59]  // #FFEB3B
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

  // ---- Chart Capture ----
  async function captureCharts() {
    const html2canvas = await loadHtml2Canvas();
    const charts = {};

    // Capture KPI Chart
    const kpiCanvas = document.getElementById('kpi-chart');
    if (kpiCanvas) {
      try {
        const kpiContainer = kpiCanvas.closest('.kpi-charts-container');
        if (kpiContainer) {
          const canvas = await html2canvas(kpiContainer, {
            scale: 2,
            useCORS: true,
            backgroundColor: null,
            logging: false
          });
          charts.kpi = canvas.toDataURL('image/png');
        }
      } catch (e) {
        console.warn('Failed to capture KPI chart:', e);
      }
    }

    // Capture Financial Charts
    const financialSection = document.querySelector('.financial-charts-section');
    if (financialSection) {
      // Check which view is active
      const combinedView = document.getElementById('combined-chart-view');
      const individualView = document.getElementById('individual-charts-view');

      if (combinedView && !combinedView.classList.contains('hidden')) {
        // Capture combined chart
        try {
          const canvas = await html2canvas(combinedView, {
            scale: 2,
            useCORS: true,
            backgroundColor: null,
            logging: false
          });
          charts.financialCombined = canvas.toDataURL('image/png');
        } catch (e) {
          console.warn('Failed to capture combined financial chart:', e);
        }
      } else if (individualView && !individualView.classList.contains('hidden')) {
        // Capture individual charts
        const chartIds = ['financial-chart-revenue', 'financial-chart-expenses', 'financial-chart-profit'];
        for (const id of chartIds) {
          const canvas = document.getElementById(id);
          if (canvas) {
            try {
              const container = canvas.closest('.individual-chart-item');
              if (container) {
                const capturedCanvas = await html2canvas(container, {
                  scale: 2,
                  useCORS: true,
                  backgroundColor: null,
                  logging: false
                });
                charts[id] = capturedCanvas.toDataURL('image/png');
              }
            } catch (e) {
              console.warn(`Failed to capture ${id}:`, e);
            }
          }
        }
      }
    }

    // Capture Financial Summary panel
    const financialSummary = document.querySelector('.financial-summary-stats');
    if (financialSummary) {
      try {
        const canvas = await html2canvas(financialSummary, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#1a1a1a',
          logging: false
        });
        charts.financialSummary = canvas.toDataURL('image/png');
      } catch (e) {
        console.warn('Failed to capture financial summary:', e);
      }
    }

    // Capture AI Insights panel
    const aiInsights = document.querySelector('.ai-insights-section');
    if (aiInsights) {
      try {
        const canvas = await html2canvas(aiInsights, {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
          logging: false
        });
        charts.aiInsights = canvas.toDataURL('image/png');
      } catch (e) {
        console.warn('Failed to capture AI insights:', e);
      }
    }

    return charts;
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
      this.doc.text("BizPlan Builder | YourBizGuru.com", MARGINS.left, MARGINS.top - 5);
    }

    drawFooter(totalPages) {
      const y = PAGE.height - MARGINS.bottom + 10;
      
      // Footer text
      this.doc.setFont(TYPOGRAPHY.fontFamily, "normal");
      this.doc.setFontSize(TYPOGRAPHY.footer.size);
      this.doc.setTextColor(...TYPOGRAPHY.colorMeta);
      this.doc.text("Powered by YourBizGuru.com    For informational purposes only. Not legal, tax, or financial advice.", 
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
      this.doc.setDrawColor(...TYPOGRAPHY.colorYellow);
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
          fillColor: TYPOGRAPHY.colorBlue,
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

      if (this.needsNewPage(maxHeight + 15)) {
        this.addNewPage();
      }

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

        this.yPosition += 8;
      } catch (e) {
        console.warn('Failed to add image:', e);
        this.addParagraph('[Chart visualization unavailable]');
      }
    }
  }

  // ---- Main Export Function ----
  async function exportToPDF() {
    try {
      console.log('Starting PDF export...');
      
      // Show loading indicator
      const existingToast = document.querySelector('.toast');
      if (existingToast) existingToast.remove();
      
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = '<span class="spinner"></span> Preparing PDF export...';
      document.body.appendChild(toast);

      console.log('Loading jsPDF library...');
      // Load libraries
      const jsPDF = await loadJsPDF();
      console.log('jsPDF loaded, loading autoTable...');
      await loadJsPDFAutoTable();
      console.log('AutoTable loaded');

      toast.innerHTML = '<span class="spinner"></span> Capturing charts...';
      
      // Capture all charts (wait for animations to complete)
      await new Promise(resolve => setTimeout(resolve, 500));
      const charts = await captureCharts();

      toast.innerHTML = '<span class="spinner"></span> Generating PDF...';

      // Initialize PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const writer = new PDFWriter(doc);

      // Get report data from current session
      const reportData = window.currentReportData || {};
      const companyName = reportData.company || 'Business';
      const mainContent = reportData.mainContent || reportData.fullPlan || '';

      // ---- Cover Page ----
      doc.setFont(TYPOGRAPHY.fontFamily, "bold");
      doc.setFontSize(18);
      doc.setTextColor(...TYPOGRAPHY.colorHeader);
      doc.text('BizPlan Builder | YourBizGuru.com', CONTENT.left, 40);
      
      doc.setFont(TYPOGRAPHY.fontFamily, "normal");
      doc.setFontSize(12);
      doc.setTextColor(...TYPOGRAPHY.colorText);
      doc.text(`Generated: ${new Date().toLocaleString()}`, CONTENT.left, 55);
      doc.text(`Company: ${companyName}`, CONTENT.left, 65);
      if (reportData.industry) {
        doc.text(`Industry: ${reportData.industry}`, CONTENT.left, 75);
      }
      if (reportData.stage) {
        doc.text(`Stage: ${reportData.stage}`, CONTENT.left, 85);
      }

      // ---- Page 2: Table of Contents (Placeholder) ----
      writer.addNewPage();
      // We'll record sections as we create them, then come back to update the TOC
      const tocStartY = writer.yPosition;
      const tocPageNumber = writer.pageNumber;
      
      writer.addSectionHeader('Table of Contents');
      
      // Reserve space for TOC (we'll fill it in later)
      const tocReservedSpace = 150; // mm - enough for ~20 sections
      writer.yPosition += tocReservedSpace;

      // ---- Executive Snapshot ----
      if (reportData.executiveSnapshot) {
        writer.addNewPage();
        writer.addSectionHeader('Executive Snapshot');

        const snapshot = reportData.executiveSnapshot;
        
        // Company info as table
        const snapshotData = [
          ['Company', snapshot.company || ''],
          ['Stage', snapshot.stage || ''],
          ['Industry', snapshot.industry || ''],
          ['Target Market', snapshot.targetMarket || '']
        ];
        
        writer.addTable(['Field', 'Value'], snapshotData, {
          0: { cellWidth: 45 },
          1: { cellWidth: 'auto' }
        });

        // Top 3 Goals
        if (snapshot.top3Goals && snapshot.top3Goals.length > 0) {
          writer.addParagraph('Top 3 Goals:');
          doc.setFont(TYPOGRAPHY.fontFamily, "normal");
          doc.setFontSize(11);
          for (const goal of snapshot.top3Goals) {
            if (writer.needsNewPage(TYPOGRAPHY.lineHeight)) {
              writer.addNewPage();
            }
            doc.text(`• ${goal}`, CONTENT.left + 5, writer.yPosition);
            writer.yPosition += TYPOGRAPHY.lineHeight;
          }
          writer.yPosition += TYPOGRAPHY.paragraphSpacing;
        }
      }

      // ---- Main Content ----
      if (mainContent) {
        const lines = mainContent.split('\n');
        let currentSection = '';
        
        for (const line of lines) {
          const trimmed = line.trim();
          
          if (trimmed.startsWith('## ')) {
            // New section
            currentSection = trimmed.substring(3).trim();
            writer.addNewPage();
            writer.addSectionHeader(currentSection);
          } else if (trimmed.startsWith('### ')) {
            // Subsection
            writer.yPosition += 4;
            doc.setFont(TYPOGRAPHY.fontFamily, "bold");
            doc.setFontSize(12);
            doc.setTextColor(...TYPOGRAPHY.colorHeader);
            const subsection = trimmed.substring(4).trim();
            
            if (writer.needsNewPage(10)) {
              writer.addNewPage();
            }
            
            doc.text(subsection, CONTENT.left, writer.yPosition);
            writer.yPosition += 8;
          } else if (trimmed) {
            // Regular paragraph
            writer.addParagraph(trimmed);
          } else {
            // Blank line - add small spacing
            writer.yPosition += TYPOGRAPHY.paragraphSpacing * 0.5;
          }
        }
      }

      // ---- KPI Table & Chart ----
      if (reportData.kpiTable && reportData.kpiTable.length > 0) {
        writer.addNewPage();
        writer.addSectionHeader('Key Performance Indicators');

        const headers = ['Objective', 'KPI', 'Target', 'Timeframe'];
        const rows = reportData.kpiTable.map(kpi => [
          kpi.objective || '',
          kpi.kpi || '',
          kpi.target || '',
          kpi.timeframe || ''
        ]);

        writer.addTable(headers, rows, {
          0: { cellWidth: 60 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 }
        });

        // Add KPI Chart if captured
        if (charts.kpi) {
          writer.addSectionHeader('KPI Visualization');
          writer.addImage(charts.kpi);
        }
      }

      // ---- Financial Projections ----
      if (reportData.financialProjections) {
        writer.addNewPage();
        writer.addSectionHeader('Financial Projections (12-Month Forecast)');

        const fp = reportData.financialProjections;
        
        // Summary stats
        if (fp.revenue && fp.expenses && fp.profit) {
          const totalRevenue = fp.revenue.reduce((a, b) => a + b, 0);
          const totalExpenses = fp.expenses.reduce((a, b) => a + b, 0);
          const totalProfit = fp.profit.reduce((a, b) => a + b, 0);
          const profitMargin = Math.round((totalProfit / totalRevenue) * 100);

          const summaryData = [
            ['Total Year 1 Revenue', `$${totalRevenue.toLocaleString()}`],
            ['Total Year 1 Expenses', `$${totalExpenses.toLocaleString()}`],
            ['Total Year 1 Profit', `$${totalProfit.toLocaleString()}`],
            ['Average Profit Margin', `${profitMargin}%`]
          ];

          writer.addTable(['Metric', 'Value'], summaryData, {
            0: { cellWidth: 80 },
            1: { cellWidth: 'auto' }
          });
        }

        // Add Financial Charts
        if (charts.financialCombined) {
          writer.addImage(charts.financialCombined, 'Revenue, Expenses, and Profit Trends');
        } else if (charts['financial-chart-revenue']) {
          // Individual charts
          writer.addImage(charts['financial-chart-revenue'], 'Revenue Forecast');
          if (charts['financial-chart-expenses']) {
            writer.addImage(charts['financial-chart-expenses'], 'Expense Projection');
          }
          if (charts['financial-chart-profit']) {
            writer.addImage(charts['financial-chart-profit'], 'Profit Trend');
          }
        }
      }

      // ---- AI Insights ----
      if (reportData.aiInsights && reportData.aiInsights.length > 0) {
        writer.addNewPage();
        writer.addSectionHeader('AI Insights');

        for (const insight of reportData.aiInsights) {
          if (writer.needsNewPage(TYPOGRAPHY.lineHeight)) {
            writer.addNewPage();
          }
          doc.setFont(TYPOGRAPHY.fontFamily, "normal");
          doc.setFontSize(11);
          doc.text(`• ${insight}`, CONTENT.left + 3, writer.yPosition);
          writer.yPosition += TYPOGRAPHY.lineHeight + 2;
        }
      }

      // ---- Render Table of Contents with Page Numbers ----
      // Now that all sections are created, go back to page 1 and fill in the TOC
      doc.setPage(tocPageNumber);
      let tocY = tocStartY + 15; // Start below the "Table of Contents" header

      doc.setFont(TYPOGRAPHY.fontFamily, "normal");
      doc.setFontSize(11);
      doc.setTextColor(...TYPOGRAPHY.colorText);

      for (const section of writer.sections) {
        doc.text(`• ${section.title}`, CONTENT.left + 5, tocY);
        
        // Page number (right-aligned)
        const pageNumText = `${section.page}`;
        const pageNumWidth = doc.getTextWidth(pageNumText);
        doc.text(pageNumText, CONTENT.right - pageNumWidth, tocY);
        
        tocY += 7;
      }

      // Add divider after TOC
      tocY += 3;
      doc.setDrawColor(...TYPOGRAPHY.colorYellow);
      doc.setLineWidth(0.34);
      doc.line(CONTENT.left, tocY, CONTENT.right, tocY);

      // ---- Finalize: Add headers and footers to all pages ----
      const totalPages = doc.internal.pages.length - 1; // -1 because first element is null
      
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Re-draw header
        doc.setFont(TYPOGRAPHY.fontFamily, "normal");
        doc.setFontSize(10);
        doc.setTextColor(...TYPOGRAPHY.colorMeta);
        doc.text("BizPlan Builder | YourBizGuru.com", MARGINS.left, MARGINS.top - 5);
        
        // Re-draw footer
        const y = PAGE.height - MARGINS.bottom + 10;
        doc.setFont(TYPOGRAPHY.fontFamily, "normal");
        doc.setFontSize(TYPOGRAPHY.footer.size);
        doc.setTextColor(...TYPOGRAPHY.colorMeta);
        doc.text("Powered by YourBizGuru.com   For informational purposes only. Not legal, tax, or financial advice.", 
          MARGINS.left, y);
        
        // Page number
        const pageText = `Page ${i} of ${totalPages}`;
        const pageWidth = doc.getTextWidth(pageText);
        doc.text(pageText, CONTENT.right - pageWidth, y);
      }

      // ---- Save PDF ----
      const filename = `BizPlanBuilder_${sanitizeFilename(companyName)}_${formatDate()}.pdf`;
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
      console.error('Error details - message:', error?.message, 'stack:', error?.stack);
      
      const existingToast = document.querySelector('.toast');
      if (existingToast) existingToast.remove();
      
      const errorToast = document.createElement('div');
      errorToast.className = 'toast error';
      const errorMsg = error?.message || error?.toString() || 'Unknown error';
      errorToast.textContent = '✗ PDF export failed: ' + errorMsg;
      document.body.appendChild(errorToast);
      setTimeout(() => errorToast.remove(), 5000);
      
      // Re-throw to see full error in console
      throw error;
    }
  }

  // Export to global scope
  window.exportBizPlanToPDF = exportToPDF;
  
  // Confirm script loaded
  console.log('✓ PDF export module loaded successfully');
})();
