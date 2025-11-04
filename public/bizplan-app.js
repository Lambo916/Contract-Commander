const FETCH_PATH = "/api/bizplan";
const SAVE_PATH = "/api/bizplan/reports/save";
const REPORTS_PATH = "/api/bizplan/reports";

const $ = (id) => document.getElementById(id);
let currentReportData = null;
let currentOffset = 0;
const REPORTS_LIMIT = 10;

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
