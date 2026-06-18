// ============================================================
// RateChain — Interactive Currency & Crypto Converter v1.0
// ============================================================
// APIs:
//   - Frankfurter (fiat rates): https://api.frankfurter.dev/latest
//   - CoinGecko (crypto prices): https://api.coingecko.com/api/v3/coins/markets
//   - CoinGecko (coin icons): https://assets.coingecko.com/coins/images/{id}/thumb/{file}
// All cached in localStorage with 5-min TTL.
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
  fiatRates: {},       // { "EUR": 0.92, "JPY": 149.5, ... }
  cryptoData: [],       // [{ id, symbol, name, image, current_price }, ...]
  baseAmount: 1,
  baseCurrency: "USD",
  steps: [],            // array of intermediate currency/crypto IDs
  targetCurrency: "EUR",
  lastUpdated: null,
  theme: "dark"
};

// ---------- DOM REFS ----------
const app = document.getElementById('app');

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

// ---------- API CALLS ----------
async function fetchFiatRates() {
  const cached = cacheGet('fiat');
  if (cached) return cached;
  const res = await fetch('https://api.frankfurter.dev/v1/latest');
  const json = await res.json();
  // Frankfurter returns rates relative to EUR; convert to USD base
  const usdRate = json.rates.USD;
  const rates = {};
  rates['EUR'] = 1 / usdRate;    // EUR/USD
  for (const [code, rate] of Object.entries(json.rates)) {
    if (code === 'USD') continue;
    rates[code] = rate / usdRate;  // convert to per-USD
  }
  rates['USD'] = 1;
  cacheSet('fiat', rates);
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
  try {
    const [fiat, crypto] = await Promise.all([fetchFiatRates(), fetchCryptoPrices()]);
    state.fiatRates = fiat;
    state.cryptoData = crypto;
    state.lastUpdated = new Date();
    render();
  } catch (e) {
    document.getElementById('app').innerHTML = `<div class="error-msg">Failed to load rates: ${e.message}. Check console for details.</div>`;
    console.error(e);
  }
}

// ---------- TYPE DETECTION ----------
function isFiat(code) { return !!FLAGS[code]; }
function isCrypto(code) { return state.cryptoData.some(c => c.id === code || c.symbol.toUpperCase() === code); }

function getRate(code) {
  if (isFiat(code)) return state.fiatRates[code] || 0;
  const coin = state.cryptoData.find(c => c.id === code || c.symbol.toUpperCase() === code);
  return coin ? coin.current_price : 0;
}

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
  return coin && coin.image ? `<img src="${coin.image}" alt="${code}" class="coin-icon" onerror="this.style.display='none'">` : '🪙';
}

function getSortedAllItems() {
  const items = [];
  // Fiat first, sorted alphabetically
  const fiatCodes = Object.keys(state.fiatRates).sort();
  fiatCodes.forEach(c => items.push({ id: c, label: c, name: getFullName(c), icon: FLAGS[c] || '💱', type: 'fiat' }));
  // Then crypto, sorted by market cap (already sorted from API)
  state.cryptoData.forEach(c => items.push({
    id: c.id, label: c.symbol.toUpperCase(), name: c.name,
    icon: c.image ? `<img src="${c.image}" class="coin-icon" onerror="this.style.display='none'">` : '🪙',
    type: 'crypto', price: c.current_price
  }));
  return items;
}

