// ============================================================
// RateChain v3.0 — USD ↔ SGD Converter w/ intermediate steps
// ============================================================
// APIs:
//   - Frankfurter v2: https://api.frankfurter.dev/v2/rates?base=USD
//   - CoinGecko:      https://api.coingecko.com/api/v3/coins/markets
// Conversion: amount × usdPrice(from) / usdPrice(to) per hop
// Cached in localStorage with 5-min TTL.
// ============================================================

// ---------- FLAG EMOJI MAP ----------
const FLAGS = {
  "AED":"🇦🇪","AFN":"🇦🇫","ALL":"🇦🇱","AMD":"🇦🇲","ANG":"🇨🇼","AOA":"🇦🇴","ARS":"🇦🇷",
  "AUD":"🇦🇺","AWG":"🇦🇼","AZN":"🇦🇿","BAM":"🇧🇦","BBD":"🇧🇧","BDT":"🇧🇩","BGN":"🇧🇬",
  "BHD":"🇧🇭","BIF":"🇧🇮","BMD":"🇧🇲","BND":"🇧🇳","BOB":"🇧🇴","BRL":"🇧🇷","BSD":"🇧🇸",
  "BTN":"🇧🇹","BWP":"🇧🇼","BYN":"🇧🇾","BZD":"🇧🇿","CAD":"🇨🇦","CDF":"🇨🇩","CHF":"🇨🇭",
  "CLP":"🇨🇱","CNY":"🇨🇳","COP":"🇨🇴","CRC":"🇨🇷","CUP":"🇨🇺","CVE":"🇨🇻","CZK":"🇨🇿",
  "DJF":"🇩🇯","DKK":"🇩🇰","DOP":"🇩🇴","DZD":"🇩🇿","EGP":"🇪🇬","ERN":"🇪🇷","ETB":"🇪🇹",
  "EUR":"🇪🇺","FJD":"🇫🇯","FKP":"🇫🇰","FOK":"🇫🇴","GBP":"🇬🇧","GEL":"🇬🇪","GGP":"🇬🇬",
  "GHS":"🇬🇭","GIP":"🇬🇮","GMD":"🇬🇲","GNF":"🇬🇳","GTQ":"🇬🇹","GYD":"🇬🇾","HKD":"🇭🇰",
  "HNL":"🇭🇳","HRK":"🇭🇷","HTG":"🇭🇹","HUF":"🇭🇺","IDR":"🇮🇩","ILS":"🇮🇱","IMP":"🇮🇲",
  "INR":"🇮🇳","IQD":"🇮🇶","IRR":"🇮🇷","ISK":"🇮🇸","JEP":"🇯🇪","JMD":"🇯🇲","JOD":"🇯🇴",
  "JPY":"🇯🇵","KES":"🇰🇪","KGS":"🇰🇬","KHR":"🇰🇭","KID":"🇰🇮","KMF":"🇰🇲","KRW":"🇰🇷",
  "KWD":"🇰🇼","KYD":"🇰🇾","KZT":"🇰🇿","LAK":"🇱🇦","LBP":"🇱🇧","LKR":"🇱🇰","LRD":"🇱🇷",
  "LSL":"🇱🇸","LYD":"🇱🇾","MAD":"🇲🇦","MDL":"🇲🇩","MGA":"🇲🇬","MKD":"🇲🇰","MMK":"🇲🇲",
  "MNT":"🇲🇳","MOP":"🇲🇴","MRU":"🇲🇷","MUR":"🇲🇺","MVR":"🇲🇻","MWK":"🇲🇼","MXN":"🇲🇽",
  "MYR":"🇲🇾","MZN":"🇲🇿","NAD":"🇳🇦","NGN":"🇳🇬","NIO":"🇳🇮","NOK":"🇳🇴","NPR":"🇳🇵",
  "NZD":"🇳🇿","OMR":"🇴🇲","PAB":"🇵🇦","PEN":"🇵🇪","PGK":"🇵🇬","PHP":"🇵🇭","PKR":"🇵🇰",
  "PLN":"🇵🇱","PYG":"🇵🇾","QAR":"🇶🇦","RON":"🇷🇴","RSD":"🇷🇸","RUB":"🇷🇺","RWF":"🇷🇼",
  "SAR":"🇸🇦","SBD":"🇸🇧","SCR":"🇸🇨","SDG":"🇸🇩","SEK":"🇸🇪","SGD":"🇸🇬","SHP":"🇸🇭",
  "SLL":"🇸🇱","SOS":"🇸🇴","SRD":"🇸🇷","SSP":"🇸🇸","STN":"🇸🇹","SYP":"🇸🇾","SZL":"🇸🇿",
  "THB":"🇹🇭","TJS":"🇹🇯","TMT":"🇹🇲","TND":"🇹🇳","TOP":"🇹🇴","TRY":"🇹🇷","TTD":"🇹🇹",
  "TVD":"🇹🇻","TWD":"🇹🇼","TZS":"🇹🇿","UAH":"🇺🇦","UGX":"🇺🇬","USD":"🇺🇸","UYU":"🇺🇾",
  "UZS":"🇺🇿","VES":"🇻🇪","VND":"🇻🇳","VUV":"🇻🇺","WST":"🇼🇸","XAF":"🇨🇲","XCD":"🇱🇨",
  "XDR":"🌐","XOF":"🇧🇫","XPF":"🇵🇫","YER":"🇾🇪","ZAR":"🇿🇦","ZMW":"🇿🇲","ZWL":"🇿🇼"
};

