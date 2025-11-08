/* =========================================================
   CONTRACT COMMANDER — Production PDF + Compliance Layer
   Version: v2.2  •  Date: 2025-11-08
   ---------------------------------------------------------
   What you get:
   - Clean PDF layout (no intrusive watermark)
   - Small professional footer + page numbers
   - Centralized in-app legal notice (one place)
   - Optional end-of-doc disclaimer (subtle, not every page)
   - Proper filename formatting to your standard
   - Safe defaults that won't break existing UI
   - Title sanitizer so quick test titles don't look odd
   Dependencies: jsPDF (^2.x)
   ========================================================= */

(() => {
  'use strict';

  //////////////////////////////
  // 0) BRAND / LEGAL CONFIG
  //////////////////////////////
  const CC_CONFIG = {
    productName: "Contract Commander",
    siteUrl: "https://YourBizGuru.com",
    companyLegalName: "Big Stake Consulting LLC",
    // PDF look-and-feel
    pdf: {
      margin: { top: 72, right: 72, bottom: 72, left: 72 },
      header: { show: true, showLogo: false, logoDataUrl: "", logoWidth: 28 },
      footer: { show: true },
      // Keep disclaimers subtle: appended once at the END (not on every page).
      appendEndDisclaimer: true,
      showWatermark: false, // keep OFF for professional look
    },
    // Centralized in-app notice (visible in the app footer)
    appNotice: {
      show: true,
      html: `
        <footer style="text-align:center; padding:12px 20px; font-size:12px; color:#aaa; margin-top: 40px; border-top: 1px solid rgba(150,150,150,0.2);">
          ⚠️ <strong>Legal Notice:</strong> Contract Commander is an AI-assisted document generator.
          Content is for <strong>informational and drafting purposes only</strong> and is not legal, tax, or financial advice.
          No attorney-client relationship is created. Review with a qualified professional before use.
        </footer>
      `,
    },
    // Optional: auto-inject a light disclaimer paragraph at the very end
    endDisclaimerText: `
This document was generated using Contract Commander (YourBizGuru.com).
It is provided for informational and drafting purposes only and does not constitute legal, tax, or financial advice.
No attorney-client relationship is formed. Review and adapt before execution.
    `.trim(),
    // File naming (matches your YYYY-MM-DD_Acronym_Description.pdf convention)
    fileAcronym: "YBG", // your platform acronym
  };

  //////////////////////////////
  // 1) IN-APP FOOTER (disabled - using static HTML footer)
  //////////////////////////////
  function mountAppLegalFooterOnce() {
    // Footer is now in static HTML - no need to inject
    return;
  }

  //////////////////////////////
  // 2) UTILS
  //////////////////////////////
  function titleCase(s = "") {
    return s
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace(/\s+/g, " ")
      .trim();
  }

  function sanitizeTitleForFilename(s = "") {
    return s.replace(/[^a-z0-9\-_\s]/gi, "").replace(/\s+/g, "_").slice(0, 80);
  }

  function ymd() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function safeDocTitle(inputTitle, fallback) {
    const t = titleCase((inputTitle || "").trim());
    if (!t || t.toLowerCase() === "considering") return fallback;
    return t;
  }

  //////////////////////////////
  // 3) PDF CORE
  //////////////////////////////
  async function loadJsPDF() {
    if (window.jspdf?.jsPDF) {
      return window.jspdf.jsPDF;
    }
    // Wait for script to load if not available
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (window.jspdf?.jsPDF) {
          clearInterval(checkInterval);
          resolve(window.jspdf.jsPDF);
        }
      }, 100);
    });
  }

  function addHeader(doc, contractTitle = "") {
    // White-label mode: no header branding
    return;
  }

  function addFooter(doc, pageNumber, totalPages, isLastPage = false) {
    if (!CC_CONFIG.pdf.footer.show) return;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    if (isLastPage) {
      // White-label mode: Last page shows only disclaimer with divider
      const legalY = pageHeight - 120;
      
      // Light divider line
      doc.setDrawColor(224, 224, 224);  // #e0e0e0
      doc.setLineWidth(0.5);
      doc.line(
        CC_CONFIG.pdf.margin.left,
        legalY - 10,
        pageWidth - CC_CONFIG.pdf.margin.right,
        legalY - 10
      );
      
      // Disclaimer only (no copyright, no branding)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(119, 119, 119);  // #777777
      const disclaimerText = "Disclaimer: This document is generated automatically for informational and drafting purposes only and does not constitute legal, tax, or financial advice. No attorney-client relationship is created.";
      const maxWidth = pageWidth - CC_CONFIG.pdf.margin.left - CC_CONFIG.pdf.margin.right;
      const disclaimerLines = doc.splitTextToSize(disclaimerText, maxWidth);
      
      // Center-align the disclaimer
      let disclaimerY = legalY;
      for (const line of disclaimerLines) {
        const lineWidth = doc.getTextWidth(line);
        const x = (pageWidth - lineWidth) / 2;
        doc.text(line, x, disclaimerY);
        disclaimerY += 12;
      }
    }
    // White-label mode: Pages 1..N-1 have no footer at all
  }

  function addWatermark(doc) {
    if (!CC_CONFIG.pdf.showWatermark) return;
    const { width, height } = doc.internal.pageSize;
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.06 }));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(72);
    doc.setTextColor(60);
    doc.text("CONTRACT COMMANDER", width / 2, height / 2, { align: "center", angle: 30 });
    doc.restoreGraphicsState();
  }

  // Minimal HTML → text helper (keeps it safe & consistent)
  function htmlToPlainText(html = "") {
    return (
      (html || "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<li>/gi, "• ")
        .replace(/<\/li>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\u00A0/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .trim()
    );
  }

  //////////////////////////////
  // 4) PUBLIC API — Generate
  //////////////////////////////
  /**
   * generateContractPDF
   * @param {Object} opts
   * @param {string} opts.contractType   e.g., "Service Agreement", "NDA", "MOU"
   * @param {string} opts.title          user-provided title from UI (may be quick test text)
   * @param {string} opts.effectiveDate  e.g., "Nov 8, 2025"
   * @param {Object} opts.parties        { companyName, counterpartyName, partyCName? }
   * @param {string} opts.bodyHtml       already-generated HTML for the clauses/sections
   * @param {boolean} opts.appendDisclaimerOverride  force on/off (optional)
   */
  async function generateContractPDF(opts) {
    try {
      const {
        contractType = "Agreement",
        title = "",
        effectiveDate = "",
        parties = {},
        bodyHtml = "",
        appendDisclaimerOverride,
      } = opts || {};

      // Show loading toast
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = '<span class="spinner"></span> Generating PDF...';
      document.body.appendChild(toast);

      // Load jsPDF
      const jsPDF = await loadJsPDF();

      // Build a professional visible title:
      const visibleTitle = safeDocTitle(
        title,
        `${contractType} — ${[parties.companyName, parties.counterpartyName].filter(Boolean).join(" & ")}`
      );

      // Prepare document
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      doc.setProperties({
        title: `${contractType} — ${visibleTitle} — ${ymd()}`,
        subject: "Generated by Contract Commander",
        author: "YourBizGuru LLC",
        keywords: "Contract Commander, YourBizGuru, AI Document Generator, Legal Contract",
        creator: "Contract Commander | YourBizGuru.com"
      });

      // First page visuals
      addHeader(doc, contractType);
      addWatermark(doc);

      // Cursor start (respect margins + header)
      let cursorY = CC_CONFIG.pdf.margin.top + 35;

      // Title block
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(20);
      doc.text(visibleTitle, CC_CONFIG.pdf.margin.left, cursorY);
      cursorY += 20;

      // Meta line
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(70);
      const metaLine = [
        effectiveDate ? `Effective Date: ${effectiveDate}` : null,
        parties.companyName ? `Party: ${parties.companyName}` : null,
        parties.counterpartyName ? `Counterparty: ${parties.counterpartyName}` : null,
      ]
        .filter(Boolean)
        .join("   •   ");

      if (metaLine) {
        doc.text(metaLine, CC_CONFIG.pdf.margin.left, cursorY);
        cursorY += 16;
      }

      // Divider
      doc.setDrawColor(220);
      doc.setLineWidth(0.6);
      doc.line(
        CC_CONFIG.pdf.margin.left,
        cursorY,
        doc.internal.pageSize.getWidth() - CC_CONFIG.pdf.margin.right,
        cursorY
      );
      cursorY += 20;

      // Main body (convert minimal HTML to text)
      const plain = htmlToPlainText(bodyHtml).split("\n");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(30);

      const maxWidth =
        doc.internal.pageSize.getWidth() -
        CC_CONFIG.pdf.margin.left -
        CC_CONFIG.pdf.margin.right;

      for (const para of plain) {
        const lines = doc.splitTextToSize(para || " ", maxWidth);
        for (const ln of lines) {
          // Check if we need a new page (leave 150pt for footer on last page)
          if (cursorY > doc.internal.pageSize.getHeight() - 150) {
            // Add new page
            doc.addPage();
            addHeader(doc, contractType);
            addWatermark(doc);
            cursorY = CC_CONFIG.pdf.margin.top + 20;
          }
          doc.text(ln, CC_CONFIG.pdf.margin.left, cursorY);
          cursorY += 15;  // Increased line spacing
        }
        cursorY += 10;  // Increased paragraph spacing
      }

      // Remove old disclaimer logic (legal notice now only on last page footer)
      
      // Finalize footers with real page numbers
      const total = doc.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        const isLast = (i === total);
        addFooter(doc, i, total, isLast);
      }

      // Filename per spec: {YYYY}-{MM}-{DD}_ContractCommander_{ContractType}_{Counterparty}.pdf
      const counterparty = parties.counterpartyName || parties.companyName || "Contract";
      const filename = `${ymd()}_ContractCommander_${sanitizeTitleForFilename(contractType)}_${sanitizeTitleForFilename(counterparty)}.pdf`;

      doc.save(filename);

      // Remove loading toast
      toast.remove();

      // Success toast
      const successToast = document.createElement('div');
      successToast.className = 'toast success';
      successToast.textContent = '✓ PDF exported successfully!';
      document.body.appendChild(successToast);
      setTimeout(() => successToast.remove(), 3000);

    } catch (error) {
      console.error('PDF export failed:', error);
      
      // Remove any existing toasts
      document.querySelectorAll('.toast').forEach(t => t.remove());
      
      const errorToast = document.createElement('div');
      errorToast.className = 'toast error';
      const errorMsg = error?.message || error?.toString() || 'Unknown error';
      errorToast.textContent = '✗ PDF export failed: ' + errorMsg;
      document.body.appendChild(errorToast);
      setTimeout(() => errorToast.remove(), 5000);
      
      throw error;
    }
  }

  //////////////////////////////
  // 5) EXPORT TO WINDOW
  //////////////////////////////
  
  // Export main PDF generation function
  async function exportToPDF() {
    // Get contract data from current session
    const reportData = window.currentReportData || {};
    
    if (!reportData.mainContent) {
      throw new Error('No contract content available');
    }

    // Get report view HTML
    const reportView = document.getElementById('report-view');
    const bodyHtml = reportView ? reportView.innerHTML : reportData.mainContent;

    // Call the new PDF generator
    await generateContractPDF({
      contractType: reportData.contractType || 'Agreement',
      title: reportData.title || reportData.contractType || 'Contract',
      effectiveDate: reportData.effectiveDate || '',
      parties: {
        companyName: reportData.parties?.companyName || reportData.partyAName || '',
        counterpartyName: reportData.parties?.counterpartyName || reportData.partyBName || '',
      },
      bodyHtml: bodyHtml,
    });
  }

  // Export to global scope (for compatibility with existing code)
  window.exportBizPlanToPDF = exportToPDF;
  window.generateContractPDF = generateContractPDF;
  
  // Version tag
  console.info('✅ Contract Commander polished version v1.0 loaded successfully.');
})();
