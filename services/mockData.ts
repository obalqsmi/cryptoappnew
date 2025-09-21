/**
 * Mock Data Service: Provides fallback data for the application.
 * This is crucial for offline development, testing, and ensuring the app
 * remains functional if the CoinGecko API is unavailable.
 */
import { Token } from '../types/market';

function generateSparkline(price: number): number[] {
  const data = [];
  let currentPrice = price;
  for (let i = 0; i < 168; i++) { // 7 days * 24 hours
    data.push(currentPrice);
    const change = (Math.random() - 0.5) * (price * 0.02);
    currentPrice += change;
  }
  return data;
}

export const MOCK_TOKENS: Token[] = [
  {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1696501400',
    current_price: 68000.0,
    market_cap: 1.3e12,
    price_change_percentage_24h: 1.5,
    sparkline_in_7d: { price: generateSparkline(68000.0) },
  },
  {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1696501638',
    current_price: 3500.0,
    market_cap: 420e9,
    price_change_percentage_24h: -2.1,
    sparkline_in_7d: { price: generateSparkline(3500.0) },
  },
  {
    id: 'solana',
    symbol: 'sol',
    name: 'Solana',
    image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png?1696504756',
    current_price: 150.0,
    market_cap: 69e9,
    price_change_percentage_24h: 5.8,
    sparkline_in_7d: { price: generateSparkline(150.0) },
  },
  {
    id: 'dogecoin',
    symbol: 'doge',
    name: 'Dogecoin',
    image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png?1696501409',
    current_price: 0.15,
    market_cap: 21e9,
    price_change_percentage_24h: 0.5,
    sparkline_in_7d: { price: generateSparkline(0.15) },
  },
];

export const MOCK_HISTORY = {
  prices: MOCK_TOKENS[0].sparkline_in_7d.price.map((p, i) => [Date.now() - (168 - i) * 3600 * 1000, p]),
};