// ---------- STATE ----------
const state = {
  fiatRates: {},        // { "JPY": 160.42, ... } — USD per 1 unit of currency
  cryptoData: [],       // [{ id, symbol, name, image, current_price }, ...]
  baseAmount: 1,
  // From is always USD, To is always SGD
  steps: [],            // Array of intermediate currency/crypto IDs
  lastUpdated: null,
  theme: "dark",
  // Mode: "direct" = USD→SGD direct, "stepped" = USD→step1→...→SGD
  mode: "direct"
};

// ---------- DOM CACHE ----------
const dom = {};
let isRendered = false;

// ---------- CACHE HELPERS ----------
const CACHE_TTL = 300000; // 5 min

function cacheGet(key) {
  try {
    const raw = localStorage.getItem('rc_' + key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL) {
      localStorage.removeItem('rc_' + key);
      return null;
    }
    return entry.data;
  } catch { return null; }
}
function cacheSet(key, data) {
  try { localStorage.setItem('rc_' + key, JSON.stringify({ data, ts: Date.now() })); } catch {}
}
try { localStorage.removeItem('rc_fiat'); } catch {}

// ---------- API CALLS ----------
async function fetchFiatRates() {
  const cached = cacheGet('fiat_v2');
  if (cached) return cached;
  const res = await fetch('https://api.frankfurter.dev/v2/rates?base=USD');
  const arr = await res.json();
  const rates = {};
  for (const r of arr) {
    if (r.base === 'USD') rates[r.quote] = r.rate;
  }
  rates['USD'] = 1;
  cacheSet('fiat_v2', rates);
  return rates;
}

async function fetchCryptoPrices() {
  const cached = cacheGet('crypto');
  if (cached) return cached;
  const res = await fetch(
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false'
  );
  const data = await res.json();
  cacheSet('crypto', data);
  return data;
}

async function fetchAllData() {
  showLoading();
  try {
    const [fiat, crypto] = await Promise.all([fetchFiatRates(), fetchCryptoPrices()]);
    state.fiatRates = fiat;
    state.cryptoData = crypto;
    state.lastUpdated = new Date();
    buildStaticDOM();
    updateResult();
  } catch (e) {
    document.getElementById('app').innerHTML =
      `<div class="error-msg">Failed to load rates: ${e.message}. Refresh to retry.</div>`;
    console.error(e);
  }
}

