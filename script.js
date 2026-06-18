// ============================================================
// RateChain v2.0 — Interactive Currency & Crypto Converter
// ============================================================
// APIs:
//   - Frankfurter v2: https://api.frankfurter.dev/v2/rates?base=USD
//   - CoinGecko:      https://api.coingecko.com/api/v3/coins/markets
// Conversion: amount × usdPrice(from) / usdPrice(to) per hop
// All cached in localStorage with 5-min TTL.
// ============================================================

// ---------- FLAG EMOJI MAP (164 fiat currencies) ----------
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
  baseCurrency: "USD",
  steps: [],            // Array of intermediate currency/crypto IDs
  targetCurrency: "EUR",
  lastUpdated: null,
  theme: "dark"
};

// ---------- DOM CACHE (avoids re-render destroying inputs) ----------
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
// Clear stale v1 cache
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

// ---------- LOADING STATE ----------
function showLoading() {
  const root = document.getElementById('app');
  root.innerHTML =
    '<div class="loading-screen"><div class="loading-spinner"></div><span>Loading rates…</span></div>';
}

// ---------- TYPE DETECTION ----------
function isFiat(code) { return !!FLAGS[code]; }
function isCrypto(code) { return state.cryptoData.some(c => c.id === code || c.symbol.toUpperCase() === code); }

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
  // Fiat alphabetical
  Object.keys(state.fiatRates).sort().forEach(c => {
    items.push({ id: c, label: c, name: getFullName(c), icon: FLAGS[c] || '💱', type: 'fiat' });
  });
  // Crypto by market cap (already sorted from API)
  state.cryptoData.forEach(c => {
    items.push({
      id: c.id, label: c.symbol.toUpperCase(), name: c.name,
      icon: c.image ? `<img src="${c.image}" class="coin-icon" loading="lazy">` : '🪙',
      type: 'crypto', price: c.current_price
    });
  });
  return items;
}

// ---------- USD PRICE LOOKUP ----------
// usdPrice(X) = how many USD per 1 unit of currency X
// For fiat: usdPrice = 1 / (USD/fiat rate from Frankfurter)
// For crypto: usdPrice = CoinGecko current_price
// For USD: usdPrice = 1
function usdPrice(code) {
  if (code === 'USD') return 1;
  if (isFiat(code) && state.fiatRates[code]) return 1 / state.fiatRates[code];
  const coin = state.cryptoData.find(c => c.id === code || c.symbol.toUpperCase() === code);
  return coin ? coin.current_price : 0;
}

// ---------- CHAIN CONVERSION ----------
// Chain: amount × usdPrice(from) / usdPrice(step1) × usdPrice(step1) / usdPrice(step2) ...
// Final: = amount × usdPrice(from) / usdPrice(to)
// Each intermediate shows its converted value.
function calculateFull(from, steps, to, amount) {
  const chain = [from, ...steps, to];
  const results = [];
  let prev = from;
  let amt = amount;
  for (let i = 1; i < chain.length; i++) {
    const cur = chain[i];
    amt = amt * usdPrice(prev) / usdPrice(cur);
    results.push({ currency: cur, amount: amt });
    prev = cur;
  }
  return { results, final: amt };
}

// ---------- FORMAT NUMBER ----------
function formatAmt(n) {
  if (n === 0 || !isFinite(n)) return '0.00';
  if (n >= 1) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 0.01) return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toExponential(2);
}

