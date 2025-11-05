const FETCH_PATH = "/api/bizplan";
const SAVE_PATH = "/api/bizplan/reports/save";
const REPORTS_PATH = "/api/bizplan/reports";

const $ = (id) => document.getElementById(id);
let currentReportData = null;
let currentFileName = null;
let currentReportId = null;
let hasUnsavedChanges = false;
let isGenerating = false;
let currentOffset = 0;
const REPORTS_LIMIT = 10;

// ==== THEME MANAGEMENT ====

function getTheme() {
  return localStorage.getItem('theme') || 'dark';
}

function setTheme(theme) {
  localStorage.setItem('theme', theme);
  const root = document.documentElement;
  const themeToggle = $('theme-toggle');
  const themeIcon = themeToggle.querySelector('.theme-icon');
  
  if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
    themeIcon.textContent = '☀️';
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
    themeIcon.textContent = '🌙';
  }
}

function toggleTheme() {
  const currentTheme = getTheme();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
  setTheme(getTheme());
  
  // Add click handler to theme toggle button
  const themeToggle = $('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Load saved report if it exists
  loadSavedReport();
});

// Auto-save before page unload
window.addEventListener('beforeunload', () => {
  saveCurrentReport();
});

// ==== AUTO-SAVE/LOAD FUNCTIONS ====

const AUTOSAVE_KEY = 'ybg-bizplan-autosave';

function saveCurrentReport() {
  try {
    const formData = {
      company: $('company').value.trim(),
      industry: $('industry').value.trim(),
      target: $('target').value.trim(),
      product: $('product').value.trim(),
      revenue: $('revenue').value.trim(),
      stage: $('stage').value.trim(),
      goals: $('goals').value.trim(),
      tone: $('tone').value
    };
    
    const saveData = {
      formData,
      reportData: currentReportData,
      fileName: currentFileName,
      reportId: currentReportId,
      timestamp: Date.now()
    };
    
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(saveData));
  } catch (e) {
    console.error('Failed to auto-save report:', e);
  }
}

function loadSavedReport() {
  try {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (!saved) return;
    
    const saveData = JSON.parse(saved);
    
    // Restore form data
    if (saveData.formData) {
      $('company').value = saveData.formData.company || '';
      $('industry').value = saveData.formData.industry || '';
      $('target').value = saveData.formData.target || '';
      $('product').value = saveData.formData.product || '';
      $('revenue').value = saveData.formData.revenue || '';
      $('stage').value = saveData.formData.stage || '';
      $('goals').value = saveData.formData.goals || '';
      $('tone').value = saveData.formData.tone || 'Professional';
    }
    
    // Restore report data
    if (saveData.reportData) {
      currentReportData = saveData.reportData;
      currentFileName = saveData.fileName;
      currentReportId = saveData.reportId;
      
      // Expose to window for PDF export
      window.currentReportData = currentReportData;
      
      // Render the report
      const reportView = $('report-view');
      if (currentReportData.html) {
        reportView.innerHTML = currentReportData.html;
        
        // Reattach event handlers
        attachKpiEditHandlers();
        attachKpiChartHandlers();
        attachFinancialChartHandlers();
        
        // Show metadata
        showMetadata(
          currentReportData.company, 
          currentReportData.industry, 
          currentReportData.stage
        );
      }
    }
  } catch (e) {
    console.error('Failed to load saved report:', e);
  }
}

// ==== STATE MANAGEMENT FUNCTIONS ====

function setGeneratingState(generating) {
  isGenerating = generating;
  const generateBtn = $('btn-generate');
  const fileBtn = $('btn-file');
  const exportBtn = $('btn-export');
  const toolsBtn = $('btn-tools');
  const progressBar = $('generation-progress');
  const resultsContainer = $('results-container');
  
  if (generating) {
    // Update Generate button with ARIA
    generateBtn.disabled = true;
    generateBtn.setAttribute('aria-busy', 'true');
    generateBtn.innerHTML = '<span style="display: inline-flex; align-items: center; gap: 8px;"><span class="spinner" role="status" aria-label="Loading"></span> <span aria-live="polite">Generating...</span></span>';
    
    // Disable menu buttons
    fileBtn.disabled = true;
    exportBtn.disabled = true;
    toolsBtn.disabled = true;
    
    // Show progress bar inside Results panel
    if (progressBar) {
      progressBar.style.display = 'block';
      progressBar.setAttribute('role', 'progressbar');
      progressBar.setAttribute('aria-label', 'Generating business plan');
    }
    
    // Set Results container as busy
    if (resultsContainer) {
      resultsContainer.setAttribute('aria-busy', 'true');
    }
  } else {
    // Restore Generate button
    generateBtn.disabled = false;
    generateBtn.removeAttribute('aria-busy');
    generateBtn.textContent = 'Generate Plan';
    
    // Enable menu buttons
    fileBtn.disabled = false;
    exportBtn.disabled = false;
    toolsBtn.disabled = false;
    
    // Hide progress bar
    if (progressBar) {
      progressBar.style.display = 'none';
      progressBar.removeAttribute('role');
      progressBar.removeAttribute('aria-label');
    }
    
    // Clear Results container busy state
    if (resultsContainer) {
      resultsContainer.removeAttribute('aria-busy');
    }
  }
}

function markUnsaved() {
  hasUnsavedChanges = true;
}

function markSaved() {
  hasUnsavedChanges = false;
}

function generateDefaultFilename(companyName) {
  const company = companyName || 'Untitled';
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  
  return `${company} - BizPlan - ${year}-${month}-${day}_${hour}-${minute}`;
}

// ==== TOAST NOTIFICATION SYSTEM ====