// ---------- LOADING ----------
function showLoading() {
  const root = document.getElementById('app');
  root.innerHTML =
    '<div class="loading-screen"><div class="loading-spinner"></div><span>Loading rates…</span></div>';
}

// ---------- TYPE DETECTION ----------
function isFiat(code) { return !!FLAGS[code]; }

function getDisplayName(code) {
  if (isFiat(code)) return code;
  const coin = state.cryptoData.find(c => c.id === code || c.symbol.toUpperCase() === code);
  return coin ? coin.symbol.toUpperCase() : code;
}

function getFullName(code) {
  if (isFiat(code)) return code + ' - ' + (new Intl.DisplayNames(['en'], { type: 'currency' }).of(code) || '');
  const coin = state.cryptoData.find(c => c.id === code || c.symbol.toUpperCase() === code);
  return coin ? coin.name : code;
}

function getIcon(code) {
  if (isFiat(code)) return FLAGS[code] || '💱';
  const coin = state.cryptoData.find(c => c.id === code || c.symbol.toUpperCase() === code);
  return coin && coin.image
    ? `<img src="${coin.image}" alt="${code}" class="coin-icon" loading="lazy">`
    : '🪙';
}

function getSortedAllItems() {
  const items = [];
  Object.keys(state.fiatRates).sort().forEach(c => {
    items.push({ id: c, label: c, name: getFullName(c), icon: FLAGS[c] || '💱', type: 'fiat' });
  });
  state.cryptoData.forEach(c => {
    items.push({
      id: c.id, label: c.symbol.toUpperCase(), name: c.name,
      icon: c.image ? `<img src="${c.image}" class="coin-icon" loading="lazy">` : '🪙',
      type: 'crypto', price: c.current_price
    });
  });
  return items;
}

// ---------- USD PRICE ----------
// usdPrice(X) = how many USD per 1 unit of currency X
function usdPrice(code) {
  if (code === 'USD') return 1;
  if (isFiat(code) && state.fiatRates[code]) return 1 / state.fiatRates[code];
  const coin = state.cryptoData.find(c => c.id === code || c.symbol.toUpperCase() === code);
  return coin ? coin.current_price : 0;
}

// ---------- CHAIN CONVERSION ----------
// Chain: amount × usdPrice(from) / usdPrice(step1) × usdPrice(step1) / usdPrice(step2) ...
// = amount × usdPrice(from) / usdPrice(to)
function calculateFull(from, steps, to, amount) {
  const chain = [from, ...steps, to];
  const results = [];
  let amt = amount;
  for (let i = 1; i < chain.length; i++) {
    amt = amt * usdPrice(chain[i - 1]) / usdPrice(chain[i]);
    results.push({ currency: chain[i], amount: amt });
  }
  return { results, final: amt };
}

// ---------- FORMAT ----------
function formatAmt(n) {
  if (n === 0 || !isFinite(n)) return '0.00';
  if (n >= 1) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 0.01) return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toExponential(2);
}

