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
  
  // Set effective date to today by default
  const effectiveDate = $('effectiveDate');
  if (effectiveDate && !effectiveDate.value) {
    const today = new Date().toISOString().split('T')[0];
    effectiveDate.value = today;
  }
  
  // Add contract type change handler for dynamic form logic
  const contractType = $('contractType');
  if (contractType) {
    contractType.addEventListener('change', handleContractTypeChange);
    // Initialize based on current selection
    handleContractTypeChange();
  }
  
  // Add number of parties change handler for dynamic party fields
  const numberOfParties = $('numberOfParties');
  if (numberOfParties) {
    numberOfParties.addEventListener('change', handleNumberOfPartiesChange);
    // Initialize based on current selection
    handleNumberOfPartiesChange();
  }
  
  // Auto-focus on Contract Title field
  const titleInput = $('title');
  if (titleInput) {
    titleInput.focus();
  }
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
  
  // Initialize branding section
  initBrandingSection();
  
  // Load saved report if it exists
  loadSavedReport();
});

// Keyboard shortcuts handler
function handleKeyboardShortcuts(e) {
  // Ctrl+Enter or Cmd+Enter: Generate contract
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    const generateBtn = $('btn-generate');
    if (generateBtn && !isGenerating) {
      generateBtn.click();
    }
  }
  
  // Ctrl+S or Cmd+S: Save contract
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveToDatabase();
  }
  
  // Ctrl+N or Cmd+N: New contract
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    newContract();
  }
}

// ==== BRANDING SECTION (PHASE 1 & 2) ====

const BRANDING_STORAGE_KEY = 'ybg.contractCommander.branding';
const MAX_LOGO_SIZE = 300 * 1024; // 300KB

function initBrandingSection() {
  const collapseToggle = $('branding-collapse-toggle');
  const brandingSection = $('branding-section');
  const logoUploadInput = $('logoUpload');
  const uploadBtn = $('btn-upload-logo');
  const replaceBtn = $('btn-replace-logo');
  const removeBtn = $('btn-remove-logo');
  const includeBrandingCheckbox = $('includeBranding');
  
  // Load saved branding config from localStorage
  loadBrandingConfig();
  
  // Collapse/expand toggle
  if (collapseToggle && brandingSection) {
    collapseToggle.addEventListener('click', () => {
      const isHidden = brandingSection.style.display === 'none';
      brandingSection.style.display = isHidden ? '' : 'none';
      const icon = collapseToggle.querySelector('.collapse-icon');
      if (icon) {
        icon.classList.toggle('expanded', isHidden);
      }
    });
  }
  
  // Logo upload handlers
  if (uploadBtn && logoUploadInput) {
    uploadBtn.addEventListener('click', () => logoUploadInput.click());
  }
  
  if (replaceBtn && logoUploadInput) {
    replaceBtn.addEventListener('click', () => logoUploadInput.click());
  }
  
  if (removeBtn) {
    removeBtn.addEventListener('click', removeLogo);
  }
  
  if (logoUploadInput) {
    logoUploadInput.addEventListener('change', handleLogoUpload);
  }
  
  // Save branding config on any change
  const brandingFields = [
    'includeBranding',
    'lhCompany',
    'lhAddress',
    'lhContact',
    'addLegalFooter'
  ];
  
  brandingFields.forEach(fieldId => {
    const field = $(fieldId);
    if (field) {
      field.addEventListener('change', () => {
        saveBrandingConfig();
        updateBrandingWarning();
      });
      field.addEventListener('input', () => {
        saveBrandingConfig();
        updateBrandingWarning();
      });
    }
  });
  
  // Save position and pages radio selections
  const positionRadios = document.querySelectorAll('input[name="lhPosition"]');
  const pagesRadios = document.querySelectorAll('input[name="lhPages"]');
  
  positionRadios.forEach(radio => {
    radio.addEventListener('change', saveBrandingConfig);
  });
  
  pagesRadios.forEach(radio => {
    radio.addEventListener('change', saveBrandingConfig);
  });
  
  // Reset branding button (Phase 2)
  const resetBtn = $('btn-reset-branding');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetBrandingConfig);
  }
  
  // Initial warning check
  updateBrandingWarning();
}

