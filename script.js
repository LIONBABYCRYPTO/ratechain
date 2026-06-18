// ============================================================
// RateChain v3.0 — Calculator-style currency/crypto converter
// ============================================================
// APIs: Frankfurter v2 + CoinGecko. 5-min localStorage cache.
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
  fiatRates: {},
  cryptoData: [],
  baseAmount: 1,
  baseCurrency: "USD",
  steps: [],
  targetCurrency: "SGD",
  lastUpdated: null,
  theme: "dark",
  // Calculator mode: typing new number or editing
  calcBuffer: "",
  calcNewEntry: true
};

const dom = {};
let isRendered = false;

// ---------- CACHE ----------
const CACHE_TTL = 300000;
function cacheGet(key) {
  try {
    const raw = localStorage.getItem('rc_' + key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL) { localStorage.removeItem('rc_' + key); return null; }
    return entry.data;
  } catch { return null; }
}
function cacheSet(key, data) {
  try { localStorage.setItem('rc_' + key, JSON.stringify({ data, ts: Date.now() })); } catch {}
}
try { localStorage.removeItem('rc_fiat'); } catch {}

// ---------- API ----------
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

function showLoading() {
  const root = document.getElementById('app');
  root.innerHTML =
    '<div class="loading-screen"><div class="loading-spinner"></div><span>Loading rates…</span></div>';
}

// ---------- TYPE HELPERS ----------
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

function usdPrice(code) {
  if (code === 'USD') return 1;
  if (isFiat(code) && state.fiatRates[code]) return 1 / state.fiatRates[code];
  const coin = state.cryptoData.find(c => c.id === code || c.symbol.toUpperCase() === code);
  return coin ? coin.current_price : 0;
}

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

  // Header
  dom.header = ce('div', 'header');
  dom.title = ce('h1', 'title', 'RateChain');
  dom.themeBtn = ce('button', 'theme-toggle', '');
  dom.themeBtn.setAttribute('aria-label', 'Toggle dark mode');
  dom.themeBtn.innerHTML = getThemeIcon();
  dom.header.append(dom.title, dom.themeBtn);
  root.appendChild(dom.header);

  // Display
  dom.displayWrap = ce('div', 'display-wrap');
  dom.display = ce('input', 'display-amount');
  dom.display.type = 'number';
  dom.display.value = state.baseAmount;
  dom.display.step = 'any';
  dom.display.min = '0';
  dom.display.setAttribute('aria-label', 'Amount');
  dom.display.autocomplete = 'off';
  dom.display.readOnly = true;
  dom.displayUnderline = ce('div', 'display-underline');
  dom.displayWrap.append(dom.display, dom.displayUnderline);
  root.appendChild(dom.displayWrap);

  // Currency bar
  dom.currBar = ce('div', 'curr-bar');
  dom.basePill = ce('button', 'curr-pill', '');
  dom.arrow = ce('span', 'curr-bar-arrow', '→');
  dom.targetPill = ce('button', 'curr-pill', '');
  dom.currBar.append(dom.basePill, dom.arrow, dom.targetPill);
  root.appendChild(dom.currBar);

  // Steps
  dom.stepsRow = ce('div', 'steps-row');
  dom.stepsRow.id = 'stepsRow';
  root.appendChild(dom.stepsRow);

  // Result
  dom.resultDiv = ce('div', 'result');
  dom.resultLabel = ce('span', 'result-label', '→ SGD');
  dom.resultValue = ce('span', 'result-value', '0.00');
  dom.resultDiv.append(dom.resultLabel, dom.resultValue);
  root.appendChild(dom.resultDiv);

  // Breakdown
  dom.breakdown = ce('div', 'breakdown');
  dom.breakdown.id = 'breakdown';
  root.appendChild(dom.breakdown);

  // Keypad
  buildKeypad(root);

  // Last updated
  dom.lastUpdated = ce('div', 'last-updated');
  root.appendChild(dom.lastUpdated);

  bindEvents();
}

// ---------- KEYPAD ----------
const KEYS = [
  { label: 'C', cls: 'fn', action: 'clear' },
  { label: '±', cls: 'fn', action: 'negate' },
  { label: '⌫', cls: 'fn', action: 'backspace' },
  { label: '+', cls: 'op', action: 'addStep' },
  { label: '7', cls: '', action: 'digit' },
  { label: '8', cls: '', action: 'digit' },
  { label: '9', cls: '', action: 'digit' },
  { label: '+', cls: 'op', action: 'addStep2' },
  { label: '4', cls: '', action: 'digit' },
  { label: '5', cls: '', action: 'digit' },
  { label: '6', cls: '', action: 'digit' },
  { label: '−', cls: 'op', action: 'removeStep' },
  { label: '1', cls: '', action: 'digit' },
  { label: '2', cls: '', action: 'digit' },
  { label: '3', cls: '', action: 'digit' },
  { label: '↔', cls: 'op', action: 'swap' },
  { label: '0', cls: 'zero', action: 'digit' },
  { label: '.', cls: '', action: 'decimal' },
  { label: '=', cls: 'eq', action: 'equals' },
];