// ---------- BUILD STATIC DOM ----------
function buildStaticDOM() {
  if (isRendered) return;
  isRendered = true;
  const root = document.getElementById('app');
  root.className = state.theme;
  root.innerHTML = '';

  // --- Header ---
  dom.header = ce('div', 'header');
  dom.title = ce('h1', 'title', 'RateChain');
  dom.themeBtn = ce('button', 'theme-toggle', '');
  dom.themeBtn.setAttribute('aria-label', 'Toggle dark mode');
  dom.themeBtn.innerHTML = getThemeIcon();
  dom.header.append(dom.title, dom.themeBtn);
  root.appendChild(dom.header);

  // --- Amount Input ---
  dom.amtWrap = ce('div', 'amount-wrap');
  dom.amtInput = ce('input', 'amount-input');
  dom.amtInput.type = 'number';
  dom.amtInput.value = state.baseAmount;
  dom.amtInput.step = 'any';
  dom.amtInput.min = '0';
  dom.amtInput.id = 'baseAmount';
  dom.amtInput.setAttribute('aria-label', 'Amount to convert');
  dom.amtInput.autocomplete = 'off';
  dom.amtUnderline = ce('div', 'amount-underline');
  dom.amtWrap.append(dom.amtInput, dom.amtUnderline);
  root.appendChild(dom.amtWrap);

  // --- Base Row (always USD) ---
  dom.baseRow = createFixedRow('From', 'USD');
  root.appendChild(dom.baseRow);

  // --- Mode Toggle ---
  dom.modeWrap = ce('div', 'mode-toggle-wrap');
  dom.directBtn = ce('button', 'mode-btn active', 'USD → SGD');
  dom.directBtn.dataset.mode = 'direct';
  dom.steppedBtn = ce('button', 'mode-btn', 'Via steps →');
  dom.steppedBtn.dataset.mode = 'stepped';
  dom.modeWrap.append(dom.directBtn, dom.steppedBtn);
  root.appendChild(dom.modeWrap);

  // --- Steps Container ---
  dom.stepsContainer = ce('div', 'steps-container');
  dom.stepsContainer.id = 'stepsContainer';
  root.appendChild(dom.stepsContainer);

  // --- Add Step ---
  dom.addBtn = ce('button', 'add-step', '+ Add intermediate step');
  dom.addBtn.dataset.action = 'addStep';
  root.appendChild(dom.addBtn);

  // --- Target Row (always SGD) ---
  dom.targetRow = createFixedRow('To', 'SGD');
  root.appendChild(dom.targetRow);

  // --- Result ---
  dom.resultDiv = ce('div', 'result');
  dom.resultLabel = ce('span', 'result-label', '→ SGD');
  dom.resultValue = ce('span', 'result-value', '0.00');
  dom.resultDiv.append(dom.resultLabel, dom.resultValue);
  root.appendChild(dom.resultDiv);

  // --- Breakdown ---
  dom.breakdown = ce('div', 'breakdown');
  dom.breakdown.id = 'breakdown';
  root.appendChild(dom.breakdown);

  // --- Last Updated ---
  dom.lastUpdated = ce('div', 'last-updated');
  root.appendChild(dom.lastUpdated);

  // Bind events once
  bindEvents();
}

// ---------- CREATE FIXED ROW ----------
function createFixedRow(label, code) {
  const row = ce('div', 'curr-row');
  const lbl = ce('span', 'curr-label', label);
  const display = ce('div', 'curr-display');
  display.innerHTML = `${getIcon(code)} <span class="curr-code">${code}</span>`;
  row.append(lbl, display);
  return row;
}

// ---------- UPDATE RESULT (partial re-render) ----------
function updateResult() {
  if (!isRendered) return;

  // Theme
  document.getElementById('app').className = state.theme;

  // Theme icon
  dom.themeBtn.innerHTML = getThemeIcon();

  // Amount (no focus loss)
  if (document.activeElement !== dom.amtInput) {
    dom.amtInput.value = state.baseAmount;
  }

  // Mode buttons
  dom.directBtn.className = 'mode-btn' + (state.mode === 'direct' ? ' active' : '');
  dom.steppedBtn.className = 'mode-btn' + (state.mode === 'stepped' ? ' active' : '');

  // Steps visibility
  const showSteps = state.mode === 'stepped';
  dom.stepsContainer.style.display = showSteps ? '' : 'none';
  dom.addBtn.style.display = showSteps ? '' : 'none';

  // Rebuild steps
  rebuildSteps();

  // Calculate
  const calc = calculateFull('USD', state.steps, 'SGD', state.baseAmount);
  dom.resultLabel.textContent = state.mode === 'direct' ? '→ SGD' : `→ SGD (via ${state.steps.length} step${state.steps.length !== 1 ? 's' : ''})`;
  dom.resultValue.textContent = formatAmt(calc.final);

  // Rebuild breakdown
  rebuildBreakdown(state.steps, state.baseAmount);

  // Timestamp
  if (state.lastUpdated) {
    dom.lastUpdated.textContent = 'Updated: ' + state.lastUpdated.toLocaleTimeString();
  }
}