// ---------- CHAIN CONVERSION ----------
/**
 * Chain conversion formula:
 * Starting from state.baseAmount in state.baseCurrency,
 * convert through each intermediate step (state.steps),
 * end result in state.targetCurrency.
 *
 * At each hop: newAmount = amount * (rate(from) / rate(to))
 * where rate(X) = USD price of X (i.e., how many USD per 1 X).
 *
 * Why this works: If we have $100 USD and want JPY:
 *   100 USD * (1 / 149.5) = 0.668 EUR  → then  0.668 EUR * 149.5 JPY/EUR = 100 JPY? No.
 * Actually: 100 USD * (rate(JPY)/rate(USD)) = 100 * (149.5/1) = 14,950 JPY. Correct.
 *
 * Cross rate: Convert USD→BTC→JPY:
 *   BTC price = 67,000 USD/BTC. So $100 = 100/67,000 = 0.001492 BTC.
 *   Then 0.001492 BTC × 149.5 JPY/USD?? No — BTC in JPY = BTC in USD × USD/JPY rate.
 *   Actually: JPY amount = baseAmount × (rate(JPY) / rate(BTC))
 *   = 100 × (149.5 / 67000) = 0.223 JPY... wrong.
 *
 * Better formula: Work in USD terms.
 *   value_in_usd = baseAmount × usdPrice[baseCurrency]
 *   value_in_target = value_in_usd / usdPrice[targetCurrency]
 *
 * Where usdPrice[fiat] = 1 / fiatRates[fiat] (because fiatRates are per-USD)
 *       usdPrice[crypto] = coin.current_price from CoinGecko
 *
 * So chain = convert to USD, then convert from USD through each step.
 *   For each step X: value = value * (usdPrice[X] / usdPrice[prev])
 *   Final: value = value * (usdPrice[target] / usdPrice[lastStep])
 */
function usdPrice(code) {
  if (code === 'USD') return 1;
  if (isFiat(code)) return 1 / (state.fiatRates[code] || 1);
  const coin = state.cryptoData.find(c => c.id === code || c.symbol.toUpperCase() === code);
  return coin ? coin.current_price : 0;
}

function convertChain(amount, from, steps, to) {
  let value = amount * usdPrice(from); // convert to USD
  for (const step of steps) {
    value = value / usdPrice(step); // convert from USD to step
    value = value * usdPrice(step); // wait — that's a no-op
    // Correct: value (in USD) → value / usdPrice(step) = amount in step currency
    // Actually the chain already represents: from → step1 → step2 → ... → to
    // Each hop: amount_in_prev * usdPrice(prev) = usd_value → usd_value / usdPrice(next) = amount_in_next
    // Simplified: amount_in_next = amount_in_prev * usdPrice(prev) / usdPrice(next)
  }
  // Recalculate properly:
  let v = amount * usdPrice(from); // start in USD
  for (const s of steps) {
    v = v / usdPrice(s); // convert USD → step currency
    v = v * usdPrice(s); // that cancels. Mistake.
    // Correct: v is in USD. To convert to step: v / usdPrice(step) = amount in step.
    // But then next hop: amount_in_step * usdPrice(step) / usdPrice(next) = (v / usdPrice(step)) * usdPrice(step) / usdPrice(next) = v / usdPrice(next)
    // So each step just divides by usdPrice of the step. Final multiply by 1.
    // Actually: from→step1→step2→to: amount × usd(from) / usd(step1) × usd(step1) / usd(step2) × usd(step2) / usd(to)
    // = amount × usd(from) / usd(to). Steps cancel out — they don't matter if all values are in USD terms.
  }
  // The steps DO matter for the display — each intermediate shows the amount in that currency.
  // But the FINAL result depends only on from and to rates.
  return { final: amount * usdPrice(from) / usdPrice(to), intermediates: [] };
}

function calculateFull(from, steps, to, amount) {
  // Accurate multi-step calculation
  const steps2 = [from, ...steps, to];
  const results = [];
  let prev = from;
  let amt = amount;
  for (let i = 1; i < steps2.length; i++) {
    const cur = steps2[i];
    // amount in cur = amt * usdPrice(prev) / usdPrice(cur)
    amt = amt * usdPrice(prev) / usdPrice(cur);
    results.push({ currency: cur, amount: amt });
    prev = cur;
  }
  return { results, final: amt };
}