function buildKeypad(root) {
  const keypad = ce('div', 'keypad');
  KEYS.forEach(k => {
    const btn = document.createElement('button');
    btn.className = 'key' + (k.cls ? ' ' + k.cls : '');
    btn.textContent = k.label;
    btn.dataset.action = k.action;
    btn.dataset.digit = k.action === 'digit' ? k.label : '';
    keypad.appendChild(btn);
  });
  dom.keypad = keypad;
  root.appendChild(keypad);
}

// ---------- CALCULATOR ACTIONS ----------
function calcInput(digit) {
  if (state.calcNewEntry) {
    state.calcBuffer = digit;
    state.calcNewEntry = false;
  } else {
    state.calcBuffer += digit;
  }
  commitBuffer();
}

function calcDecimal() {
  if (state.calcNewEntry) {
    state.calcBuffer = '0.';
    state.calcNewEntry = false;
  } else if (!state.calcBuffer.includes('.')) {
    state.calcBuffer += '.';
  }
  commitBuffer();
}

function calcBackspace() {
  if (state.calcNewEntry) return;
  state.calcBuffer = state.calcBuffer.slice(0, -1);
  if (state.calcBuffer === '' || state.calcBuffer === '-') {
    state.calcBuffer = '0';
    state.calcNewEntry = true;
  }
  commitBuffer();
}

function calcClear() {
  state.calcBuffer = '';
  state.calcNewEntry = true;
  state.baseAmount = 0;
  dom.display.value = '0';
  updateResult();
}

function calcNegate() {
  if (state.calcBuffer.startsWith('-')) {
    state.calcBuffer = state.calcBuffer.slice(1);
  } else if (state.calcBuffer !== '0') {
    state.calcBuffer = '-' + state.calcBuffer;
  }
  commitBuffer();
}

function commitBuffer() {
  const v = parseFloat(state.calcBuffer);
  if (isNaN(v)) state.baseAmount = 0;
  else state.baseAmount = v;
  dom.display.value = state.calcBuffer;
  updateResult();
}

// ---------- UPDATE UI ----------
function updateResult() {
  if (!isRendered) return;

  document.getElementById('app').className = state.theme;
  dom.themeBtn.innerHTML = getThemeIcon();

  // Update display
  if (document.activeElement !== dom.display) {
    dom.display.value = state.calcBuffer || '0';
  }

  // Update pills
  dom.basePill.innerHTML =
    `${getIcon(state.baseCurrency)} <span>${state.baseCurrency}</span><svg class="chev" viewBox="0 0 24 24" width="10" height="10"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  dom.targetPill.innerHTML =
    `${getIcon(state.targetCurrency)} <span>${state.targetCurrency}</span><svg class="chev" viewBox="0 0 24 24" width="10" height="10"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

  // Rebuild steps
  rebuildSteps();

  // Calculate
  const calc = calculateFull(state.baseCurrency, state.steps, state.targetCurrency, state.baseAmount);
  dom.resultLabel.textContent = `→ ${getDisplayName(state.targetCurrency)}`;
  dom.resultValue.textContent = formatAmt(calc.final);

  // Breakdown
  rebuildBreakdown(state.baseCurrency, state.steps, state.targetCurrency, state.baseAmount);

  if (state.lastUpdated) {
    dom.lastUpdated.textContent = 'Updated: ' + state.lastUpdated.toLocaleTimeString();
  }
}

function rebuildSteps() {
  const row = dom.stepsRow;
  row.innerHTML = '';
  if (state.steps.length === 0) {
    row.style.display = 'none';
    return;
  }
  row.style.display = 'flex';
  state.steps.forEach((code, i) => {
    const pill = ce('div', 'step-pill');
    pill.innerHTML =
      `${getIcon(code)} <span>${getDisplayName(code)}</span>`;
    pill.dataset.role = 'step';
    pill.dataset.stepIndex = i;
    const remove = document.createElement('button');
    remove.className = 'step-pill-remove';
    remove.textContent = '×';
    remove.dataset.action = 'removeStep';
    remove.dataset.stepIndex = i;
    pill.appendChild(remove);
    row.appendChild(pill);
  });
}