function resetBrandingConfig() {
  if (!confirm('Reset all branding settings? This will clear your logo, letterhead, and preferences.')) {
    return;
  }
  
  // Clear localStorage
  try {
    localStorage.removeItem(BRANDING_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to reset branding config:', e);
  }
  
  // Reset form fields
  if ($('includeBranding')) $('includeBranding').checked = false;
  if ($('addLegalFooter')) $('addLegalFooter').checked = false;
  if ($('lhCompany')) $('lhCompany').value = '';
  if ($('lhAddress')) $('lhAddress').value = '';
  if ($('lhContact')) $('lhContact').value = '';
  
  // Reset radio buttons to defaults
  const leftRadio = document.querySelector('input[name="lhPosition"][value="left"]');
  const firstRadio = document.querySelector('input[name="lhPages"][value="first"]');
  if (leftRadio) leftRadio.checked = true;
  if (firstRadio) firstRadio.checked = true;
  
  // Remove logo
  removeLogo();
  
  // Update warning
  updateBrandingWarning();
  
  // Show success message
  alert('Branding settings have been reset.');
}

function handleLogoUpload(e) {
  const file = e.target.files[0];
  const logoError = $('logo-error');
  
  if (!file) return;
  
  // Validate file type
  const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    showLogoError('Please upload a PNG, JPG, or SVG file.');
    e.target.value = '';
    return;
  }
  
  // Validate file size
  if (file.size > MAX_LOGO_SIZE) {
    showLogoError(`File size must be ≤300KB. Your file is ${(file.size / 1024).toFixed(0)}KB.`);
    e.target.value = '';
    return;
  }
  
  // Convert to Base64
  const reader = new FileReader();
  reader.onload = function(event) {
    const dataUrl = event.target.result;
    
    // Show warning for SVG files (limited PDF support)
    if (file.type === 'image/svg+xml') {
      showLogoError('Note: SVG logos may have limited support in PDF export. PNG or JPG recommended for best results.');
    } else {
      hideLogoError();
    }
    
    displayLogoPreview(dataUrl);
    saveBrandingConfig();
    updateBrandingWarning();
  };
  reader.onerror = function() {
    showLogoError('Failed to read file. Please try again.');
  };
  reader.readAsDataURL(file);
}

function displayLogoPreview(dataUrl) {
  const previewContainer = $('logo-preview-container');
  const previewImg = $('logo-preview');
  const uploadBtn = $('btn-upload-logo');
  
  if (previewImg && dataUrl) {
    previewImg.src = dataUrl;
  }
  
  if (previewContainer && uploadBtn) {
    previewContainer.style.display = dataUrl ? 'flex' : 'none';
    uploadBtn.style.display = dataUrl ? 'none' : '';
  }
}

function removeLogo() {
  const logoUploadInput = $('logoUpload');
  if (logoUploadInput) {
    logoUploadInput.value = '';
  }
  
  displayLogoPreview(null);
  saveBrandingConfig();
  updateBrandingWarning();
  hideLogoError();
}

function showLogoError(message) {
  const logoError = $('logo-error');
  if (logoError) {
    logoError.textContent = message;
    logoError.style.display = 'block';
  }
}

function hideLogoError() {
  const logoError = $('logo-error');
  if (logoError) {
    logoError.style.display = 'none';
  }
}

function updateBrandingWarning() {
  const includeBranding = $('includeBranding')?.checked;
  const brandingWarning = $('branding-warning');
  const config = getBrandingConfig();
  
  if (!brandingWarning) return;
  
  const hasContent = config.logoDataUrl || config.company || config.address || config.contact;
  
  if (includeBranding && !hasContent) {
    brandingWarning.style.display = 'block';
  } else {
    brandingWarning.style.display = 'none';
  }
}

function getBrandingConfig() {
  const logoPreview = $('logo-preview');
  const logoDataUrl = logoPreview?.src || null;
  
  const positionRadio = document.querySelector('input[name="lhPosition"]:checked');
  const pagesRadio = document.querySelector('input[name="lhPages"]:checked');
  
  return {
    enabled: $('includeBranding')?.checked || false,
    logoDataUrl: logoDataUrl && logoDataUrl.startsWith('data:') ? logoDataUrl : null,
    company: $('lhCompany')?.value?.trim() || '',
    address: $('lhAddress')?.value?.trim() || '',
    contact: $('lhContact')?.value?.trim() || '',
    position: positionRadio?.value || 'left',
    pages: pagesRadio?.value || 'first',
    addLegalFooter: $('addLegalFooter')?.checked || false
  };
}