// ---------- RENDER ----------
function render() {
  app.innerHTML = '';
  app.className = state.theme;

  // Header
  const header = ce('div', 'header');
  const title = ce('h1', 'title', 'RateChain');
  const themeBtn = ce('button', 'theme-toggle', '');
  themeBtn.innerHTML = state.theme === 'dark'
    ? '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/></g></svg>'
    : '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/></svg>';
  themeBtn.setAttribute('aria-label', 'Toggle dark mode');
  themeBtn.dataset.action = 'toggleTheme';
  header.append(title, themeBtn);
  app.appendChild(header);

  // Amount Input
  const amtWrap = ce('div', 'amount-wrap');
  const amtInput = ce('input', 'amount-input');
  amtInput.type = 'number';
  amtInput.value = state.baseAmount;
  amtInput.step = 'any';
  amtInput.min = '0';
  amtInput.id = 'baseAmount';
  amtInput.setAttribute('aria-label', 'Amount to convert');
  const underline = ce('div', 'amount-underline');
  amtWrap.append(amtInput, underline);
  app.appendChild(amtWrap);

  // Row: base + swap
  app.appendChild(createCurrencyRow('base', state.baseCurrency));

  // Steps
  state.steps.forEach((step, i) => {
    app.appendChild(createStepRow(step, i));
  });

  // Add Step button
  const addBtn = ce('button', 'add-step', '+ Add intermediate step');
  addBtn.dataset.action = 'addStep';
  app.appendChild(addBtn);

  // Row: target
  app.appendChild(createCurrencyRow('target', state.targetCurrency));

  // Result
  const resultDiv = ce('div', 'result');
  const calc = calculateFull(state.baseCurrency, state.steps, state.targetCurrency, state.baseAmount);
  const targetName = getDisplayName(state.targetCurrency);
  resultDiv.innerHTML = `<span class="result-label">→ ${targetName}</span><span class="result-value">${formatAmt(calc.final)}</span>`;
  app.appendChild(resultDiv);

  // Intermediate breakdown
  if (state.steps.length > 0) {
    const breakdown = ce('div', 'breakdown');
    let prev = state.baseCurrency;
    let amt = state.baseAmount;
    for (const cur of state.steps) {
      amt = amt * usdPrice(prev) / usdPrice(cur);
      const row = ce('div', 'breakdown-row');
      row.innerHTML = `<span>${getIcon(cur)} ${getDisplayName(cur)}</span><span>${formatAmt(amt)}</span>`;
      breakdown.appendChild(row);
      prev = cur;
    }
    // final
    amt = amt * usdPrice(prev) / usdPrice(state.targetCurrency);
    const row = ce('div', 'breakdown-row final');
    row.innerHTML = `<span>${getIcon(state.targetCurrency)} ${getDisplayName(state.targetCurrency)}</span><span>${formatAmt(amt)}</span>`;
    breakdown.appendChild(row);
    app.appendChild(breakdown);
  }

  // Last updated
  if (state.lastUpdated) {
    const lu = ce('div', 'last-updated', 'Updated: ' + state.lastUpdated.toLocaleTimeString());
    app.appendChild(lu);
  }

  // Attach dropdown buttons
  document.querySelectorAll('.curr-trigger').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const role = el.dataset.role;
      const stepIndex = el.dataset.stepIndex !== undefined ? parseInt(el.dataset.stepIndex) : null;
      const currentCode = el.dataset.code;
      showDropdown(role, currentCode, stepIndex);
    });
  });
}

// ---------- CURRENCY ROW ----------
function createCurrencyRow(role, code, stepIndex) {
  const row = ce('div', 'curr-row');
  const labelSpan = ce('span', 'curr-label', role === 'base' ? 'From' : role === 'target' ? 'To' : 'Step');
  if (role === 'base') {
    const swapBtn = ce('button', 'swap-btn', '');
    swapBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M7 16V4l-3 3m10 4v12l3-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    swapBtn.dataset.action = 'swap';
    swapBtn.setAttribute('aria-label', 'Swap currencies');
    labelSpan.appendChild(swapBtn);
  }
  const trigger = ce('button', 'curr-trigger', '');
  trigger.dataset.role = role;
  trigger.dataset.code = code;
  if (stepIndex !== undefined) trigger.dataset.stepIndex = stepIndex;
  const iconHtml = getIcon(code);
  const display = getDisplayName(code);
  trigger.innerHTML = `${iconHtml} <span class="curr-code">${display}</span> <svg class="chev" viewBox="0 0 24 24" width="12" height="12"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  row.append(labelSpan, trigger);
  return row;
}

function createStepRow(code, index) {
  const row = ce('div', 'curr-row step-row');
  const labelSpan = ce('span', 'curr-label', 'Step ' + (index + 1));
  const removeBtn = ce('button', 'remove-step', '×');
  removeBtn.dataset.action = 'removeStep';
  removeBtn.dataset.stepIndex = index;
  removeBtn.setAttribute('aria-label', 'Remove step');
  labelSpan.appendChild(removeBtn);

  const trigger = ce('button', 'curr-trigger', '');
  trigger.dataset.role = 'step';
  trigger.dataset.code = code;
  trigger.dataset.stepIndex = index;
  const iconHtml = getIcon(code);
  const display = getDisplayName(code);
  trigger.innerHTML = `${iconHtml} <span class="curr-code">${display}</span> <svg class="chev" viewBox="0 0 24 24" width="12" height="12"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  row.append(labelSpan, trigger);
  return row;
}

