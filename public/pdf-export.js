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
      margin: { top: 54, right: 54, bottom: 54, left: 54 },
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

  // Helper function to load image and get actual dimensions
  function getImageDimensions(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        resolve({ width: 150, height: 50 }); // Fallback dimensions
      };
      img.src = dataUrl;
    });
  }

  async function addHeader(doc, contractTitle = "", brandingConfig = null, pageNum = 1) {
    // Phase 1: Render user branding on first page (or all pages in Phase 2)
    if (!brandingConfig || !brandingConfig.enabled) {
      return; // White-label mode: no header
    }
    
    // Phase 1: Only render on first page (Phase 2 will support "all pages")
    const showOnPage = (brandingConfig.pages === 'all') ? true : (pageNum === 1);
    if (!showOnPage) return;
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginLeft = CC_CONFIG.pdf.margin.left;
    const marginRight = CC_CONFIG.pdf.margin.right;
    const headerTop = 32; // Professional compact header
    
    let logoWidth = 0;
    let logoHeight = 0;
    let hasLogo = false;
    let cursorY = headerTop;
    
    // Check if we have a renderable logo (PNG/JPEG only)
    if (brandingConfig.logoDataUrl) {
      // Detect image format from data URL
      let imageFormat = 'PNG';
      let canRender = true;
      
      if (brandingConfig.logoDataUrl.startsWith('data:image/jpeg')) {
        imageFormat = 'JPEG';
      } else if (brandingConfig.logoDataUrl.startsWith('data:image/jpg')) {
        imageFormat = 'JPEG';
      } else if (brandingConfig.logoDataUrl.startsWith('data:image/svg+xml')) {
        console.warn('SVG logos not supported in PDF export.');
        canRender = false;
      }
      
      if (canRender) {
        // Load actual image dimensions to preserve aspect ratio
        const actualDimensions = await getImageDimensions(brandingConfig.logoDataUrl);
        const actualAspectRatio = actualDimensions.width / actualDimensions.height;
        
        // Professional sizing: 80-100px height for better visibility
        const maxLogoHeight = 85;
        logoHeight = maxLogoHeight;
        logoWidth = logoHeight * actualAspectRatio; // Preserve actual aspect ratio
        hasLogo = true;
      }
    }
    
    // Prepare letterhead text - DocuSign-grade professional
    const hasLetterhead = brandingConfig.company || brandingConfig.address || brandingConfig.contact;
    const companyFontSize = 9;
    const detailFontSize = 8;
    let maxTextWidth = 0;
    
    // Calculate actual letterhead width if present
    if (hasLetterhead) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(companyFontSize);
      if (brandingConfig.company) {
        maxTextWidth = Math.max(maxTextWidth, doc.getTextWidth(brandingConfig.company));
      }
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(detailFontSize);
      if (brandingConfig.address) {
        const addressLines = brandingConfig.address.split('\n');
        addressLines.forEach(line => {
          if (line.trim()) {
            maxTextWidth = Math.max(maxTextWidth, doc.getTextWidth(line.trim()));
          }
        });
      }
      if (brandingConfig.contact) {
        maxTextWidth = Math.max(maxTextWidth, doc.getTextWidth(brandingConfig.contact));
      }
    }
    
    // Calculate positions based on alignment - DocuSign-style compact spacing
    let logoX = marginLeft;
    let letterheadX = marginLeft;
    const gap = 10; // Tighter gap for professional look
    
    if (brandingConfig.position === 'center') {
      if (hasLogo && hasLetterhead) {
        // Both logo and text: center as a unit
        const totalWidth = logoWidth + gap + maxTextWidth;
        logoX = (pageWidth - totalWidth) / 2;
        letterheadX = logoX + logoWidth + gap;
      } else if (hasLogo) {
        // Logo only: center the logo
        logoX = (pageWidth - logoWidth) / 2;
      } else if (hasLetterhead) {
        // Text only: center the text
        letterheadX = pageWidth / 2;
      }
    } else {
      // Left alignment
      if (hasLogo) {
        logoX = marginLeft;
        letterheadX = marginLeft + logoWidth + gap;
      } else {
        letterheadX = marginLeft;
      }
    }
    
    // Render logo if we have one
    if (hasLogo) {
      try {
        const imageFormat = brandingConfig.logoDataUrl.startsWith('data:image/jpeg') || 
                           brandingConfig.logoDataUrl.startsWith('data:image/jpg') 
                           ? 'JPEG' : 'PNG';
        doc.addImage(brandingConfig.logoDataUrl, imageFormat, logoX, cursorY, logoWidth, logoHeight);
      } catch (e) {
        console.error('Failed to add logo to PDF:', e);
      }
    }
    
    // Render letterhead text - DocuSign-grade professional with proper vertical centering
    if (hasLetterhead) {
      const textAlign = (brandingConfig.position === 'center' && !hasLogo) ? 'center' : 'left';
      const lineHeight = 10; // Tighter line spacing
      
      // Calculate total text block height to center it with logo
      let lineCount = 0;
      if (brandingConfig.company) lineCount++;
      if (brandingConfig.address) {
        const addressLines = brandingConfig.address.split('\n').filter(line => line.trim());
        lineCount += addressLines.length;
      }
      if (brandingConfig.contact) lineCount++;
      
      const totalTextHeight = lineCount * lineHeight;
      
      // Center text block vertically with logo
      let textY = cursorY + (logoHeight / 2) - (totalTextHeight / 2);
      
      if (brandingConfig.company) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(companyFontSize);
        doc.setTextColor(51, 51, 51); // #333 professional dark gray
        doc.text(brandingConfig.company, letterheadX, textY, { align: textAlign });
        textY += lineHeight;
      }
      
      if (brandingConfig.address) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(detailFontSize);
        doc.setTextColor(102, 102, 102); // #666 medium gray
        const addressLines = brandingConfig.address.split('\n');
        addressLines.forEach(line => {
          if (line.trim()) {
            doc.text(line.trim(), letterheadX, textY, { align: textAlign });
            textY += lineHeight;
          }
        });
      }
      
      if (brandingConfig.contact) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(detailFontSize);
        doc.setTextColor(102, 102, 102); // #666 medium gray
        doc.text(brandingConfig.contact, letterheadX, textY, { align: textAlign });
      }
    }
    
    // Add professional divider below header - compact positioning
    const dividerY = headerTop + Math.max(logoHeight, 50) + 8;
    doc.setDrawColor(221, 221, 221); // #ddd light gray
    doc.setLineWidth(0.5);
    doc.line(marginLeft, dividerY, pageWidth - marginRight, dividerY);
  }

  function addFooter(doc, pageNumber, totalPages, isLastPage = false, brandingConfig = null) {
    if (!CC_CONFIG.pdf.footer.show) return;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Phase 1: Support optional legal footer on last page (user controlled)
    const showLegalFooter = brandingConfig && brandingConfig.addLegalFooter;
    
    if (isLastPage && showLegalFooter) {
      // User enabled legal footer: Show neutral disclaimer at ~0.5 inch from bottom
      const legalY = pageHeight - 60;  // ~0.5 inch margin from bottom
      
      // Light divider line with ~10px top margin
      doc.setDrawColor(224, 224, 224);  // #e0e0e0
      doc.setLineWidth(0.5);
      doc.line(
        CC_CONFIG.pdf.margin.left,
        legalY - 10,
        pageWidth - CC_CONFIG.pdf.margin.right,
        legalY - 10
      );
      
      // Neutral disclaimer (exact text from brief)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(119, 119, 119);  // #777777
      const disclaimerText = "This document was generated with an AI-assisted drafting tool. It is provided for informational and drafting purposes only and is not legal, tax, or financial advice. No attorney-client relationship is created.";
      const maxWidth = pageWidth - CC_CONFIG.pdf.margin.left - CC_CONFIG.pdf.margin.right;
      const disclaimerLines = doc.splitTextToSize(disclaimerText, maxWidth);
      
      // Center-align the disclaimer
      let disclaimerY = legalY;
      for (const line of disclaimerLines) {
        const lineWidth = doc.getTextWidth(line);
        const x = (pageWidth - lineWidth) / 2;
        doc.text(line, x, disclaimerY);
        disclaimerY += 10.5;
      }
    }
    
    // White-label mode: Pages have no page numbers or platform branding
    // (This can be adjusted in Phase 2 if user wants page numbers)
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

      // Phase 1: Load branding config from localStorage
      let brandingConfig = null;
      try {
        const saved = localStorage.getItem('ybg.contractCommander.branding');
        if (saved) {
          brandingConfig = JSON.parse(saved);
        }
      } catch (e) {
        console.error('Failed to load branding config for PDF:', e);
      }

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

      // First page visuals (with branding if enabled)
      await addHeader(doc, contractType, brandingConfig, 1);
      addWatermark(doc);

      // Cursor start: Adjust for branding header if active
      const hasBranding = brandingConfig && brandingConfig.enabled && 
                          (brandingConfig.logoDataUrl || brandingConfig.company || brandingConfig.address || brandingConfig.contact);
      const titleOffset = hasBranding ? 70 : 30; // Compact offset
      let cursorY = CC_CONFIG.pdf.margin.top + titleOffset;

      // Title block
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(20);
      doc.text(visibleTitle, CC_CONFIG.pdf.margin.left, cursorY);
      cursorY += 18;

      // Meta line
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
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
        cursorY += 14;
      }

      // Divider
      doc.setDrawColor(220);
      doc.setLineWidth(0.5);
      doc.line(
        CC_CONFIG.pdf.margin.left,
        cursorY,
        doc.internal.pageSize.getWidth() - CC_CONFIG.pdf.margin.right,
        cursorY
      );
      cursorY += 16;

      // Main body (convert minimal HTML to text)
      const plain = htmlToPlainText(bodyHtml).split("\n");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(30);

      const maxWidth =
        doc.internal.pageSize.getWidth() -
        CC_CONFIG.pdf.margin.left -
        CC_CONFIG.pdf.margin.right;

      // Helper: Detect if a line is a section heading
      function isHeading(text) {
        const trimmed = text.trim();
        // Match common legal heading patterns:
        // - "1. PARTIES", "2. SCOPE OF SERVICES"
        // - "ARTICLE I.", "ARTICLE II. TERM", "ARTICLE III. COMPENSATION"
        // - "I. INTRODUCTION", "II. DEFINITIONS"
        // - All caps headings like "WHEREAS", "NOW THEREFORE"
        return /^(\d+\.|ARTICLE\s+[IVX\d]+\.?)\s*/i.test(trimmed) ||  // Numbered or ARTICLE sections
               /^[IVX]+\.\s+[A-Z]/.test(trimmed) ||                   // Roman numeral sections
               /^[A-Z][A-Z\s]{3,}:?\s*$/.test(trimmed);                // All caps headings
      }

      let currentPage = 1;
      for (let i = 0; i < plain.length; i++) {
        const para = plain[i];
        const isCurrentHeading = isHeading(para);
        
        // Add extra spacing before headings (except at very start)
        if (isCurrentHeading && cursorY > CC_CONFIG.pdf.margin.top + 50) {
          cursorY += 10;
        }
        
        // Set font for heading vs body
        if (isCurrentHeading) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
        } else {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
        }
        
        const lines = doc.splitTextToSize(para || " ", maxWidth);
        
        // Prevent orphaned headings: if heading + 2 lines won't fit, start new page
        const neededSpace = isCurrentHeading ? 45 : 20;  // ~3 lines for heading
        if (cursorY + neededSpace > doc.internal.pageSize.getHeight() - 120) {
          doc.addPage();
          currentPage++;
          await addHeader(doc, contractType, brandingConfig, currentPage);
          addWatermark(doc);
          cursorY = CC_CONFIG.pdf.margin.top + 16;
        }
        
        for (const ln of lines) {
          // Check if we need a new page (leave 120pt for footer on last page)
          if (cursorY > doc.internal.pageSize.getHeight() - 120) {
            // Add new page
            doc.addPage();
            currentPage++;
            await addHeader(doc, contractType, brandingConfig, currentPage);
            addWatermark(doc);
            cursorY = CC_CONFIG.pdf.margin.top + 16;
          }
          doc.text(ln, CC_CONFIG.pdf.margin.left, cursorY);
          cursorY += 14;  // Line height 1.27 for 11pt font - tighter spacing
        }
        cursorY += 6;  // Reduced paragraph spacing for compact layout
      }

      // Remove old disclaimer logic (legal notice now only on last page footer via branding config)
      
      // Finalize footers with real page numbers
      const total = doc.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        const isLast = (i === total);
        addFooter(doc, i, total, isLast, brandingConfig);
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