function saveBrandingConfig() {
  const config = getBrandingConfig();
  try {
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save branding config:', e);
  }
}

function loadBrandingConfig() {
  try {
    const saved = localStorage.getItem(BRANDING_STORAGE_KEY);
    if (!saved) return;
    
    const config = JSON.parse(saved);
    
    // Restore checkbox values
    if ($('includeBranding')) {
      $('includeBranding').checked = config.enabled || false;
    }
    if ($('addLegalFooter')) {
      $('addLegalFooter').checked = config.addLegalFooter || false;
    }
    
    // Restore text fields
    if ($('lhCompany')) {
      $('lhCompany').value = config.company || '';
    }
    if ($('lhAddress')) {
      $('lhAddress').value = config.address || '';
    }
    if ($('lhContact')) {
      $('lhContact').value = config.contact || '';
    }
    
    // Restore radio selections
    if (config.position) {
      const positionRadio = document.querySelector(`input[name="lhPosition"][value="${config.position}"]`);
      if (positionRadio) {
        positionRadio.checked = true;
      }
    }
    
    if (config.pages) {
      const pagesRadio = document.querySelector(`input[name="lhPages"][value="${config.pages}"]`);
      if (pagesRadio) {
        pagesRadio.checked = true;
      }
    }
    
    // Restore logo preview
    if (config.logoDataUrl) {
      displayLogoPreview(config.logoDataUrl);
    }
    
    // Update warning display
    updateBrandingWarning();
  } catch (e) {
    console.error('Failed to load branding config:', e);
  }
}

// Dynamic party field visibility based on number of parties
function handleNumberOfPartiesChange() {
  const numParties = parseInt($('numberOfParties').value) || 2;
  
  // Party C (show if 3+ parties)
  const partyCContainer = $('partyCContainer');
  const partyCRoleContainer = $('partyCRoleContainer');
  if (partyCContainer && partyCRoleContainer) {
    partyCContainer.style.display = numParties >= 3 ? '' : 'none';
    partyCRoleContainer.style.display = numParties >= 3 ? '' : 'none';
  }
  
  // Party D (show if 4+ parties)
  const partyDContainer = $('partyDContainer');
  const partyDRoleContainer = $('partyDRoleContainer');
  if (partyDContainer && partyDRoleContainer) {
    partyDContainer.style.display = numParties >= 4 ? '' : 'none';
    partyDRoleContainer.style.display = numParties >= 4 ? '' : 'none';
  }
  
  // Party E (show if 5+ parties)
  const partyEContainer = $('partyEContainer');
  const partyERoleContainer = $('partyERoleContainer');
  if (partyEContainer && partyERoleContainer) {
    partyEContainer.style.display = numParties >= 5 ? '' : 'none';
    partyERoleContainer.style.display = numParties >= 5 ? '' : 'none';
  }
  
  // Party F (show if 6 parties)
  const partyFContainer = $('partyFContainer');
  const partyFRoleContainer = $('partyFRoleContainer');
  if (partyFContainer && partyFRoleContainer) {
    partyFContainer.style.display = numParties >= 6 ? '' : 'none';
    partyFRoleContainer.style.display = numParties >= 6 ? '' : 'none';
  }
}

// Dynamic form logic based on contract type
function handleContractTypeChange() {
  const contractType = $('contractType').value;
  const compensationGroup = $('compensation')?.closest('div.full');
  const confidentialityCheckbox = $('confidentiality');
  const termInput = $('term');
  
  // NDA-specific logic
  if (contractType === 'NDA') {
    // Hide compensation for NDAs
    if (compensationGroup) {
      compensationGroup.style.display = 'none';
    }
    // Confidentiality is inherent in NDAs, so check and disable
    if (confidentialityCheckbox) {
      confidentialityCheckbox.checked = true;
      confidentialityCheckbox.disabled = true;
    }
    // Set default term for NDAs
    if (termInput && !termInput.value) {
      termInput.placeholder = 'e.g., 3 years from Effective Date';
    }
  } else {
    // Show compensation for other contract types
    if (compensationGroup) {
      compensationGroup.style.display = '';
    }
    // Enable confidentiality checkbox for non-NDA contracts
    if (confidentialityCheckbox) {
      confidentialityCheckbox.disabled = false;
      confidentialityCheckbox.checked = true; // Default ON for Service Agreements, etc.
    }
    // Reset term placeholder
    if (termInput) {
      termInput.placeholder = 'e.g., 6 months, until terminated';
    }
  }
  
  // Employment Agreement-specific defaults
  if (contractType === 'Employment Agreement') {
    if (termInput && !termInput.value) {
      termInput.placeholder = 'e.g., At-will, or specify duration';
    }
  }
  
  // Partnership Agreement-specific defaults
  if (contractType === 'Partnership Agreement') {
    if (termInput && !termInput.value) {
      termInput.placeholder = 'e.g., Until dissolved by partners';
    }
  }
}