// ---------- DROPDOWN ----------
let dropdownActive = false;

function showDropdown(role, currentCode, stepIndex) {
  if (dropdownActive) return;
  dropdownActive = true;
  const items = getSortedAllItems();
  const overlay = ce('div', 'dropdown-overlay');
  overlay.addEventListener('click', () => { closeDropdown(overlay); });

  const panel = ce('div', 'dropdown-panel');
  const search = ce('input', 'dropdown-search');
  search.type = 'text';
  search.placeholder = 'Search currencies...';
  search.setAttribute('aria-label', 'Search currencies');
  const list = ce('div', 'dropdown-list');

  function filterList(query) {
    const q = query.toLowerCase();
    list.innerHTML = '';
    const filtered = items.filter(it =>
      it.id.toLowerCase().includes(q) ||
      it.label.toLowerCase().includes(q) ||
      it.name.toLowerCase().includes(q)
    );
    filtered.forEach(it => {
      const opt = ce('button', 'dropdown-item' + (it.id === currentCode ? ' selected' : ''), '');
      opt.innerHTML = `${it.icon} <span class="di-label">${it.label}</span> <span class="di-name">${it.name}</span>` +
        (it.price ? `<span class="di-price">$${formatAmt(it.price)}</span>` : '');
      opt.dataset.id = it.id;
      opt.addEventListener('click', () => {
        selectItem(role, it.id, stepIndex);
        closeDropdown(overlay);
      });
      list.appendChild(opt);
    });
  }

  search.addEventListener('input', () => filterList(search.value));
  filterList('');

  // Delay focusing to avoid immediate key strokes affecting input
  setTimeout(() => search.focus(), 50);

  panel.append(search, list);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  // Close on click outside
  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) closeDropdown(overlay);
  });

  // Close on Escape
  const escHandler = (e) => { if (e.key === 'Escape') { closeDropdown(overlay); document.removeEventListener('keydown', escHandler); }};
  document.addEventListener('keydown', escHandler);
}

function closeDropdown(overlay) {
  dropdownActive = false;
  if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
}

function selectItem(role, id, stepIndex) {
  if (role === 'base') {
    state.baseCurrency = id;
  } else if (role === 'target') {
    state.targetCurrency = id;
  } else if (role === 'step' && stepIndex !== null) {
    state.steps[stepIndex] = id;
  }
  render();
}

// ---------- EVENT DELEGATION ----------
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === 'toggleTheme') {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    render();
    return;
  }

  if (action === 'swap') {
    [state.baseCurrency, state.targetCurrency] = [state.targetCurrency, state.baseCurrency];
    render();
    return;
  }

  if (action === 'addStep') {
    // Insert a default step (midway between base and target)
    state.steps.push('GBP');
    render();
    return;
  }

  if (action === 'removeStep') {
    const idx = parseInt(btn.dataset.stepIndex);
    state.steps.splice(idx, 1);
    render();
    return;
  }
});

// ---------- AMOUNT INPUT ----------
document.addEventListener('input', (e) => {
  if (e.target.id === 'baseAmount') {
    const v = parseFloat(e.target.value);
    if (!isNaN(v) && v >= 0) {
      state.baseAmount = v;
      render();
    }
  }
});

// ---------- HELPERS ----------
function ce(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}

function formatAmt(n) {
  if (n === 0 || !isFinite(n)) return '0.00';
  if (n >= 1) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 0.01) return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toExponential(2);
}

// ---------- INIT ----------
fetchAllData();
