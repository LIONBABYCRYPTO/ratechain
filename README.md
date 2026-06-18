# RateChain

Multi-step currency and cryptocurrency converter with live rates, chain conversion, and intermediate steps.

![RateChain screenshot](screenshot.png)

## Features

- **Live fiat rates** via [Frankfurter API](https://api.frankfurter.dev)
- **Crypto prices** via [CoinGecko API](https://www.coingecko.com/en/api)
- **Multi-step chain conversion** — convert through multiple currencies/cryptos in one chain
- **Searchable dropdowns** with flag emojis for fiat and CoinGecko icons for crypto
- **Dark/light theme** with animated toggle
- **Swap, add/remove steps** interactively
- **Local caching** — rates cached for 5 minutes
- **Zero dependencies** — pure vanilla HTML/CSS/JS

## Live Demo

https://lionbabycrypto.github.io/ratechain/

## Run Locally

```bash
# Clone the repo
git clone https://github.com/lionbabycrypto/ratechain.git
cd ratechain

# Open in browser (no build step needed)
open index.html
```

Or serve with any static server:

```bash
python3 -m http.server 8000
# Then open http://localhost:8000
```

## How It Works

1. Enter an amount in the base currency
2. Select the target currency
3. Optionally add intermediate steps for multi-hop conversions
4. The result updates instantly

Conversion formula: `amount × usdPrice(origin) / usdPrice(target)`

For multi-step: each intermediate currency shows its converted amount using the same formula applied sequentially.

## License

MIT