// Auto-save before page unload
window.addEventListener('beforeunload', () => {
  saveCurrentReport();
});

// ==== AUTO-SAVE/LOAD FUNCTIONS ====

const AUTOSAVE_KEY = 'ybg-bizplan-autosave';

function saveCurrentReport() {
  try {
    const formData = {
      contractType: $('contractType')?.value || 'Service Agreement',
      title: $('title')?.value.trim() || '',
      effectiveDate: $('effectiveDate')?.value || '',
      numberOfParties: $('numberOfParties')?.value || '2',
      partyAName: $('partyAName')?.value.trim() || '',
      partyARole: $('partyARole')?.value || '',
      partyBName: $('partyBName')?.value.trim() || '',
      partyBRole: $('partyBRole')?.value || '',
      partyCName: $('partyCName')?.value.trim() || '',
      partyCRole: $('partyCRole')?.value.trim() || '',
      partyDName: $('partyDName')?.value.trim() || '',
      partyDRole: $('partyDRole')?.value.trim() || '',
      partyEName: $('partyEName')?.value.trim() || '',
      partyERole: $('partyERole')?.value.trim() || '',
      partyFName: $('partyFName')?.value.trim() || '',
      partyFRole: $('partyFRole')?.value.trim() || '',
      scope: $('scope')?.value.trim() || '',
      compensation: $('compensation')?.value.trim() || '',
      term: $('term')?.value.trim() || '',
      termination: $('termination')?.value.trim() || '',
      confidentiality: $('confidentiality')?.checked || false,
      governingLaw: $('governingLaw')?.value.trim() || 'California, USA',
      ipOwnership: $('ipOwnership')?.value || 'Company owns',
      extraClauses: $('extraClauses')?.value.trim() || '',
      tone: $('tone')?.value || 'Professional',
      detailLevel: $('detailLevel')?.value || 'Standard',
      signatory1Name: $('signatory1Name')?.value.trim() || '',
      signatory1Title: $('signatory1Title')?.value.trim() || '',
      signatory2Name: $('signatory2Name')?.value.trim() || '',
      signatory2Title: $('signatory2Title')?.value.trim() || ''
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
      // New contract fields
      if ($('contractType')) $('contractType').value = saveData.formData.contractType || 'Service Agreement';
      if ($('title')) $('title').value = saveData.formData.title || '';
      if ($('effectiveDate')) $('effectiveDate').value = saveData.formData.effectiveDate || '';
      if ($('numberOfParties')) $('numberOfParties').value = saveData.formData.numberOfParties || '2';
      if ($('partyAName')) $('partyAName').value = saveData.formData.partyAName || '';
      if ($('partyARole')) $('partyARole').value = saveData.formData.partyARole || 'Company';
      if ($('partyBName')) $('partyBName').value = saveData.formData.partyBName || '';
      if ($('partyBRole')) $('partyBRole').value = saveData.formData.partyBRole || 'Contractor';
      if ($('partyCName')) $('partyCName').value = saveData.formData.partyCName || '';
      if ($('partyCRole')) $('partyCRole').value = saveData.formData.partyCRole || '';
      if ($('partyDName')) $('partyDName').value = saveData.formData.partyDName || '';
      if ($('partyDRole')) $('partyDRole').value = saveData.formData.partyDRole || '';
      if ($('partyEName')) $('partyEName').value = saveData.formData.partyEName || '';
      if ($('partyERole')) $('partyERole').value = saveData.formData.partyERole || '';
      if ($('partyFName')) $('partyFName').value = saveData.formData.partyFName || '';
      if ($('partyFRole')) $('partyFRole').value = saveData.formData.partyFRole || '';
      if ($('scope')) $('scope').value = saveData.formData.scope || '';
      if ($('compensation')) $('compensation').value = saveData.formData.compensation || '';
      if ($('term')) $('term').value = saveData.formData.term || '';
      if ($('termination')) $('termination').value = saveData.formData.termination || '';
      if ($('confidentiality')) $('confidentiality').checked = saveData.formData.confidentiality !== false;
      if ($('governingLaw')) $('governingLaw').value = saveData.formData.governingLaw || 'California, USA';
      if ($('ipOwnership')) $('ipOwnership').value = saveData.formData.ipOwnership || 'Company owns';
      if ($('extraClauses')) $('extraClauses').value = saveData.formData.extraClauses || '';
      if ($('tone')) $('tone').value = saveData.formData.tone || 'Professional';
      if ($('detailLevel')) $('detailLevel').value = saveData.formData.detailLevel || 'Standard';
      if ($('signatory1Name')) $('signatory1Name').value = saveData.formData.signatory1Name || '';
      if ($('signatory1Title')) $('signatory1Title').value = saveData.formData.signatory1Title || '';
      if ($('signatory2Name')) $('signatory2Name').value = saveData.formData.signatory2Name || '';
      if ($('signatory2Title')) $('signatory2Title').value = saveData.formData.signatory2Title || '';
      
      // Trigger party field visibility update after restoring numberOfParties
      handleNumberOfPartiesChange();
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
        
        // Show metadata
        showMetadata(
          currentReportData.contractType || 'Contract', 
          currentReportData.parties || '', 
          currentReportData.effectiveDate || ''
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
      progressBar.setAttribute('aria-label', 'Generating contract');
    }
    
    // Set Results container as busy
    if (resultsContainer) {
      resultsContainer.setAttribute('aria-busy', 'true');
    }
  } else {
    // Restore Generate button
    generateBtn.disabled = false;
    generateBtn.removeAttribute('aria-busy');
    generateBtn.textContent = 'Generate Contract';
    
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

function generateDefaultFilename(title, contractType) {
  const name = title || contractType || 'Contract';
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  
  return `${name} - ${year}-${month}-${day}_${hour}-${minute}`;
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


// Contract Templates
const BIZPLAN_TEMPLATES = {
  saas: {
    name: "SaaS Startup",
    company: "TechVenture Inc.",
    industry: "Technology / Software",
    target: "Business clients requiring software licensing",
    product: "Cloud-based software platform requiring licensing agreement and service terms",
    revenue: "License fees and subscription services",
    stage: "Negotiating contracts",
    goals: "1. Define clear licensing terms and usage rights\n2. Establish payment schedules and renewal terms\n3. Protect intellectual property and proprietary code\n4. Include standard warranty and liability clauses\n5. Set termination and data retention policies",
    tone: "Professional"
  },
  realestate: {
    name: "Real Estate Investment",
    company: "Property Partners LLC",
    industry: "Real Estate",
    target: "Property sellers and buyers",
    product: "Real estate transaction services requiring purchase agreements and disclosure documents",
    revenue: "Transaction-based service fees",
    stage: "Establishing contracts",
    goals: "1. Draft clear property purchase terms\n2. Include inspection and contingency clauses\n3. Define closing timeline and payment milestones\n4. Establish seller disclosures and warranties\n5. Include dispute resolution procedures",
    tone: "Professional"
  },
  consulting: {
    name: "Management Consulting",
    company: "Advisory Solutions Group",
    industry: "Business Consulting",
    target: "Corporate clients requiring consulting services",
    product: "Professional consulting services requiring service agreements and confidentiality terms",
    revenue: "Project fees and retainer agreements",
    stage: "Contract negotiation",
    goals: "1. Define scope of consulting services clearly\n2. Establish payment terms and billing procedures\n3. Include confidentiality and non-disclosure clauses\n4. Set deliverables and performance metrics\n5. Define contract duration and renewal options",
    tone: "Professional"
  },
  nonprofit: {
    name: "Nonprofit Organization",
    company: "Community Foundation",
    industry: "Nonprofit / Social Services",
    target: "Donors, volunteers, and service partners",
    product: "Partnership agreements and donor agreements requiring clear terms",
    revenue: "Grants and donations",
    stage: "Formalizing agreements",
    goals: "1. Establish partnership terms with stakeholders\n2. Define donor contribution terms and recognition\n3. Create volunteer agreements and waivers\n4. Set program collaboration guidelines\n5. Include standard nonprofit compliance clauses",
    tone: "Professional"
  },
  ecommerce: {
    name: "E-Commerce Store",
    company: "Digital Marketplace Co.",
    industry: "E-Commerce / Retail",
    target: "Customers and vendor partners",
    product: "Online marketplace requiring vendor agreements and terms of service",
    revenue: "Sales commissions and platform fees",
    stage: "Establishing vendor contracts",
    goals: "1. Create clear vendor partnership terms\n2. Define commission structure and payment schedules\n3. Establish product quality standards\n4. Include intellectual property protections\n5. Set termination and dispute procedures",
    tone: "Concise"
  },
  restaurant: {
    name: "Restaurant / Food Service",
    company: "Culinary Services LLC",
    industry: "Food & Beverage",
    target: "Suppliers and catering clients",
    product: "Catering services and supplier agreements requiring formal contracts",
    revenue: "Service fees and catering contracts",
    stage: "Contract creation",
    goals: "1. Establish supplier terms and pricing agreements\n2. Create catering service contracts with clear deliverables\n3. Include food safety and liability clauses\n4. Define cancellation and refund policies\n5. Set payment terms and deposit requirements",
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

function showMetadata(contractType, parties, effectiveDate) {
  const metadataBar = $('report-metadata');
  if ($('meta-contract-type')) $('meta-contract-type').textContent = contractType || 'N/A';
  if ($('meta-parties')) $('meta-parties').textContent = parties || 'N/A';
  if ($('meta-effective-date')) $('meta-effective-date').textContent = effectiveDate || 'N/A';
  
  const now = new Date();
  if ($('meta-timestamp')) $('meta-timestamp').textContent = now.toLocaleString();
  
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

// ==== CONTRACT RENDERING FUNCTIONS ====

function renderPremiumReport(data) {
  const mainPlanHtml = markdownToHtml(data.mainPlan || data.markdown || '');
  
  return `
    <div class="contract-document">
      ${mainPlanHtml}
    </div>
  `;
}

// Generate PDF-ready content (clean contract only)
function generatePDFContent(data) {
  // Return only the main contract content
  return (data.mainPlan || data.markdown || '');
}

// Template loading functions (deprecated - keeping for backward compatibility)
function loadTemplate(templateKey) {
  // Templates not used in Contract Commander - this function is deprecated
  console.log('Template loading is deprecated in Contract Commander');
}

function clearAllInputs() {
  if (confirm('Clear all input fields?')) {
    // Clear Contract Commander inputs
    $('contractType').value = 'Service Agreement';
    $('title').value = '';
    $('effectiveDate').value = '';
    $('numberOfParties').value = '2';
    $('partyAName').value = '';
    $('partyARole').value = 'Company';
    $('partyBName').value = '';
    $('partyBRole').value = 'Contractor';
    if ($('partyCName')) $('partyCName').value = '';
    if ($('partyCRole')) $('partyCRole').value = '';
    if ($('partyDName')) $('partyDName').value = '';
    if ($('partyDRole')) $('partyDRole').value = '';
    if ($('partyEName')) $('partyEName').value = '';
    if ($('partyERole')) $('partyERole').value = '';
    if ($('partyFName')) $('partyFName').value = '';
    if ($('partyFRole')) $('partyFRole').value = '';
    $('scope').value = '';
    $('compensation').value = '';
    $('term').value = '';
    $('termination').value = '';
    $('confidentiality').checked = true;
    $('governingLaw').value = 'California, USA';
    $('ipOwnership').value = 'Company owns';
    $('extraClauses').value = '';
    $('tone').value = 'Professional';
    $('detailLevel').value = 'Standard';
    $('signatory1Name').value = '';
    $('signatory1Title').value = '';
    $('signatory2Name').value = '';
    $('signatory2Title').value = '';
    
    // Trigger party field visibility update
    handleNumberOfPartiesChange();
  }
}

$('btn-generate').addEventListener('click', async () => {
  setGeneratingState(true);
  
  const payload = {
    contractType: $('contractType').value,
    title: $('title').value.trim(),
    effectiveDate: $('effectiveDate').value,
    partyAName: $('partyAName').value.trim(),
    partyARole: $('partyARole').value,
    partyBName: $('partyBName').value.trim(),
    partyBRole: $('partyBRole').value,
    scope: $('scope').value.trim(),
    compensation: $('compensation').value.trim(),
    term: $('term').value.trim(),
    termination: $('termination').value.trim(),
    confidentiality: $('confidentiality').checked ? 'true' : 'false',
    governingLaw: $('governingLaw').value.trim() || 'California, USA',
    ipOwnership: $('ipOwnership').value,
    extraClauses: $('extraClauses').value.trim(),
    tone: $('tone').value,
    detailLevel: $('detailLevel').value || 'Standard',
    signatory1Name: $('signatory1Name').value.trim(),
    signatory1Title: $('signatory1Title').value.trim(),
    signatory2Name: $('signatory2Name').value.trim(),
    signatory2Title: $('signatory2Title').value.trim()
  };
  
  // Validate required fields
  if (!payload.contractType || !payload.title || !payload.effectiveDate) {
    showToast('Please fill in required fields: Contract Type, Title, and Effective Date', 'error');
    setGeneratingState(false);
    return;
  }
  
  if (!payload.partyAName || !payload.partyBName) {
    showToast('Please fill in both party names', 'error');
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
      markdown: data.mainPlan || data.markdown || '',
      mainContent: data.mainPlan || data.markdown || '',
      html: fullHtml,
      contractType: payload.contractType || data.contractType,
      parties: `${payload.partyAName} and ${payload.partyBName}`,
      effectiveDate: payload.effectiveDate,
      company: payload.partyAName || payload.company,
      industry: payload.industry
    };
    
    // Expose to window for PDF export
    window.currentReportData = currentReportData;
    
    // Set default filename if not already set
    if (!currentFileName) {
      currentFileName = generateDefaultFilename(payload.contractType || 'Contract');
    }
    
    showMetadata(payload.contractType || 'Contract', `${payload.partyAName} and ${payload.partyBName}`, payload.effectiveDate);
    
    // Mark as unsaved changes
    markUnsaved();
    
    // Auto-save to localStorage
    saveCurrentReport();
    
    showToast('Contract generated successfully!', 'success');
    
  } catch (e) {
    console.error('Generation error:', e);
    const errorMsg = e.message === 'Failed to fetch' || e.message === 'Load failed' 
      ? 'Cannot connect to server. Please refresh the page and try again.'
      : e.message;
    reportView.innerHTML = `<p style="color: #ff6b6b;">Error: ${errorMsg}</p><p style="color: #999; font-size: 14px; margin-top: 10px;">If this persists, try: 1) Close this tab completely, 2) Clear Safari cache, 3) Reopen the page</p>`;
    showToast(`Error: ${errorMsg}`, 'error');
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
    if (!confirm('You have unsaved changes. Are you sure you want to start a new contract?')) {
      return;
    }
  }
  
  // Clear Contract Commander inputs
  $('contractType').value = 'Service Agreement';
  $('title').value = '';
  $('effectiveDate').value = '';
  $('numberOfParties').value = '2';
  $('partyAName').value = '';
  $('partyARole').value = 'Company';
  $('partyBName').value = '';
  $('partyBRole').value = 'Contractor';
  if ($('partyCName')) $('partyCName').value = '';
  if ($('partyCRole')) $('partyCRole').value = '';
  if ($('partyDName')) $('partyDName').value = '';
  if ($('partyDRole')) $('partyDRole').value = '';
  if ($('partyEName')) $('partyEName').value = '';
  if ($('partyERole')) $('partyERole').value = '';
  if ($('partyFName')) $('partyFName').value = '';
  if ($('partyFRole')) $('partyFRole').value = '';
  $('scope').value = '';
  $('compensation').value = '';
  $('term').value = '';
  $('termination').value = '';
  $('confidentiality').checked = true;
  $('governingLaw').value = 'California, USA';
  $('ipOwnership').value = 'Company owns';
  $('extraClauses').value = '';
  $('tone').value = 'Professional';
  $('detailLevel').value = 'Standard';
  $('signatory1Name').value = '';
  $('signatory1Title').value = '';
  $('signatory2Name').value = '';
  $('signatory2Title').value = '';
  
  // Trigger party field visibility update
  handleNumberOfPartiesChange();
  
  // Clear results
  $('report-view').innerHTML = '';
  currentReportData = null;
  currentFileName = null;
  currentReportId = null;
  hasUnsavedChanges = false;
  hideMetadata();
  
  showToast('Started new contract', 'success');
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

$('btn-export-word').addEventListener('click', () => {
  handleExportWord();
  $('export-menu').classList.remove('active');
});

// ==== TOOLS MENU HANDLERS ====

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
  
  // Clear all Contract Commander inputs
  $('contractType').value = 'Service Agreement';
  $('title').value = '';
  $('effectiveDate').value = '';
  $('numberOfParties').value = '2';
  $('partyAName').value = '';
  $('partyARole').value = 'Company';
  $('partyBName').value = '';
  $('partyBRole').value = 'Contractor';
  if ($('partyCName')) $('partyCName').value = '';
  if ($('partyCRole')) $('partyCRole').value = '';
  if ($('partyDName')) $('partyDName').value = '';
  if ($('partyDRole')) $('partyDRole').value = '';
  if ($('partyEName')) $('partyEName').value = '';
  if ($('partyERole')) $('partyERole').value = '';
  if ($('partyFName')) $('partyFName').value = '';
  if ($('partyFRole')) $('partyFRole').value = '';
  $('scope').value = '';
  $('compensation').value = '';
  $('term').value = '';
  $('termination').value = '';
  $('confidentiality').checked = true;
  $('governingLaw').value = 'California, USA';
  $('ipOwnership').value = 'Company owns';
  $('extraClauses').value = '';
  $('tone').value = 'Professional';
  $('detailLevel').value = 'Standard';
  $('signatory1Name').value = '';
  $('signatory1Title').value = '';
  $('signatory2Name').value = '';
  $('signatory2Title').value = '';
  
  // Trigger party field visibility update
  handleNumberOfPartiesChange();
  
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

$('load-cancel').addEventListener('click', () => {
  closeModal('load-modal');
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
        title: saveFilename,
        metadata: {
          mainContent: currentReportData.mainContent,
          contractType: currentReportData.contractType,
          parties: currentReportData.parties,
          effectiveDate: currentReportData.effectiveDate
        }
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
  try {
    const reportView = $('report-view');
    if (!reportView.innerHTML.trim() || !currentReportData) {
      showToast('No report to export', 'error');
      return;
    }
    
    // Check if export function exists
    if (typeof window.exportBizPlanToPDF !== 'function') {
      console.error('PDF export function not found. Type:', typeof window.exportBizPlanToPDF);
      showToast('PDF export module not loaded. Please refresh the page.', 'error');
      return;
    }
    
    // Auto-save before export
    saveCurrentReport();
    
    // Call the export function
    await window.exportBizPlanToPDF();
    
  } catch (e) {
    console.error('PDF export error:', e);
    showToast(`PDF export failed: ${e.message}`, 'error');
  }
}

async function handleExportWord() {
  try {
    const reportView = $('report-view');
    if (!reportView.innerHTML.trim() || !currentReportData) {
      showToast('No contract to export', 'error');
      return;
    }
    
    // Auto-save before export
    saveCurrentReport();
    
    // Get contract HTML content
    const contractHtml = reportView.innerHTML;
    console.log('📄 Word Export: Sending HTML to server, length:', contractHtml.length);
    
    // Generate filename
    const filename = currentFileName 
      ? currentFileName 
      : `${currentReportData.contractType || 'Contract'}_${Date.now()}`;
    
    // Show loading toast
    showToast('Generating Word document...', 'success');
    
    // Send HTML to server for conversion
    const response = await fetch('/api/export/word', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': getClientId()
      },
      body: JSON.stringify({
        html: contractHtml,
        filename: filename
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate Word document');
    }
    
    // Get the blob from the response
    const blob = await response.blob();
    console.log('📄 Word Export: Received DOCX from server, size:', blob.size, 'bytes');
    
    // Create download URL
    const url = URL.createObjectURL(blob);
    
    // Trigger download directly (server-generated file, no browser restrictions)
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `${filename}.docx`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Clean up URL after 5 seconds
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 5000);
    
    console.log('✓ Word export completed successfully:', `${filename}.docx`);
    showToast('Word document downloaded successfully!', 'success');
    
  } catch (e) {
    console.error('Word export error:', e);
    showToast(`Word export failed: ${e.message}`, 'error');
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
    
    // Restore structured data from metadata for PDF export
    const metadata = report.metadata || {};
    currentReportData = {
      html: report.contentHtml,
      company: report.company,
      industry: report.industry,
      mainContent: metadata.mainContent || '',
      contractType: metadata.contractType || 'Contract',
      parties: metadata.parties || `${report.company}`,
      effectiveDate: metadata.effectiveDate || ''
    };
    
    // Expose to window for PDF export
    window.currentReportData = currentReportData;
    
    showMetadata(metadata.contractType || report.company, metadata.parties || '', metadata.effectiveDate || '');
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
