const axios = require("axios");

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

const COIN_IDS = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  SOL: "solana",
  MATIC: "polygon",
  USDT: "tether",
  USDC: "usd-coin",
  BUSD: "binance-usd",
  DAI: "dai",
};

const FIAT_CURRENCIES = ["NGN", "USD", "EUR", "GBP"];

let cache = {};
const CACHE_TTL = 60000;

exports.getPrice = async (coinSymbol, vsCurrency = "USD") => {
  try {
    const coinId = COIN_IDS[coinSymbol.toUpperCase()];
    if (!coinId) throw new Error(`Unsupported coin: ${coinSymbol}`);

    const cacheKey = `${coinId}_${vsCurrency}`;
    if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
      return cache[cacheKey].price;
    }

    const { data } = await axios.get(`${COINGECKO_BASE}/simple/price`, {
      params: {
        ids: coinId,
        vs_currencies: vsCurrency.toLowerCase(),
      },
    });

    const price = data[coinId]?.[vsCurrency.toLowerCase()];
    if (!price) throw new Error(`No price data for ${coinSymbol}/${vsCurrency}`);

    cache[cacheKey] = { price, timestamp: Date.now() };
    return price;
  } catch (err) {
    const cached = cache[`${COIN_IDS[coinSymbol.toUpperCase()]}_${vsCurrency}`];
    if (cached) return cached.price;
    throw err;
  }
};

exports.getPrices = async (coinSymbols, vsCurrency = "USD") => {
  try {
    const ids = coinSymbols.map(s => COIN_IDS[s.toUpperCase()]).filter(Boolean);
    if (ids.length === 0) throw new Error("No supported coins");

    const { data } = await axios.get(`${COINGECKO_BASE}/simple/price`, {
      params: {
        ids: ids.join(","),
        vs_currencies: vsCurrency.toLowerCase(),
      },
    });

    const result = {};
    for (const [sym, id] of Object.entries(COIN_IDS)) {
      if (data[id]) {
        result[sym] = data[id][vsCurrency.toLowerCase()];
        cache[`${id}_${vsCurrency}`] = { price: result[sym], timestamp: Date.now() };
      }
    }
    return result;
  } catch (err) {
    const result = {};
    for (const sym of coinSymbols) {
      const cached = cache[`${COIN_IDS[sym.toUpperCase()]}_${vsCurrency}`];
      if (cached) result[sym] = cached.price;
    }
    return result;
  }
};

exports.convertFiat = async (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return amount;
  const { data } = await axios.get(`${COINGECKO_BASE}/simple/price`, {
    params: {
      ids: "usd",
      vs_currencies: [fromCurrency, toCurrency].join(",").toLowerCase(),
    },
  });
  const fromRate = data.usd?.[fromCurrency.toLowerCase()];
  const toRate = data.usd?.[toCurrency.toLowerCase()];
  if (!fromRate || !toRate) throw new Error("Currency conversion rate unavailable");
  return (amount / fromRate) * toRate;
};

exports.getCryptoFiatRate = async (coinSymbol, fiatCurrency = "NGN") => {
  const price = await exports.getPrice(coinSymbol, fiatCurrency);
  return price;
};

exports.supportedCoins = () => Object.keys(COIN_IDS);

exports.supportedFiats = () => [...FIAT_CURRENCIES];
