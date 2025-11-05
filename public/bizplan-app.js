const FETCH_PATH = "/api/bizplan";
const SAVE_PATH = "/api/bizplan/reports/save";
const REPORTS_PATH = "/api/bizplan/reports";

const $ = (id) => document.getElementById(id);
let currentReportData = null;
let currentOffset = 0;
const REPORTS_LIMIT = 10;

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
  const fileBtn = $('btn-file');
  const exportBtn = $('btn-export');
  const clearBtn = $('btn-clear');
  
  if (hasReport) {
    fileBtn.classList.remove('inactive');
    exportBtn.classList.remove('inactive');
    clearBtn.classList.remove('inactive');
  } else {
    fileBtn.classList.add('inactive');
    exportBtn.classList.add('inactive');
    clearBtn.classList.add('inactive');
  }
}

function showMetadata(company, industry, stage) {
  const metadataBar = $('report-metadata');
  $('meta-company').textContent = company || 'N/A';
  $('meta-industry').textContent = industry || 'N/A';
  $('meta-stage').textContent = stage || 'N/A';
  
  const now = new Date();
  $('meta-timestamp').textContent = now.toLocaleString();
  
  metadataBar.style.display = 'flex';
}

function hideMetadata() {
  $('report-metadata').style.display = 'none';
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

function renderPremiumReport(data) {
  const snapshotHtml = renderExecutiveSnapshot(data.executiveSnapshot);
  const mainPlanHtml = markdownToHtml(data.mainPlan || data.markdown || '');
  const kpiTableHtml = renderKpiTable(data.kpiTable);
  const insightsHtml = renderAiInsights(data.aiInsights);
  
  return `
    ${snapshotHtml}
    <div class="main-plan-content">
      ${mainPlanHtml}
    </div>
    ${kpiTableHtml}
    ${insightsHtml}
  `;
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
    aiInsights: currentReportData.aiInsights
  });
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

// Template dropdown handler
$('btn-templates').addEventListener('click', (e) => {
  e.stopPropagation();
  const menu = $('template-menu');
  menu.classList.toggle('active');
});

$('template-menu').addEventListener('click', (e) => {
  const templateKey = e.target.dataset.template;
  if (templateKey) {
    loadTemplate(templateKey);
  }
  $('template-menu').classList.remove('active');
});

// Clear inputs button
$('btn-clear-inputs').addEventListener('click', clearAllInputs);

$('btn-generate').addEventListener('click', async () => {
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
    alert('Please fill in required fields: Company and Industry.');
    return;
  }
  
  const reportView = $('report-view');
  reportView.innerHTML = '<p style="color: #666; font-style: italic;">Generating premium business plan…</p>';
  hideMetadata();
  updateButtonStates(false);
  
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
      html: fullHtml,
      company: payload.company,
      industry: payload.industry,
      stage: payload.stage
    };
    
    // Attach KPI edit handlers
    attachKpiEditHandlers();
    
    showMetadata(payload.company, payload.industry, payload.stage);
    updateButtonStates(true);
    
    // Save to version history
    saveToVersionHistory();
    
  } catch (e) {
    reportView.innerHTML = `<p style="color: #ff6b6b;">Error generating plan: ${e.message}</p>`;
    updateButtonStates(false);
  }
});

$('btn-file').addEventListener('click', (e) => {
  e.stopPropagation();
  const menu = $('file-menu');
  const exportMenu = $('export-menu');
  exportMenu.classList.remove('active');
  menu.classList.toggle('active');
});

$('btn-export').addEventListener('click', (e) => {
  e.stopPropagation();
  const menu = $('export-menu');
  const fileMenu = $('file-menu');
  fileMenu.classList.remove('active');
  menu.classList.toggle('active');
});

document.addEventListener('click', () => {
  $('file-menu').classList.remove('active');
  $('export-menu').classList.remove('active');
  $('template-menu').classList.remove('active');
});

$('file-menu').addEventListener('click', (e) => {
  if (e.target.dataset.action === 'save') {
    handleSaveReport();
  } else if (e.target.dataset.action === 'load') {
    handleLoadReport();
  }
  $('file-menu').classList.remove('active');
});

$('export-menu').addEventListener('click', (e) => {
  if (e.target.dataset.action === 'copy') {
    handleCopyAll();
  } else if (e.target.dataset.action === 'pdf') {
    handleExportPDF();
  }
  $('export-menu').classList.remove('active');
});

$('btn-clear').addEventListener('click', () => {
  if (confirm('Are you sure you want to clear the current report?')) {
    $('report-view').innerHTML = '';
    currentReportData = null;
    hideMetadata();
    updateButtonStates(false);
  }
});

// ==== VERSION HISTORY FUNCTIONS ====
const VERSION_HISTORY_KEY = 'bizplan-version-history';
const MAX_VERSIONS = 10;

function saveToVersionHistory() {
  if (!currentReportData) return;
  
  try {
    const versions = getVersionHistory();
    
    const newVersion = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      company: currentReportData.company,
      industry: currentReportData.industry,
      stage: currentReportData.stage,
      data: currentReportData
    };
    
    // Add new version at the beginning
    versions.unshift(newVersion);
    
    // Keep only last MAX_VERSIONS
    if (versions.length > MAX_VERSIONS) {
      versions.splice(MAX_VERSIONS);
    }
    
    localStorage.setItem(VERSION_HISTORY_KEY, JSON.stringify(versions));
  } catch (e) {
    console.error('Failed to save version:', e);
  }
}