// ---------- REBUILD STEPS ----------
function rebuildSteps() {
  const container = dom.stepsContainer;
  container.innerHTML = '';
  state.steps.forEach((code, i) => {
    const row = ce('div', 'step-row');
    const labelSpan = ce('span', 'step-label', 'Step ' + (i + 1));
    const removeBtn = ce('button', 'remove-step', '×');
    removeBtn.dataset.action = 'removeStep';
    removeBtn.dataset.stepIndex = i;
    removeBtn.setAttribute('aria-label', 'Remove step ' + (i + 1));
    labelSpan.appendChild(removeBtn);

    const trigger = ce('button', 'step-trigger', '');
    const iconHtml = getIcon(code);
    const display = getDisplayName(code);
    trigger.innerHTML =
      `${iconHtml} <span class="curr-code">${display}</span>` +
      `<svg class="chev" viewBox="0 0 24 24" width="12" height="12"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
    trigger.dataset.role = 'step';
    trigger.dataset.stepIndex = i;
    row.append(labelSpan, trigger);
    container.appendChild(row);
  });
}

// ---------- REBUILD BREAKDOWN ----------
function rebuildBreakdown(steps, amount) {
  const bd = dom.breakdown;
  bd.innerHTML = '';
  if (steps.length === 0) { bd.style.display = 'none'; return; }
  bd.style.display = '';

  let prev = 'USD';
  let amt = amount;
  for (const cur of steps) {
    amt = amt * usdPrice(prev) / usdPrice(cur);
    const row = ce('div', 'breakdown-row');
    row.innerHTML = `<span>${getIcon(cur)} ${getDisplayName(cur)}</span><span>${formatAmt(amt)}</span>`;
    bd.appendChild(row);
    prev = cur;
  }
  // Final
  amt = amt * usdPrice(prev) / usdPrice('SGD');
  const row = ce('div', 'breakdown-row final');
  row.innerHTML = `<span>${getIcon('SGD')} SGD</span><span>${formatAmt(amt)}</span>`;
  bd.appendChild(row);
}

// ---------- DROPDOWN ----------
let dropdownActive = false;
let ddOverlay = null;

function showDropdown(role, currentCode, stepIndex) {
  if (dropdownActive) return;
  dropdownActive = true;
  const items = getSortedAllItems();

  ddOverlay = ce('div', 'dropdown-overlay');

  const panel = ce('div', 'dropdown-panel');
  const search = ce('input', 'dropdown-search');
  search.type = 'text';
  search.placeholder = 'Search currencies…';
  search.setAttribute('aria-label', 'Search currencies');
  search.setAttribute('autocomplete', 'off');
  search.autofocus = true;

  const list = ce('div', 'dropdown-list');
  let highlightIndex = -1;
  const filteredItems = [];

  function renderList(query) {
    const q = query.toLowerCase();
    list.innerHTML = '';
    filteredItems.length = 0;
    const filtered = items.filter(it =>
      it.id.toLowerCase().includes(q) ||
      it.label.toLowerCase().includes(q) ||
      it.name.toLowerCase().includes(q)
    );
    filtered.forEach(it => filteredItems.push(it));

    if (filteredItems.length === 0) {
      list.innerHTML = '<div class="dropdown-empty">No results</div>';
      return;
    }

    filteredItems.forEach((it, idx) => {
      const opt = document.createElement('button');
      opt.className = 'dropdown-item' + (it.id === currentCode ? ' selected' : '') + (idx === highlightIndex ? ' highlighted' : '');
      opt.innerHTML =
        `${it.icon} <span class="di-label">${it.label}</span> <span class="di-name">${it.name}</span>` +
        (it.price ? `<span class="di-price">$${formatAmt(it.price)}</span>` : '');
      opt.dataset.idx = idx;
      opt.addEventListener('click', () => {
        selectItem(role, it.id, stepIndex);
        closeDropdown();
      });
      list.appendChild(opt);
    });
  }

  renderList('');

  search.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightIndex = Math.min(highlightIndex + 1, filteredItems.length - 1);
      renderList(search.value);
      const highlighted = list.querySelector('.highlighted');
      if (highlighted) highlighted.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightIndex = Math.max(highlightIndex - 1, 0);
      renderList(search.value);
      const highlighted = list.querySelector('.highlighted');
      if (highlighted) highlighted.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < filteredItems.length) {
        selectItem(role, filteredItems[highlightIndex].id, stepIndex);
        closeDropdown();
      }
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  search.addEventListener('input', () => {
    highlightIndex = -1;
    renderList(search.value);
  });

  panel.append(search, list);
  ddOverlay.appendChild(panel);
  document.body.appendChild(ddOverlay);

  search.addEventListener('input', (e) => e.stopPropagation());
  search.addEventListener('keydown', (e) => e.stopPropagation());

  setTimeout(() => search.focus(), 50);

  ddOverlay.addEventListener('pointerdown', (e) => {
    if (e.target === ddOverlay) closeDropdown();
  });

  // Global Escape cleanup
  const escHandler = (e) => { if (e.key === 'Escape') closeDropdown(); };
  document.addEventListener('keydown', escHandler);

  const origClose = closeDropdown;
  closeDropdown = function() {
    document.removeEventListener('keydown', escHandler);
    origClose();
    closeDropdown = origClose;
  };
}

function closeDropdown() {
  if (ddOverlay && ddOverlay.parentNode) ddOverlay.parentNode.removeChild(ddOverlay);
  ddOverlay = null;
  dropdownActive = false;
}

function selectItem(role, id, stepIndex) {
  if (role === 'step' && stepIndex !== null) {
    state.steps[stepIndex] = id;
    updateResult();
  }
}

// ---------- EVENT BINDING ----------
function bindEvents() {
  // Amount input
  dom.amtInput.addEventListener('input', () => {
    const v = parseFloat(dom.amtInput.value);
    if (isNaN(v)) state.baseAmount = 0;
    else if (v < 0) state.baseAmount = 0;
    else state.baseAmount = v;
    updateResult();
  });

  // Mode toggle
  dom.directBtn.addEventListener('click', () => {
    if (state.mode === 'direct') return;
    state.mode = 'direct';
    state.steps = [];
    updateResult();
  });
  dom.steppedBtn.addEventListener('click', () => {
    if (state.mode === 'stepped') return;
    state.mode = 'stepped';
    // Auto-add one step if empty
    if (state.steps.length === 0) state.steps.push('EUR');
    updateResult();
  });

  // Add step
  dom.addBtn.addEventListener('click', () => {
    state.steps.push('EUR');
    updateResult();
  });

  // Theme toggle
  dom.themeBtn.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.getElementById('app').className = state.theme;
    dom.themeBtn.innerHTML = getThemeIcon();
  });

  // Remove step (delegation)
  dom.stepsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="removeStep"]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.stepIndex);
    state.steps.splice(idx, 1);
    updateResult();
  });

  // Trigger dropdown (delegation on root)
  const root = document.getElementById('app');
  root.addEventListener('click', (e) => {
    const trigger = e.target.closest('.step-trigger');
    if (!trigger) return;
    const stepIndex = trigger.dataset.stepIndex !== undefined ? parseInt(trigger.dataset.stepIndex) : null;
    const code = state.steps[stepIndex] || 'EUR';
    showDropdown('step', code, stepIndex);
  });
}

// ---------- THEME ICON ----------
function getThemeIcon() {
  return state.theme === 'dark'
    ? '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/></g></svg>'
    : '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/></svg>';
}

// ---------- HELPERS ----------
function ce(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}

// ---------- INIT ----------
fetchAllData();