function rebuildBreakdown(from, steps, to, amount) {
  const bd = dom.breakdown;
  bd.innerHTML = '';
  if (steps.length === 0) { bd.style.display = 'none'; return; }
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
  amt = amt * usdPrice(prev) / usdPrice(to);
  const row = ce('div', 'breakdown-row final');
  row.innerHTML = `<span>${getIcon(to)} ${getDisplayName(to)}</span><span>${formatAmt(amt)}</span>`;
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
      it.id.toLowerCase().includes(q) || it.label.toLowerCase().includes(q) || it.name.toLowerCase().includes(q)
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
      opt.addEventListener('click', () => { selectItem(role, it.id, stepIndex); closeDropdown(); });
      list.appendChild(opt);
    });
  }

  renderList('');

  search.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); highlightIndex = Math.min(highlightIndex + 1, filteredItems.length - 1); renderList(search.value); const h = list.querySelector('.highlighted'); if (h) h.scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlightIndex = Math.max(highlightIndex - 1, 0); renderList(search.value); const h = list.querySelector('.highlighted'); if (h) h.scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'Enter') { e.preventDefault(); if (highlightIndex >= 0 && highlightIndex < filteredItems.length) { selectItem(role, filteredItems[highlightIndex].id, stepIndex); closeDropdown(); } }
    else if (e.key === 'Escape') { closeDropdown(); }
  });
  search.addEventListener('input', () => { highlightIndex = -1; renderList(search.value); });

  panel.append(search, list);
  ddOverlay.appendChild(panel);
  document.body.appendChild(ddOverlay);

  search.addEventListener('input', (e) => e.stopPropagation());
  search.addEventListener('keydown', (e) => e.stopPropagation());
  setTimeout(() => search.focus(), 50);

  ddOverlay.addEventListener('pointerdown', (e) => { if (e.target === ddOverlay) closeDropdown(); });

  const escHandler = (e) => { if (e.key === 'Escape') closeDropdown(); };
  document.addEventListener('keydown', escHandler);
  const origClose = closeDropdown;
  closeDropdown = function() { document.removeEventListener('keydown', escHandler); origClose(); closeDropdown = origClose; };
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

// ---------- EVENT BINDING ----------
function bindEvents() {
  // Keypad delegation
  dom.keypad.addEventListener('click', (e) => {
    const btn = e.target.closest('.key');
    if (!btn) return;
    const action = btn.dataset.action;
    const digit = btn.dataset.digit;
    switch (action) {
      case 'digit': calcInput(digit); break;
      case 'decimal': calcDecimal(); break;
      case 'backspace': calcBackspace(); break;
      case 'clear': calcClear(); break;
      case 'negate': calcNegate(); break;
      case 'swap':
        [state.baseCurrency, state.targetCurrency] = [state.targetCurrency, state.baseCurrency];
        updateResult();
        break;
      case 'addStep':
      case 'addStep2':
        state.steps.push('EUR');
        updateResult();
        break;
      case 'removeStep':
        if (state.steps.length > 0) { state.steps.pop(); updateResult(); }
        break;
      case 'equals':
        // = recalculates, already shown live
        break;
    }
  });

  // Currency pill clicks
  dom.basePill.addEventListener('click', () => showDropdown('base', state.baseCurrency, null));
  dom.targetPill.addEventListener('click', () => showDropdown('target', state.targetCurrency, null));

  // Steps clicks (delegation for step dropdown + remove)
  dom.stepsRow.addEventListener('click', (e) => {
    const remove = e.target.closest('[data-action="removeStep"]');
    if (remove) {
      const idx = parseInt(remove.dataset.stepIndex);
      state.steps.splice(idx, 1);
      updateResult();
      return;
    }
    const pill = e.target.closest('.step-pill');
    if (pill) {
      const idx = parseInt(pill.dataset.stepIndex);
      const code = state.steps[idx] || 'EUR';
      showDropdown('step', code, idx);
    }
  });

  // Theme toggle
  dom.themeBtn.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.getElementById('app').className = state.theme;
    dom.themeBtn.innerHTML = getThemeIcon();
  });

  // Display click to edit
  dom.display.addEventListener('focus', () => {
    dom.display.readOnly = false;
    dom.display.select();
  });
  dom.display.addEventListener('blur', () => {
    dom.display.readOnly = true;
    const v = parseFloat(dom.display.value);
    if (!isNaN(v) && v >= 0) {
      state.baseAmount = v;
      state.calcBuffer = dom.display.value;
      state.calcNewEntry = false;
      updateResult();
    }
  });
  dom.display.addEventListener('input', () => {
    const v = parseFloat(dom.display.value);
    if (!isNaN(v) && v >= 0) {
      state.baseAmount = v;
      state.calcBuffer = dom.display.value;
      state.calcNewEntry = false;
      updateResult();
    }
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