function showToast(message, type = 'success') {
  const container = $('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? '✓' : '✕';
  
  // Create elements safely to prevent XSS
  const iconSpan = document.createElement('span');
  iconSpan.className = 'toast-icon';
  iconSpan.textContent = icon;
  
  const messageSpan = document.createElement('span');
  messageSpan.className = 'toast-message';
  messageSpan.textContent = message; // Use textContent to prevent XSS
  
  toast.appendChild(iconSpan);
  toast.appendChild(messageSpan);
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}


// Business Plan Templates
const BIZPLAN_TEMPLATES = {
  saas: {
    name: "SaaS Startup",
    company: "CloudFlow Analytics",
    industry: "SaaS / B2B Software",
    target: "Mid-sized businesses and enterprises",
    product: "AI-powered workflow automation platform that integrates with existing tools to streamline business processes, reduce manual tasks, and provide real-time analytics.",
    revenue: "Subscription-based (monthly/annual plans)",
    stage: "MVP launched, seeking seed funding",
    goals: "1. Acquire 50 paying customers in first 6 months\n2. Achieve $50K MRR by end of year\n3. Build integrations with top 5 business tools\n4. Raise $1.5M seed round\n5. Hire 3 key engineering team members",
    tone: "Investor-ready"
  },
  realestate: {
    name: "Real Estate Investment",
    company: "Urban Property Partners",
    industry: "Real Estate Investment",
    target: "First-time homebuyers and investors",
    product: "Full-service real estate investment firm specializing in residential properties, offering property acquisition, renovation management, and rental property management services.",
    revenue: "Commission-based sales, property management fees, consulting fees",
    stage: "Established business, expanding to new markets",
    goals: "1. Close 30 property transactions in next 12 months\n2. Expand to 2 additional cities\n3. Build team of 5 licensed agents\n4. Establish property management division with 50+ units\n5. Achieve $2M in annual revenue",
    tone: "Professional"
  },
  consulting: {
    name: "Management Consulting",
    company: "Strategic Edge Consulting",
    industry: "Business Consulting",
    target: "Small to mid-sized businesses undergoing transformation",
    product: "Strategic consulting services focused on digital transformation, operational efficiency, and change management. We help businesses modernize operations, implement new technologies, and optimize workflows.",
    revenue: "Project-based fees, retainer agreements, hourly consulting",
    stage: "Launched and growing client base",
    goals: "1. Secure 10 consulting engagements in Q1-Q2\n2. Build team of 3 senior consultants\n3. Develop proprietary methodology and IP\n4. Achieve 80% client retention rate\n5. Generate $500K in annual revenue",
    tone: "Professional"
  },
  nonprofit: {
    name: "Nonprofit Organization",
    company: "Community Connect Foundation",
    industry: "Nonprofit / Social Services",
    target: "Underserved communities, youth education programs",
    product: "Community-based nonprofit providing educational resources, mentorship programs, and career development opportunities for underserved youth ages 14-24.",
    revenue: "Grants, individual donations, corporate sponsorships, fundraising events",
    stage: "Idea stage, preparing grant applications",
    goals: "1. Secure 501(c)(3) status and initial $100K in grant funding\n2. Launch pilot program serving 50 students\n3. Build board of directors with 7 community leaders\n4. Establish partnerships with 3 local schools\n5. Host inaugural fundraising gala",
    tone: "Visionary"
  },
  ecommerce: {
    name: "E-Commerce Store",
    company: "Artisan Home Goods",
    industry: "E-Commerce / Retail",
    target: "Environmentally-conscious consumers aged 25-45",
    product: "Online marketplace for sustainable, handcrafted home goods including furniture, decor, and kitchenware. All products sourced from verified eco-friendly artisans and manufacturers.",
    revenue: "Direct product sales with 40% markup, premium shipping options",
    stage: "Launched with initial inventory",
    goals: "1. Reach $100K in monthly sales within 6 months\n2. Onboard 50 artisan vendors\n3. Achieve 25% customer repeat purchase rate\n4. Launch mobile app\n5. Expand product categories to include textiles and lighting",
    tone: "Concise"
  },
  restaurant: {
    name: "Restaurant / Food Service",
    company: "Harvest Table Bistro",
    industry: "Food & Beverage / Restaurant",
    target: "Health-conscious diners, local food enthusiasts",
    product: "Farm-to-table restaurant featuring seasonal menus crafted from locally-sourced ingredients. Offering dine-in, takeout, and catering services with focus on organic, sustainable dining experience.",
    revenue: "Food and beverage sales, catering services, private events",
    stage: "Planning phase, securing location and funding",
    goals: "1. Secure restaurant location and complete buildout\n2. Raise $300K in startup capital\n3. Hire executive chef and core team of 8\n4. Establish partnerships with 10 local farms and suppliers\n5. Launch with 3-month marketing campaign targeting 100+ daily covers",
    tone: "Professional"
  }
};

function getClientId() {
  let clientId = localStorage.getItem('ybg-client-id');
  if (!clientId) {
    clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('ybg-client-id', clientId);
  }
  return clientId;
}

function markdownToHtml(markdown) {
  if (!markdown) return '';
  
  let html = markdown;
  
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  const lines = html.split('\n');
  let result = [];
  let inList = false;
  let listType = null;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    if (line.match(/^[-*]\s+(.+)/)) {
      if (!inList || listType !== 'ul') {
        if (inList) result.push(`</${listType}>`);
        result.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      result.push('<li>' + line.replace(/^[-*]\s+/, '') + '</li>');
    } else if (line.match(/^\d+\.\s+(.+)/)) {
      if (!inList || listType !== 'ol') {
        if (inList) result.push(`</${listType}>`);
        result.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      result.push('<li>' + line.replace(/^\d+\.\s+/, '') + '</li>');
    } else {
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      
      if (line && !line.startsWith('<h')) {
        result.push('<p>' + line + '</p>');
      } else if (line) {
        result.push(line);
      }
    }
  }
  
  if (inList) {
    result.push(`</${listType}>`);
  }
  
  return result.join('\n');
}

function updateButtonStates(hasReport) {
  // Buttons are always enabled in new design
  // File, Export, and Tools menus handle their own state internally
}

function showMetadata(company, industry, stage) {
  const metadataBar = $('report-metadata');
  $('meta-company').textContent = company || 'N/A';
  $('meta-industry').textContent = industry || 'N/A';
  $('meta-stage').textContent = stage || 'N/A';
  
  const now = new Date();
  $('meta-timestamp').textContent = now.toLocaleString();
  
  // Metadata is now inside Results panel
  if (metadataBar) {
    metadataBar.style.display = 'flex';
  }
}

function hideMetadata() {
  const metadataBar = $('report-metadata');
  if (metadataBar) {
    metadataBar.style.display = 'none';
  }
}

// ==== PREMIUM REPORT RENDERING FUNCTIONS ====

function renderExecutiveSnapshot(snapshot) {
  if (!snapshot) return '';
  
  const goals = Array.isArray(snapshot.top3Goals) ? snapshot.top3Goals : [];
  const goalsHtml = goals.map(goal => `<li>${goal}</li>`).join('');
  
  return `
    <div class="executive-snapshot" data-testid="executive-snapshot">
      <h3 class="snapshot-title">Executive Snapshot</h3>
      <div class="snapshot-grid">
        <div class="snapshot-item">
          <div class="snapshot-label">Company</div>
          <div class="snapshot-value">${snapshot.company || 'N/A'}</div>
        </div>
        <div class="snapshot-item">
          <div class="snapshot-label">Stage</div>
          <div class="snapshot-value">${snapshot.stage || 'N/A'}</div>
        </div>
        <div class="snapshot-item">
          <div class="snapshot-label">Industry</div>
          <div class="snapshot-value">${snapshot.industry || 'N/A'}</div>
        </div>
        <div class="snapshot-item">
          <div class="snapshot-label">Target Market</div>
          <div class="snapshot-value">${snapshot.targetMarket || 'N/A'}</div>
        </div>
      </div>
      ${goals.length > 0 ? `
        <div class="snapshot-goals">
          <div class="snapshot-label">Top 3 Goals</div>
          <ul>${goalsHtml}</ul>
        </div>
      ` : ''}
    </div>
  `;
}

function renderKpiTable(kpiTable) {
  if (!kpiTable || kpiTable.length === 0) {
    kpiTable = [
      { objective: 'Revenue Growth', kpi: 'Monthly Recurring Revenue', target: '$50,000', timeframe: 'Q2 2025' }
    ];
  }
  
  const rows = kpiTable.map((kpi, index) => `
    <tr data-kpi-index="${index}">
      <td contenteditable="true" class="kpi-editable" data-field="objective">${kpi.objective || ''}</td>
      <td contenteditable="true" class="kpi-editable" data-field="kpi">${kpi.kpi || ''}</td>
      <td contenteditable="true" class="kpi-editable" data-field="target">${kpi.target || ''}</td>
      <td contenteditable="true" class="kpi-editable" data-field="timeframe">${kpi.timeframe || ''}</td>
      <td class="kpi-actions">
        <button class="kpi-btn kpi-remove" data-testid="button-remove-kpi-${index}" title="Remove row">×</button>
      </td>
    </tr>
  `).join('');
  
  return `
    <div class="kpi-table-section" data-testid="kpi-table">
      <h3 class="kpi-title">Key Performance Indicators (KPIs)</h3>
      <p class="kpi-subtitle">Track progress toward your goals — click cells to edit</p>
      <div class="kpi-table-wrapper">
        <table class="kpi-table">
          <thead>
            <tr>
              <th>Objective</th>
              <th>KPI</th>
              <th>Target</th>
              <th>Timeframe</th>
              <th width="60"></th>
            </tr>
          </thead>
          <tbody id="kpi-table-body">
            ${rows}
          </tbody>
        </table>
      </div>
      <button class="kpi-btn kpi-add" id="add-kpi-row" data-testid="button-add-kpi" title="Add KPI row">+ Add KPI</button>
    </div>
  `;
}

function renderAiInsights(insights) {
  if (!insights || insights.length === 0) {
    insights = ['Focus on customer acquisition and product-market fit in the next 90 days.'];
  }
  
  const insightsHtml = insights.map(insight => `<li>${insight}</li>`).join('');
  
  return `
    <div class="ai-insights-box" data-testid="ai-insights">
      <div class="insights-header">
        <span class="insights-icon">💡</span>
        <h3 class="insights-title">AI Insights</h3>
      </div>
      <ul class="insights-list">
        ${insightsHtml}
      </ul>
    </div>
  `;
}


function renderKpiChartsSection(kpiData) {
  if (!kpiData || kpiData.length === 0) {
    return '';
  }
  
  return `
    <div class="kpi-charts-section" data-testid="kpi-charts-section">
      <div class="kpi-charts-header">
        <h3 style="color: #1a1a1a; font-size: 20px; margin: 0;">KPI Visualization</h3>
        <div class="chart-type-selector">
          <button class="chart-type-btn active" data-chart-type="bar" data-testid="button-chart-bar">
            Bar Chart
          </button>
          <button class="chart-type-btn" data-chart-type="line" data-testid="button-chart-line">
            Line Chart
          </button>
        </div>
      </div>
      <div class="kpi-charts-container">
        <canvas id="kpi-chart" data-testid="canvas-kpi-chart"></canvas>
      </div>
    </div>
  `;
}

function renderFinancialChartsSection(financialData) {
  if (!financialData || !financialData.months || !financialData.revenue) {
    return '';
  }
  
  return `
    <div class="financial-charts-section" data-testid="financial-charts-section">
      <div class="financial-charts-header">
        <h3 style="color: #1a1a1a; font-size: 20px; margin: 0;">📊 Financial Projections (12-Month Forecast)</h3>
        <div class="chart-view-selector">
          <button class="chart-view-btn active" data-view="combined" data-testid="button-view-combined">
            Combined View
          </button>
          <button class="chart-view-btn" data-view="individual" data-testid="button-view-individual">
            Individual Charts
          </button>
        </div>
      </div>
      
      <!-- Combined Chart View -->
      <div class="financial-chart-container" id="combined-chart-view">
        <canvas id="financial-chart-combined" data-testid="canvas-financial-combined"></canvas>
      </div>
      
      <!-- Individual Charts View -->
      <div class="financial-chart-container hidden" id="individual-charts-view">
        <div class="individual-chart-row">
          <div class="individual-chart-item">
            <h4>Revenue Forecast</h4>
            <canvas id="financial-chart-revenue" data-testid="canvas-financial-revenue"></canvas>
          </div>
          <div class="individual-chart-item">
            <h4>Expense Projection</h4>
            <canvas id="financial-chart-expenses" data-testid="canvas-financial-expenses"></canvas>
          </div>
        </div>
        <div class="individual-chart-row">
          <div class="individual-chart-item">
            <h4>Profit Trend</h4>
            <canvas id="financial-chart-profit" data-testid="canvas-financial-profit"></canvas>
          </div>
          <div class="individual-chart-item">
            <h4>Financial Summary</h4>
            <div class="financial-summary-stats">
              <div class="summary-stat">
                <div class="stat-label">Total Year 1 Revenue</div>
                <div class="stat-value" style="color: #4DB6E7;">$${formatNumber(financialData.revenue.reduce((a, b) => a + b, 0))}</div>
              </div>
              <div class="summary-stat">
                <div class="stat-label">Total Year 1 Expenses</div>
                <div class="stat-value" style="color: #FF6B6B;">$${formatNumber(financialData.expenses.reduce((a, b) => a + b, 0))}</div>
              </div>
              <div class="summary-stat">
                <div class="stat-label">Total Year 1 Profit</div>
                <div class="stat-value" style="color: #51CF66;">$${formatNumber(financialData.profit.reduce((a, b) => a + b, 0))}</div>
              </div>
              <div class="summary-stat">
                <div class="stat-label">Avg. Profit Margin</div>
                <div class="stat-value">${Math.round((financialData.profit.reduce((a, b) => a + b, 0) / financialData.revenue.reduce((a, b) => a + b, 0)) * 100)}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function renderPremiumReport(data) {
  const snapshotHtml = renderExecutiveSnapshot(data.executiveSnapshot);
  const mainPlanHtml = markdownToHtml(data.mainPlan || data.markdown || '');
  const kpiTableHtml = renderKpiTable(data.kpiTable);
  const kpiChartsHtml = renderKpiChartsSection(data.kpiTable);
  const financialChartsHtml = renderFinancialChartsSection(data.financialProjections);
  const insightsHtml = renderAiInsights(data.aiInsights);
  
  return `
    ${snapshotHtml}
    <div class="main-plan-content">
      ${mainPlanHtml}
    </div>
    ${kpiTableHtml}
    ${kpiChartsHtml}
    ${financialChartsHtml}
    ${insightsHtml}
  `;
}

// Generate PDF-ready content with special markers for PDF parser
function generatePDFContent(data) {
  let pdfText = '';
  
  // Add Executive Snapshot with markers
  if (data.executiveSnapshot) {
    pdfText += '##EXECUTIVE_SNAPSHOT##\n';
    pdfText += `Company: ${data.executiveSnapshot.company || 'N/A'}\n`;
    pdfText += `Industry: ${data.executiveSnapshot.industry || 'N/A'}\n`;
    pdfText += `Stage: ${data.executiveSnapshot.stage || 'N/A'}\n`;
    pdfText += `Target Market: ${data.executiveSnapshot.targetMarket || 'N/A'}\n`;
    if (data.executiveSnapshot.top3Goals && data.executiveSnapshot.top3Goals.length > 0) {
      pdfText += `Top 3 Goals: ${data.executiveSnapshot.top3Goals.join(', ')}\n`;
    }
    pdfText += '##END_EXECUTIVE_SNAPSHOT##\n\n';
  }
  
  // Add main plan content
  if (data.mainPlan || data.markdown) {
    pdfText += (data.mainPlan || data.markdown) + '\n\n';
  }
  
  // Add KPI Table with markers
  if (data.kpiTable && data.kpiTable.length > 0) {
    pdfText += '##KPI_TABLE##\n';
    pdfText += 'Objective | KPI | Target | Timeframe\n';
    data.kpiTable.forEach(kpi => {
      pdfText += `${kpi.objective || ''} | ${kpi.kpi || ''} | ${kpi.target || ''} | ${kpi.timeframe || ''}\n`;
    });
    pdfText += '##END_KPI_TABLE##\n\n';
  }
  
  // Add AI Insights with markers
  if (data.aiInsights && data.aiInsights.length > 0) {
    pdfText += '##AI_INSIGHTS##\n';
    data.aiInsights.forEach(insight => {
      pdfText += `• ${insight}\n`;
    });
    pdfText += '##END_AI_INSIGHTS##\n\n';
  }
  
  return pdfText;
}

function attachKpiEditHandlers() {
  // Add row handler
  const addBtn = document.getElementById('add-kpi-row');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const tbody = document.getElementById('kpi-table-body');
      if (!tbody) return;
      
      const newIndex = tbody.children.length;
      const newRow = document.createElement('tr');
      newRow.dataset.kpiIndex = newIndex;
      newRow.innerHTML = `
        <td contenteditable="true" class="kpi-editable" data-field="objective">New Objective</td>
        <td contenteditable="true" class="kpi-editable" data-field="kpi">KPI Name</td>
        <td contenteditable="true" class="kpi-editable" data-field="target">Target</td>
        <td contenteditable="true" class="kpi-editable" data-field="timeframe">Timeframe</td>
        <td class="kpi-actions">
          <button class="kpi-btn kpi-remove" data-testid="button-remove-kpi-${newIndex}" title="Remove row">×</button>
        </td>
      `;
      tbody.appendChild(newRow);
      
      // Attach remove handler to new row
      const removeBtn = newRow.querySelector('.kpi-remove');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => newRow.remove());
      }
      
      // Update current report data
      syncKpiTableData();
    });
  }
  
  // Remove row handlers
  document.querySelectorAll('.kpi-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      if (row) row.remove();
      syncKpiTableData();
    });
  });
  
  // Track edits
  document.querySelectorAll('.kpi-editable').forEach(cell => {
    cell.addEventListener('blur', () => {
      syncKpiTableData();
    });
  });
}


let kpiChartInstance = null;

function initializeKpiChart(kpiData, chartType = 'bar') {
  const canvas = document.getElementById('kpi-chart');
  if (!canvas || !kpiData || kpiData.length === 0) return;
  
  // Destroy existing chart if it exists
  if (kpiChartInstance) {
    kpiChartInstance.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  
  // Extract data for chart
  const labels = kpiData.map(item => item.kpi || 'KPI');
  const data = kpiData.map((item, index) => {
    // Try to extract numeric value from target field
    const target = item.target || '0';
    const numMatch = target.match(/[\d,]+/);
    return numMatch ? parseFloat(numMatch[0].replace(/,/g, '')) : (index + 1) * 10;
  });
  
  // YBG branding colors
  const chartColors = {
    primary: '#4DB6E7',
    secondary: '#FFEB3B',
    grid: 'rgba(0, 0, 0, 0.1)',
    text: '#1a1a1a'
  };
  
  kpiChartInstance = new Chart(ctx, {
    type: chartType,
    data: {
      labels: labels,
      datasets: [{
        label: 'Target Values',
        data: data,
        backgroundColor: chartType === 'bar' ? chartColors.primary : 'rgba(77, 182, 231, 0.2)',
        borderColor: chartColors.primary,
        borderWidth: 2,
        tension: 0.4,
        fill: chartType === 'line'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const kpi = kpiData[context.dataIndex];
              return [
                `Target: ${kpi.target}`,
                `Timeframe: ${kpi.timeframe}`,
                `Objective: ${kpi.objective}`
              ];
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: chartColors.grid
          },
          ticks: {
            color: chartColors.text
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: chartColors.text,
            maxRotation: 45,
            minRotation: 0
          }
        }
      }
    }
  });
}

function attachKpiChartHandlers() {
  if (!currentReportData || !currentReportData.kpiTable) return;
  
  // Initialize with bar chart
  initializeKpiChart(currentReportData.kpiTable, 'bar');
  
  // Chart type switcher
  document.querySelectorAll('.chart-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const chartType = btn.dataset.chartType;
      
      // Update active state
      document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Render new chart
      initializeKpiChart(currentReportData.kpiTable, chartType);
    });
  });
}

// Financial Charts
let financialChartInstances = {
  combined: null,
  revenue: null,
  expenses: null,
  profit: null
};

function initializeFinancialCharts(financialData, view = 'combined') {
  if (!financialData || !financialData.months) return;
  
  const chartColors = {
    revenue: '#4DB6E7',
    expenses: '#FF6B6B',
    profit: '#51CF66',
    grid: 'rgba(0, 0, 0, 0.1)',
    text: '#1a1a1a'
  };
  
  // Common chart options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return '$' + formatNumber(context.parsed.y);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: chartColors.grid
        },
        ticks: {
          color: chartColors.text,
          callback: function(value) {
            return '$' + (value >= 1000 ? (value/1000) + 'K' : value);
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: chartColors.text
        }
      }
    }
  };
  
  if (view === 'combined') {
    // Destroy existing combined chart
    if (financialChartInstances.combined) {
      financialChartInstances.combined.destroy();
    }
    
    const canvas = document.getElementById('financial-chart-combined');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    financialChartInstances.combined = new Chart(ctx, {
      type: 'line',
      data: {
        labels: financialData.months,
        datasets: [
          {
            label: 'Revenue',
            data: financialData.revenue,
            borderColor: chartColors.revenue,
            backgroundColor: 'rgba(77, 182, 231, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true
          },
          {
            label: 'Expenses',
            data: financialData.expenses,
            borderColor: chartColors.expenses,
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true
          },
          {
            label: 'Profit',
            data: financialData.profit,
            borderColor: chartColors.profit,
            backgroundColor: 'rgba(81, 207, 102, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        ...commonOptions,
        plugins: {
          ...commonOptions.plugins,
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 13
              }
            }
          }
        }
      }
    });
  } else {
    // Destroy existing individual charts
    if (financialChartInstances.revenue) financialChartInstances.revenue.destroy();
    if (financialChartInstances.expenses) financialChartInstances.expenses.destroy();
    if (financialChartInstances.profit) financialChartInstances.profit.destroy();
    
    // Revenue Chart
    const revenueCanvas = document.getElementById('financial-chart-revenue');
    if (revenueCanvas) {
      financialChartInstances.revenue = new Chart(revenueCanvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: financialData.months,
          datasets: [{
            data: financialData.revenue,
            borderColor: chartColors.revenue,
            backgroundColor: 'rgba(77, 182, 231, 0.2)',
            borderWidth: 3,
            tension: 0.4,
            fill: true
          }]
        },
        options: commonOptions
      });
    }
    
    // Expenses Chart
    const expensesCanvas = document.getElementById('financial-chart-expenses');
    if (expensesCanvas) {
      financialChartInstances.expenses = new Chart(expensesCanvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: financialData.months,
          datasets: [{
            data: financialData.expenses,
            borderColor: chartColors.expenses,
            backgroundColor: 'rgba(255, 107, 107, 0.2)',
            borderWidth: 3,
            tension: 0.4,
            fill: true
          }]
        },
        options: commonOptions
      });
    }
    
    // Profit Chart
    const profitCanvas = document.getElementById('financial-chart-profit');
    if (profitCanvas) {
      financialChartInstances.profit = new Chart(profitCanvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: financialData.months,
          datasets: [{
            data: financialData.profit,
            borderColor: chartColors.profit,
            backgroundColor: 'rgba(81, 207, 102, 0.2)',
            borderWidth: 3,
            tension: 0.4,
            fill: true
          }]
        },
        options: commonOptions
      });
    }
  }
}

function attachFinancialChartHandlers() {
  if (!currentReportData || !currentReportData.financialProjections) return;
  
  // Initialize with combined view
  initializeFinancialCharts(currentReportData.financialProjections, 'combined');
  
  // View switcher
  document.querySelectorAll('.chart-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      
      // Update active state
      document.querySelectorAll('.chart-view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Toggle views
      const combinedView = document.getElementById('combined-chart-view');
      const individualView = document.getElementById('individual-charts-view');
      
      if (view === 'combined') {
        combinedView.classList.remove('hidden');
        individualView.classList.add('hidden');
        initializeFinancialCharts(currentReportData.financialProjections, 'combined');
      } else {
        combinedView.classList.add('hidden');
        individualView.classList.remove('hidden');
        initializeFinancialCharts(currentReportData.financialProjections, 'individual');
      }
    });
  });
}

function syncKpiTableData() {
  if (!currentReportData) return;
  
  const rows = document.querySelectorAll('#kpi-table-body tr');
  const kpiTable = [];
  
  rows.forEach(row => {
    const objective = row.querySelector('[data-field="objective"]')?.textContent.trim() || '';
    const kpi = row.querySelector('[data-field="kpi"]')?.textContent.trim() || '';
    const target = row.querySelector('[data-field="target"]')?.textContent.trim() || '';
    const timeframe = row.querySelector('[data-field="timeframe"]')?.textContent.trim() || '';
    
    kpiTable.push({ objective, kpi, target, timeframe });
  });
  
  currentReportData.kpiTable = kpiTable;
  
  // Update HTML snapshot
  currentReportData.html = renderPremiumReport({
    executiveSnapshot: currentReportData.executiveSnapshot,
    mainPlan: currentReportData.markdown,
    kpiTable: currentReportData.kpiTable,
    aiInsights: currentReportData.aiInsights,
    financialProjections: currentReportData.financialProjections
  });
  
  // Mark as unsaved
  markUnsaved();
  
  // Auto-save changes
  saveCurrentReport();
}

// Template loading functions
function loadTemplate(templateKey) {
  const template = BIZPLAN_TEMPLATES[templateKey];
  if (!template) return;
  
  $('company').value = template.company;
  $('industry').value = template.industry;
  $('target').value = template.target || '';
  $('product').value = template.product || '';
  $('revenue').value = template.revenue || '';
  $('stage').value = template.stage || '';
  $('goals').value = template.goals || '';
  $('tone').value = template.tone || 'Professional';
}

function clearAllInputs() {
  if (confirm('Clear all input fields?')) {
    $('company').value = '';
    $('industry').value = '';
    $('target').value = '';
    $('product').value = '';
    $('revenue').value = '';
    $('stage').value = '';
    $('goals').value = '';
    $('tone').value = 'Professional';
  }
}

// Template modal handlers
document.querySelectorAll('.template-card').forEach(card => {
  card.addEventListener('click', (e) => {
    const templateKey = card.dataset.template;
    if (templateKey) {
      loadTemplate(templateKey);
      closeModal('template-modal');
      showToast('Template loaded', 'success');
    }
  });
});

$('template-cancel').addEventListener('click', () => {
  closeModal('template-modal');
});

$('btn-generate').addEventListener('click', async () => {
  setGeneratingState(true);
  
  const payload = {
    company: $('company').value.trim(),
    industry: $('industry').value.trim(),
    target: $('target').value.trim(),
    product: $('product').value.trim(),
    revenue: $('revenue').value.trim(),
    stage: $('stage').value.trim(),
    goals: $('goals').value.trim(),
    tone: $('tone').value
  };
  
  if (!payload.company || !payload.industry) {
    showToast('Please fill in required fields: Company and Industry', 'error');
    setGeneratingState(false);
    return;
  }
  
  const reportView = $('report-view');
  reportView.innerHTML = '';
  hideMetadata();
  
  try {
    const res = await fetch(FETCH_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': getClientId()
      },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    
    // Render complete premium report with all sections
    const fullHtml = renderPremiumReport(data);
    reportView.innerHTML = fullHtml;
    
    currentReportData = {
      executiveSnapshot: data.executiveSnapshot,
      markdown: data.mainPlan || data.markdown || '',
      kpiTable: data.kpiTable || [],
      aiInsights: data.aiInsights || [],
      financialProjections: data.financialProjections || null,
      html: fullHtml,
      company: payload.company,
      industry: payload.industry,
      stage: payload.stage
    };
    
    // Expose to window for PDF export
    window.currentReportData = currentReportData;
    
    // Set default filename if not already set
    if (!currentFileName) {
      currentFileName = generateDefaultFilename(payload.company);
    }
    
    // Attach KPI edit handlers
    attachKpiEditHandlers();
    
    // Attach KPI chart handlers
    attachKpiChartHandlers();
    
    // Attach Financial chart handlers
    attachFinancialChartHandlers();
    
    showMetadata(payload.company, payload.industry, payload.stage);
    
    // Mark as unsaved changes
    markUnsaved();
    
    // Auto-save to localStorage
    saveCurrentReport();
    
    showToast('Business plan generated successfully!', 'success');
    
  } catch (e) {
    reportView.innerHTML = `<p style="color: #ff6b6b;">Error generating plan: ${e.message}</p>`;
    showToast(`Error: ${e.message}`, 'error');
  } finally {
    setGeneratingState(false);
  }
});

// ==== TOOLBAR DROPDOWN HANDLERS ====

$('btn-file').addEventListener('click', (e) => {
  e.stopPropagation();
  const menu = $('file-menu');
  const exportMenu = $('export-menu');
  const toolsMenu = $('tools-menu');
  exportMenu.classList.remove('active');
  toolsMenu.classList.remove('active');
  menu.classList.toggle('active');
});

$('btn-export').addEventListener('click', (e) => {
  e.stopPropagation();
  const menu = $('export-menu');
  const fileMenu = $('file-menu');
  const toolsMenu = $('tools-menu');
  fileMenu.classList.remove('active');
  toolsMenu.classList.remove('active');
  menu.classList.toggle('active');
});

$('btn-tools').addEventListener('click', (e) => {
  e.stopPropagation();
  const menu = $('tools-menu');
  const fileMenu = $('file-menu');
  const exportMenu = $('export-menu');
  fileMenu.classList.remove('active');
  exportMenu.classList.remove('active');
  menu.classList.toggle('active');
});

document.addEventListener('click', () => {
  $('file-menu').classList.remove('active');
  $('export-menu').classList.remove('active');
  if ($('tools-menu')) $('tools-menu').classList.remove('active');
});

// ==== FILE MENU HANDLERS ====

$('btn-new-plan').addEventListener('click', () => {
  if (hasUnsavedChanges) {
    if (!confirm('You have unsaved changes. Are you sure you want to start a new plan?')) {
      return;
    }
  }
  
  // Clear inputs
  $('company').value = '';
  $('industry').value = '';
  $('target').value = '';
  $('product').value = '';
  $('revenue').value = '';
  $('stage').value = '';
  $('goals').value = '';
  $('tone').value = 'Professional';
  
  // Clear results
  $('report-view').innerHTML = '';
  currentReportData = null;
  currentFileName = null;
  currentReportId = null;
  hasUnsavedChanges = false;
  hideMetadata();
  
  showToast('Started new business plan', 'success');
  $('file-menu').classList.remove('active');
});

$('btn-open').addEventListener('click', () => {
  if (hasUnsavedChanges) {
    if (!confirm('You have unsaved changes. Are you sure you want to open a different report?')) {
      return;
    }
  }
  
  openModal('load-modal');
  fetchReportsList('');
  $('file-menu').classList.remove('active');
});

$('btn-save').addEventListener('click', async () => {
  if (!currentReportData) {
    showToast('No report to save', 'error');
    return;
  }
  
  if (currentFileName && currentReportId) {
    // Silent save to existing file
    await handleSaveReport(currentFileName, currentReportId);
  } else {
    // Prompt for Save As
    handleSaveAs();
  }
  
  $('file-menu').classList.remove('active');
});

$('btn-save-as').addEventListener('click', () => {
  handleSaveAs();
  $('file-menu').classList.remove('active');
});

$('btn-rename').addEventListener('click', () => {
  if (!currentFileName) {
    showToast('No file to rename', 'error');
    return;
  }
  
  handleRename();
  $('file-menu').classList.remove('active');
});


// ==== EXPORT MENU HANDLERS ====

$('btn-export-pdf').addEventListener('click', () => {
  handleExportPDF();
  $('export-menu').classList.remove('active');
});

// ==== TOOLS MENU HANDLERS ====

$('btn-load-template').addEventListener('click', () => {
  openModal('template-modal');
  $('tools-menu').classList.remove('active');
});

$('btn-clear-all').addEventListener('click', () => {
  if (hasUnsavedChanges) {
    if (!confirm('You have unsaved changes. Clear all inputs and results?')) {
      return;
    }
  } else {
    if (!confirm('Clear all inputs and results?')) {
      return;
    }
  }
  
  // Clear all inputs
  $('company').value = '';
  $('industry').value = '';
  $('target').value = '';
  $('product').value = '';
  $('revenue').value = '';
  $('stage').value = '';
  $('goals').value = '';
  $('tone').value = 'Professional';
  
  // Clear results
  $('report-view').innerHTML = '';
  currentReportData = null;
  currentFileName = null;
  currentReportId = null;
  hasUnsavedChanges = false;
  hideMetadata();
  
  showToast('Cleared all inputs and results', 'success');
  $('tools-menu').classList.remove('active');
});

// ==== SAVE AS / RENAME MODAL HANDLERS ====

function handleSaveAs() {
  if (!currentReportData) {
    showToast('No report to save', 'error');
    return;
  }
  
  const modal = $('saveas-modal');
  const title = modal.querySelector('#saveas-modal-title');
  const input = $('saveas-filename');
  
  title.textContent = 'Save As';
  input.value = currentFileName || generateDefaultFilename(currentReportData.company);
  
  openModal('saveas-modal');
}

function handleRename() {
  if (!currentFileName) {
    showToast('No file to rename', 'error');
    return;
  }
  
  const modal = $('saveas-modal');
  const title = modal.querySelector('#saveas-modal-title');
  const input = $('saveas-filename');
  
  title.textContent = 'Rename';
  input.value = currentFileName;
  
  openModal('saveas-modal');
}

$('saveas-confirm').addEventListener('click', async () => {
  const newFilename = $('saveas-filename').value.trim();
  
  if (!newFilename) {
    showToast('Please enter a filename', 'error');
    return;
  }
  
  const isRename = $('saveas-modal-title').textContent === 'Rename';
  
  if (isRename) {
    currentFileName = newFilename;
    closeModal('saveas-modal');
    showToast(`Renamed to "${newFilename}"`, 'success');
  } else {
    // Save As - create new file
    currentFileName = newFilename;
    await handleSaveReport(newFilename);
  }
});

$('saveas-cancel').addEventListener('click', () => {
  closeModal('saveas-modal');
});

// ==== SAVE/EXPORT HANDLER FUNCTIONS ====

async function handleSaveReport(filename, reportId) {
  if (!currentReportData) {
    showToast('No report to save', 'error');
    return;
  }
  
  const saveFilename = filename || currentFileName || generateDefaultFilename(currentReportData.company);
  
  try {
    const res = await fetch(SAVE_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': getClientId()
      },
      body: JSON.stringify({
        contentHtml: currentReportData.html,
        company: currentReportData.company,
        industry: currentReportData.industry,
        title: saveFilename
      })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    
    const data = await res.json();
    
    // Update current file info
    currentReportId = data.id;
    currentFileName = saveFilename;
    markSaved();
    
    closeModal('saveas-modal');
    showToast(`Saved as "${saveFilename}"`, 'success');
    
  } catch (e) {
    showToast(`Error saving: ${e.message}`, 'error');
  }
}

async function handleExportPDF() {
  const reportView = $('report-view');
  if (!reportView.innerHTML.trim() || !currentReportData) {
    showToast('No report to export', 'error');
    return;
  }
  
  // Auto-save before export
  saveCurrentReport();
  
  try {
    if (window.exportBizPlanToPDF) {
      await window.exportBizPlanToPDF();
    } else {
      throw new Error('PDF export module not loaded');
    }
    
  } catch (e) {
    showToast(`Error exporting PDF: ${e.message}`, 'error');
  }
}


async function handleCopyMarkdown() {
  if (!currentReportData || !currentReportData.markdown) {
    showToast('No report to copy', 'error');
    return;
  }
  
  try {
    await navigator.clipboard.writeText(currentReportData.markdown);
    showToast('Markdown copied to clipboard', 'success');
  } catch (e) {
    showToast('Failed to copy to clipboard', 'error');
  }
}

async function handleCopySummary() {
  if (!currentReportData || !currentReportData.executiveSnapshot) {
    showToast('No summary to copy', 'error');
    return;
  }
  
  try {
    const snapshot = currentReportData.executiveSnapshot;
    const goals = Array.isArray(snapshot.top3Goals) ? snapshot.top3Goals : [];
    
    let summaryText = '=== EXECUTIVE SUMMARY ===\n\n';
    summaryText += `Company: ${snapshot.company || 'N/A'}\n`;
    summaryText += `Industry: ${snapshot.industry || 'N/A'}\n`;
    summaryText += `Stage: ${snapshot.stage || 'N/A'}\n`;
    summaryText += `Target Market: ${snapshot.targetMarket || 'N/A'}\n`;
    
    if (goals.length > 0) {
      summaryText += `\nTop Goals:\n`;
      goals.forEach((goal, index) => {
        summaryText += `${index + 1}. ${goal}\n`;
      });
    }
    
    await navigator.clipboard.writeText(summaryText);
    showToast('Summary copied to clipboard', 'success');
  } catch (e) {
    showToast('Failed to copy summary', 'error');
  }
}



async function fetchReportsList(search = '') {
  const reportsList = $('reports-list');
  reportsList.innerHTML = '<p>Loading reports...</p>';
  
  try {
    const url = `${REPORTS_PATH}?offset=${currentOffset}&limit=${REPORTS_LIMIT}`;
    const res = await fetch(url, {
      headers: {
        'X-Client-Id': getClientId()
      }
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    const reports = data.reports || [];
    
    let filteredReports = reports;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredReports = reports.filter(r => 
        r.title.toLowerCase().includes(searchLower) ||
        (r.company && r.company.toLowerCase().includes(searchLower)) ||
        (r.industry && r.industry.toLowerCase().includes(searchLower))
      );
    }
    
    if (filteredReports.length === 0) {
      reportsList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No reports found.</p>';
    } else {
      reportsList.innerHTML = filteredReports.map(report => `
        <div class="report-item" data-id="${report.id}" data-testid="report-item-${report.id}">
          <div class="report-item-title">${escapeHtml(report.title)}</div>
          <div class="report-item-meta">
            <span>${new Date(report.createdAt).toLocaleDateString()}</span>
            <span>${report.approxCharCount || 0} chars</span>
          </div>
          <div class="report-item-actions">
            <button class="btn-small" onclick="loadReportById('${report.id}')" data-testid="button-load-${report.id}">Load</button>
            <button class="btn-small btn-danger" onclick="deleteReportById('${report.id}')" data-testid="button-delete-${report.id}">Delete</button>
          </div>
        </div>
      `).join('');
    }
    
    renderPagination(data.pagination);
    
  } catch (e) {
    reportsList.innerHTML = `<p style="color: #ff6b6b;">Error loading reports: ${e.message}</p>`;
  }
}

function renderPagination(pagination) {
  const container = $('load-pagination');
  
  if (!pagination) {
    container.innerHTML = '';
    return;
  }
  
  const hasPrev = pagination.offset > 0;
  const hasNext = pagination.hasMore;
  
  container.innerHTML = `
    <button onclick="handlePrevPage()" ${!hasPrev ? 'disabled' : ''} data-testid="button-prev-page">← Previous</button>
    <span style="color: var(--ybg-text); padding: 0 12px;">
      ${pagination.offset + 1}–${Math.min(pagination.offset + pagination.limit, pagination.total)} of ${pagination.total}
    </span>
    <button onclick="handleNextPage()" ${!hasNext ? 'disabled' : ''} data-testid="button-next-page">Next →</button>
  `;
}

window.handlePrevPage = function() {
  if (currentOffset > 0) {
    currentOffset = Math.max(0, currentOffset - REPORTS_LIMIT);
    fetchReportsList($('load-search').value);
  }
};

window.handleNextPage = function() {
  currentOffset += REPORTS_LIMIT;
  fetchReportsList($('load-search').value);
};

window.loadReportById = async function(id) {
  try {
    const res = await fetch(`${REPORTS_PATH}/${id}`, {
      headers: {
        'X-Client-Id': getClientId()
      }
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const report = await res.json();
    
    $('report-view').innerHTML = report.contentHtml;
    
    currentReportData = {
      html: report.contentHtml,
      company: report.company,
      industry: report.industry,
      stage: ''
    };
    
    // Expose to window for PDF export
    window.currentReportData = currentReportData;
    
    showMetadata(report.company, report.industry, '');
    updateButtonStates(true);
    
    closeModal('load-modal');
    
  } catch (e) {
    alert(`Error loading report: ${e.message}`);
  }
};

window.deleteReportById = async function(id) {
  if (!confirm('Are you sure you want to delete this report?')) return;
  
  try {
    const res = await fetch(`${REPORTS_PATH}/${id}`, {
      method: 'DELETE',
      headers: {
        'X-Client-Id': getClientId()
      }
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    await fetchReportsList($('load-search').value);
    
  } catch (e) {
    alert(`Error deleting report: ${e.message}`);
  }
};

$('load-search').addEventListener('input', (e) => {
  currentOffset = 0;
  fetchReportsList(e.target.value);
});

// ==== MODAL MANAGEMENT ====

function openModal(modalId) {
  const modal = $(modalId);
  modal.classList.add('active');
  
  const firstInput = modal.querySelector('input, button:not(.modal-close)');
  if (firstInput) firstInput.focus();
  
  modal.addEventListener('keydown', handleModalKeyboard);
}

function closeModal(modalId) {
  const modal = $(modalId);
  if (!modal) return;
  modal.classList.remove('active');
  modal.removeEventListener('keydown', handleModalKeyboard);
}

function handleModalKeyboard(e) {
  if (e.key === 'Escape') {
    const modalId = e.currentTarget.id;
    closeModal(modalId);
  }
}

document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    // Find the parent modal and close it
    const modal = btn.closest('.modal');
    if (modal) {
      closeModal(modal.id);
    }
  });
});

document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modal.id);
    }
  });
});

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==== TOOLTIP SYSTEM ====

let activeTooltip = null;

function hideAllTooltips() {
  // Hide all tooltip bubbles and reset their triggers' aria-expanded
  document.querySelectorAll('.tooltip-bubble.active').forEach(bubble => {
    bubble.classList.remove('active');
    const wrapper = bubble.closest('.tooltip-wrapper');
    if (wrapper) {
      const icon = wrapper.querySelector('.tooltip-icon');
      if (icon) icon.setAttribute('aria-expanded', 'false');
    }
  });
  
  document.querySelectorAll('.tooltip-bubble-menu.active').forEach(bubble => {
    bubble.classList.remove('active');
    const wrapper = bubble.closest('.tooltip-wrapper-menu');
    if (wrapper) {
      const btn = wrapper.querySelector('[data-tip].btn-command');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
  });
  
  activeTooltip = null;
}

// Handle tooltip icon clicks/taps (mobile)
document.querySelectorAll('.tooltip-icon').forEach(icon => {
  icon.addEventListener('click', (e) => {
    e.stopPropagation();
    const wrapper = icon.closest('.tooltip-wrapper');
    const bubble = wrapper.querySelector('.tooltip-bubble');
    
    if (bubble.classList.contains('active')) {
      bubble.classList.remove('active');
      icon.setAttribute('aria-expanded', 'false');
      activeTooltip = null;
    } else {
      hideAllTooltips();
      bubble.classList.add('active');
      icon.setAttribute('aria-expanded', 'true');
      activeTooltip = bubble;
    }
  });
  
  icon.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const wrapper = icon.closest('.tooltip-wrapper');
      const bubble = wrapper.querySelector('.tooltip-bubble');
      
      if (bubble.classList.contains('active')) {
        bubble.classList.remove('active');
        icon.setAttribute('aria-expanded', 'false');
        activeTooltip = null;
      } else {
        hideAllTooltips();
        bubble.classList.add('active');
        icon.setAttribute('aria-expanded', 'true');
        activeTooltip = bubble;
      }
    }
  });
  
  // Initialize aria-expanded
  icon.setAttribute('aria-expanded', 'false');
});

// Handle menu button tooltips (File, Export)
document.querySelectorAll('[data-tip].btn-command').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const wrapper = btn.closest('.tooltip-wrapper-menu');
    const bubble = wrapper.querySelector('.tooltip-bubble-menu');
    
    if (bubble.classList.contains('active')) {
      bubble.classList.remove('active');
      btn.setAttribute('aria-expanded', 'false');
      activeTooltip = null;
    } else {
      hideAllTooltips();
      bubble.classList.add('active');
      btn.setAttribute('aria-expanded', 'true');
      activeTooltip = bubble;
    }
  });
  
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const wrapper = btn.closest('.tooltip-wrapper-menu');
      const bubble = wrapper.querySelector('.tooltip-bubble-menu');
      
      if (bubble.classList.contains('active')) {
        bubble.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
        activeTooltip = null;
      } else {
        hideAllTooltips();
        bubble.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
        activeTooltip = bubble;
      }
    }
  });
  
  // Initialize aria-expanded
  btn.setAttribute('aria-expanded', 'false');
});

// Close tooltip when clicking outside
document.addEventListener('click', () => {
  hideAllTooltips();
});