function getVersionHistory() {
  try {
    const stored = localStorage.getItem(VERSION_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to load version history:', e);
    return [];
  }
}

function restoreVersion(versionId) {
  const versions = getVersionHistory();
  const version = versions.find(v => v.id === versionId);
  
  if (!version) {
    alert('Version not found');
    return;
  }
  
  if (!confirm(`Restore version from ${new Date(version.timestamp).toLocaleString()}?\n\nCompany: ${version.company}\n\nThis will replace your current view.`)) {
    return;
  }
  
  // Restore the version data
  currentReportData = version.data;
  
  // Re-render the report
  const reportView = $('report-view');
  reportView.innerHTML = currentReportData.html;
  
  // Re-attach KPI handlers
  attachKpiEditHandlers();
  
  // Update metadata
  showMetadata(currentReportData.company, currentReportData.industry, currentReportData.stage);
  updateButtonStates(true);
  
  closeModal('version-history-modal');
}

function renderVersionHistory() {
  const versions = getVersionHistory();
  const versionList = $('version-list');
  
  if (versions.length === 0) {
    versionList.innerHTML = '<p style="color: #999; text-align: center; padding: 2rem;">No version history available yet.<br>Generate and save business plans to build your version history.</p>';
    return;
  }
  
  const versionsHtml = versions.map(version => {
    const date = new Date(version.timestamp);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Create a preview snippet from the markdown
    const preview = version.data.markdown ? 
      version.data.markdown.substring(0, 150).replace(/[#*\n]/g, ' ').trim() + '...' : 
      'No preview available';
    
    return `
      <div class="version-item" data-testid="version-item-${version.id}">
        <div class="version-header">
          <div class="version-title">
            <strong>${version.company || 'Untitled Plan'}</strong>
            <span class="version-badge">${version.industry || 'N/A'}</span>
          </div>
          <div class="version-meta">
            <span>${dateStr}</span>
            <span>${timeStr}</span>
          </div>
        </div>
        <div class="version-preview">${preview}</div>
        <div class="version-actions">
          <button class="btn btn-primary btn-sm" onclick="restoreVersion(${version.id})" data-testid="button-restore-${version.id}">
            Restore This Version
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  versionList.innerHTML = versionsHtml;
}

$('btn-version-history').addEventListener('click', () => {
  openModal('version-history-modal');
  renderVersionHistory();
});

$('version-cancel').addEventListener('click', () => {
  closeModal('version-history-modal');
});

// Make restoreVersion globally available
window.restoreVersion = restoreVersion;

async function handleSaveReport() {
  if (!currentReportData) {
    alert('No report to save. Please generate a plan first.');
    return;
  }
  
  openModal('save-modal');
  $('save-status').textContent = 'Saving report...';
  
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const title = `${currentReportData.company} — ${year}-${month}-${day}_${hours}-${minutes}`;
    
    const res = await fetch(SAVE_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': getClientId()
      },
      body: JSON.stringify({
        contentHtml: currentReportData.html,
        company: currentReportData.company,
        industry: currentReportData.industry
      })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    
    const data = await res.json();
    $('save-status').innerHTML = `<span style="color: #4DB6E7;">✓ Report saved successfully!</span><br><small>Title: ${title}</small>`;
    
    setTimeout(() => closeModal('save-modal'), 2000);
    
  } catch (e) {
    $('save-status').innerHTML = `<span style="color: #ff6b6b;">Error: ${e.message}</span>`;
  }
}

async function handleLoadReport() {
  openModal('load-modal');
  currentOffset = 0;
  await fetchReportsList();
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

async function handleCopyAll() {
  const html = $('report-view').innerHTML;
  if (!html.trim()) {
    alert('No report to copy.');
    return;
  }
  
  try {
    await navigator.clipboard.writeText(html);
    alert('Report HTML copied to clipboard!');
  } catch (e) {
    alert('Failed to copy to clipboard.');
  }
}

async function handleExportPDF() {
  const reportView = $('report-view');
  if (!reportView.innerHTML.trim()) {
    alert('No report to export.');
    return;
  }
  
  try {
    const company = currentReportData?.company || 'Report';
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const filename = `BizPlan_${company}_${dateStr}.pdf`;
    
    const htmlContent = reportView.innerHTML;
    
    if (window.exportAllResultsToPDF) {
      window.exportAllResultsToPDF([{
        html: htmlContent,
        fileName: filename
      }]);
    } else {
      throw new Error('PDF export module not loaded');
    }
    
  } catch (e) {
    alert(`Error exporting PDF: ${e.message}`);
  }
}

function openModal(modalId) {
  const modal = $(modalId);
  modal.classList.add('active');
  
  const firstInput = modal.querySelector('input, button:not(.modal-close)');
  if (firstInput) firstInput.focus();
  
  modal.addEventListener('keydown', handleModalKeyboard);
}

function closeModal(modalId) {
  const modal = $(modalId);
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
    closeModal(btn.dataset.modal);
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

updateButtonStates(false);
