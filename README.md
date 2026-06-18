# RateChain

Multi-step currency and cryptocurrency converter with live rates, chain conversion, and intermediate steps.

**Live:** https://lionbabycrypto.github.io/ratechain/

## Features

- **Live fiat rates** via [Frankfurter API](https://frankfurter.dev) — 164 currencies
- **Crypto prices** via [CoinGecko API](https://www.coingecko.com/en/api) — top 100 coins
- **Multi-step chain conversion** — convert through multiple currencies/cryptos in one chain
- **Searchable dropdowns** with flag emojis (fiat) + CoinGecko icons (crypto), keyboard arrow nav, Enter selection, Escape to close
- **Dark/light theme** with animated toggle
- **Swap, add/remove steps** interactively
- **Local caching** — rates cached 5 min in localStorage
- **Responsive** — 320px to 1920px, touch targets for mobile
- **Zero dependencies** — pure vanilla HTML/CSS/JS, no frameworks

## Usage

1. Enter an amount
2. Tap "From" or "To" to select currencies — start typing to search
3. Tap "+ Add intermediate step" for multi-hop chains
4. Tap swap icon (↕) to invert base/target
5. Dark/light toggle in top-right corner

## Run Locally

```bash
git clone https://github.com/lionbabycrypto/ratechain.git
cd ratechain
open index.html
```

Or serve locally:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Tech

- **Fiat rates:** Frankfurter v2 (`GET /v2/rates?base=USD`)
- **Crypto prices:** CoinGecko (`/coins/markets?vs_currency=usd`)
- **Conversion:** `amount × usdPrice(from) / usdPrice(to)` per hop

## License

MIT