// ---------- BUILD STATIC DOM (once, then update only values) ----------
function buildStaticDOM() {
  if (isRendered) return;
  isRendered = true;
  const root = document.getElementById('app');
  root.className = state.theme;
  root.innerHTML = ''; // clear loading

  // --- Header ---
  dom.header = ce('div', 'header');
  dom.title = ce('h1', 'title', 'RateChain');
  dom.themeBtn = ce('button', 'theme-toggle', '');
  dom.themeBtn.setAttribute('aria-label', 'Toggle dark mode');
  dom.themeBtn.dataset.action = 'toggleTheme';
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

  // --- Base Row ---
  dom.baseRow = createCurrencyRowStatic('base', 'base');
  root.appendChild(dom.baseRow);
  dom.baseTrigger = dom.baseRow.querySelector('.curr-trigger');
  dom.baseTrigger.dataset.role = 'base';

  // --- Steps Container ---
  dom.stepsContainer = ce('div', 'steps-container');
  dom.stepsContainer.id = 'stepsContainer';
  root.appendChild(dom.stepsContainer);

  // --- Add Step ---
  dom.addBtn = ce('button', 'add-step', '+ Add intermediate step');
  dom.addBtn.dataset.action = 'addStep';
  root.appendChild(dom.addBtn);

  // --- Target Row ---
  dom.targetRow = createCurrencyRowStatic('target', 'target');
  root.appendChild(dom.targetRow);
  dom.targetTrigger = dom.targetRow.querySelector('.curr-trigger');
  dom.targetTrigger.dataset.role = 'target';

  // --- Result ---
  dom.resultDiv = ce('div', 'result');
  dom.resultLabel = ce('span', 'result-label', '→ EUR');
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

// ---------- CREATE STATIC CURRENCY ROW ----------
function createCurrencyRowStatic(label, id) {
  const row = ce('div', 'curr-row');
  const labelSpan = ce('span', 'curr-label', label === 'base' ? 'From' : 'To');
  const trigger = ce('button', 'curr-trigger', '');
  const code = label === 'base' ? state.baseCurrency : state.targetCurrency;
  const iconHtml = getIcon(code);
  const display = getDisplayName(code);
  trigger.innerHTML =
    `${iconHtml} <span class="curr-code">${display}</span>` +
    `<svg class="chev" viewBox="0 0 24 24" width="12" height="12"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  trigger.setAttribute('aria-label', `Select ${label} currency`);
  row.append(labelSpan, trigger);

  if (label === 'base') {
    const swapBtn = ce('button', 'swap-btn', '');
    swapBtn.innerHTML =
      '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M7 16V4l-3 3m10 4v12l3-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    swapBtn.setAttribute('aria-label', 'Swap currencies');
    swapBtn.dataset.action = 'swap';
    labelSpan.appendChild(swapBtn);
  }

  return row;
}

// ---------- UPDATE RESULT (partial re-render, no DOM rebuild) ----------
function updateResult() {
  if (!isRendered) return;

  // Update theme class
  document.getElementById('app').className = state.theme;

  // Update theme icon
  dom.themeBtn.innerHTML = getThemeIcon();

  // Update amount input value (no focus loss — same element)
  if (document.activeElement !== dom.amtInput) {
    dom.amtInput.value = state.baseAmount;
  }

  // Update base trigger
  const baseIcon = getIcon(state.baseCurrency);
  const baseName = getDisplayName(state.baseCurrency);
  dom.baseTrigger.innerHTML =
    `${baseIcon} <span class="curr-code">${baseName}</span>` +
    `<svg class="chev" viewBox="0 0 24 24" width="12" height="12"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

  // Update target trigger
  const targetIcon = getIcon(state.targetCurrency);
  const targetName = getDisplayName(state.targetCurrency);
  dom.targetTrigger.innerHTML =
    `${targetIcon} <span class="curr-code">${targetName}</span>` +
    `<svg class="chev" viewBox="0 0 24 24" width="12" height="12"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

  // Rebuild steps
  rebuildSteps();

  // Calculate result
  const calc = calculateFull(state.baseCurrency, state.steps, state.targetCurrency, state.baseAmount);
  dom.resultLabel.textContent = `→ ${getDisplayName(state.targetCurrency)}`;
  dom.resultValue.textContent = formatAmt(calc.final);

  // Rebuild breakdown
  rebuildBreakdown(state.baseCurrency, state.steps, state.targetCurrency, state.baseAmount);

  // Update timestamp
  if (state.lastUpdated) {
    dom.lastUpdated.textContent = 'Updated: ' + state.lastUpdated.toLocaleTimeString();
  }
}

// ---------- REBUILD STEPS ----------
function rebuildSteps() {
  const container = dom.stepsContainer;
  container.innerHTML = '';
  state.steps.forEach((code, i) => {
    const row = ce('div', 'curr-row step-row');
    const labelSpan = ce('span', 'curr-label', 'Step ' + (i + 1));
    const removeBtn = ce('button', 'remove-step', '×');
    removeBtn.dataset.action = 'removeStep';
    removeBtn.dataset.stepIndex = i;
    removeBtn.setAttribute('aria-label', 'Remove step ' + (i + 1));
    labelSpan.appendChild(removeBtn);

    const trigger = ce('button', 'curr-trigger', '');
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
function rebuildBreakdown(from, steps, to, amount) {
  const bd = dom.breakdown;
  bd.innerHTML = '';
  if (steps.length === 0) return;
  bd.style.display = '';

  let prev = from;
  let amt = amount;
  for (const cur of steps) {
    amt = amt * usdPrice(prev) / usdPrice(cur);
    const row = ce('div', 'breakdown-row');
    row.innerHTML = `<span>${getIcon(cur)} ${getDisplayName(cur)}</span><span>${formatAmt(amt)}</span>`;
    bd.appendChild(row);
    prev = cur;
  }
  // Final
  amt = amt * usdPrice(prev) / usdPrice(to);
  const row = ce('div', 'breakdown-row final');
  row.innerHTML = `<span>${getIcon(to)} ${getDisplayName(to)}</span><span>${formatAmt(amt)}</span>`;
  bd.appendChild(row);
}

// ---------- DROPDOWN (standalone, manages its own DOM) ----------
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

  // Keyboard navigation
  search.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightIndex = Math.min(highlightIndex + 1, filteredItems.length - 1);
      renderList(search.value);
      // Scroll into view
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

  // Stop propagation so global input handler doesn't fire
  search.addEventListener('input', (e) => e.stopPropagation());
  search.addEventListener('keydown', (e) => e.stopPropagation());

  // Focus search
  setTimeout(() => search.focus(), 50);

  // Close on overlay click
  ddOverlay.addEventListener('pointerdown', (e) => {
    if (e.target === ddOverlay) closeDropdown();
  });

  // Global Escape — clean up on close
  const escHandler = (e) => { if (e.key === 'Escape') closeDropdown(); };
  document.addEventListener('keydown', escHandler);

  // Override closeDropdown to clean up
  const origClose = closeDropdown;
  closeDropdown = function() {
    document.removeEventListener('keydown', escHandler);
    origClose();
    // Restore original for next open
    closeDropdown = origClose;
  };
}

function closeDropdown() {
  if (ddOverlay && ddOverlay.parentNode) ddOverlay.parentNode.removeChild(ddOverlay);
  ddOverlay = null;
  dropdownActive = false;
}

function selectItem(role, id, stepIndex) {
  if (role === 'base') state.baseCurrency = id;
  else if (role === 'target') state.targetCurrency = id;
  else if (role === 'step' && stepIndex !== null) state.steps[stepIndex] = id;
  updateResult();
}

// ---------- EVENT BINDING (once) ----------
function bindEvents() {
  // Amount input
  dom.amtInput.addEventListener('input', () => {
    const v = parseFloat(dom.amtInput.value);
    if (isNaN(v)) state.baseAmount = 0;
    else if (v < 0) state.baseAmount = 0;
    else state.baseAmount = v;
    updateResult();
  });

  // Swap
  document.querySelector('[data-action="swap"]').addEventListener('click', () => {
    [state.baseCurrency, state.targetCurrency] = [state.targetCurrency, state.baseCurrency];
    updateResult();
  });

  // Add step
  dom.addBtn.addEventListener('click', () => {
    state.steps.push('GBP');
    updateResult();
  });

  // Theme toggle
  dom.themeBtn.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.getElementById('app').className = state.theme;
    dom.themeBtn.innerHTML = getThemeIcon();
  });

  // Remove step (delegation on steps container)
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
    const trigger = e.target.closest('.curr-trigger');
    if (!trigger) return;
    const role = trigger.dataset.role;
    const stepIndex = trigger.dataset.stepIndex !== undefined ? parseInt(trigger.dataset.stepIndex) : null;
    const code = role === 'base' ? state.baseCurrency
      : role === 'target' ? state.targetCurrency
      : state.steps[stepIndex] || 'USD';
    showDropdown(role, code, stepIndex);
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
