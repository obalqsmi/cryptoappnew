/**
 * Price Fetching Service: Handles all network requests to the CoinGecko API.
 * It provides functions to fetch market data and historical price charts,
 * normalizes the API response into the app's internal data types, and
 * includes a fallback to mock data to ensure functionality even if the API is down.
 */
import { useAppStore } from '../state/store';
import { Currency, Quote, Token } from '../types/market';
import { BenchmarkPoint, NewsArticle } from '../types/app';
import { MOCK_HISTORY, MOCK_TOKENS } from './mockData';
import { notifyAlert } from './notifications';

const API_BASE = 'https://api.coingecko.com/api/v3';

const fetchWithFallback = async <T>(url: string, fallbackData: T, onError?: () => void): Promise<T> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`API request failed: ${response.status}. Using fallback data.`);
      onError?.();
      return fallbackData;
    }
    return await response.json();
  } catch (error) {
    console.error('Network error during fetch:', error);
    onError?.();
    return fallbackData;
  }
};

export const fetchTopTokens = async (vs_currency: Currency, page: number = 1): Promise<Token[]> => {
  const store = useAppStore.getState();
  store.setTokensLoading(true);
  const url = `${API_BASE}/coins/markets?vs_currency=${vs_currency.toLowerCase()}&order=market_cap_desc&per_page=50&page=${page}` +
    '&sparkline=true&price_change_percentage=24h';
  const rawData = await fetchWithFallback<any[]>(url, MOCK_TOKENS, () => store.setTokensError('Live pricing unavailable. Showing cached data.'));

  const tokens = rawData.map(
    (t: any): Token => ({
      id: t.id,
      symbol: t.symbol,
      name: t.name,
      image: t.image,
      current_price: t.current_price,
      market_cap: t.market_cap,
      price_change_percentage_24h: t.price_change_percentage_24h,
      sparkline_in_7d: t.sparkline_in_7d ?? { price: [] },
    })
  );

  const quotes = tokens.reduce((acc, token) => {
    acc[token.id] = {
      current_price: token.current_price,
      price_change_percentage_24h: token.price_change_percentage_24h,
    } as Quote;
    return acc;
  }, {} as Record<string, Quote>);

  store.setQuotes(quotes);
  store.setTokens(tokens);
  store.setTokensLoading(false);
  store.setTokensError(undefined);

  return tokens;
};

export const fetchTokenHistory = async (
  id: string,
  vs_currency: Currency,
  days: number
): Promise<{ prices: [number, number][] }> => {
  const url = `${API_BASE}/coins/${id}/market_chart?vs_currency=${vs_currency.toLowerCase()}&days=${days}`;
  return fetchWithFallback(url, MOCK_HISTORY);
};

export const fetchBenchmarks = async (walletValue: number, vs_currency: Currency): Promise<BenchmarkPoint[]> => {
  const url = `${API_BASE}/coins/bitcoin/market_chart?vs_currency=${vs_currency.toLowerCase()}&days=30`;
  const ethUrl = `${API_BASE}/coins/ethereum/market_chart?vs_currency=${vs_currency.toLowerCase()}&days=30`;
  const [btcData, ethData] = await Promise.all([
    fetchWithFallback(url, MOCK_HISTORY),
    fetchWithFallback(ethUrl, MOCK_HISTORY),
  ]);

  const benchmarks: BenchmarkPoint[] = btcData.prices.slice(0, 30).map((pricePoint: [number, number], index: number) => {
    const timestamp = pricePoint[0];
    const btc = pricePoint[1];
    const eth = ethData.prices[index]?.[1] ?? btc;
    const simulatedPortfolio = walletValue * (1 + Math.sin(index / 5) * 0.05);
    return { timestamp, portfolio: simulatedPortfolio, btc, eth };
  });

  useAppStore.getState().setBenchmarks(benchmarks);
  return benchmarks;
};

export const fetchNews = async (): Promise<NewsArticle[]> => {
  const fallback: NewsArticle[] = [
    {
      id: 'news-btc',
      title: 'Bitcoin approaches new highs as institutions accumulate',
      source: 'CoinDesk',
      url: 'https://www.coindesk.com',
      publishedAt: new Date().toISOString(),
      summary: 'Institutional inflows continue to push BTC towards yearly highs as volatility drops.',
    },
    {
      id: 'news-eth',
      title: 'Ethereum developers unveil major upgrade roadmap',
      source: 'The Block',
      url: 'https://www.theblock.co',
      publishedAt: new Date().toISOString(),
      summary: 'Proto-danksharding and account abstraction headlines the next wave of Ethereum upgrades.',
    },
  ];

  const url = `${API_BASE}/news?category=crypto`;
  const articles = await fetchWithFallback<{ data?: any[] }>(url, { data: [] });
  const normalized = (articles.data ?? fallback).map((article: any, index) => ({
    id: article.id ?? fallback[index % fallback.length].id,
    title: article.title ?? fallback[index % fallback.length].title,
    source: article.source ?? fallback[index % fallback.length].source,
    url: article.url ?? fallback[index % fallback.length].url,
    publishedAt: article.published_at ?? fallback[index % fallback.length].publishedAt,
    summary: article.description ?? fallback[index % fallback.length].summary,
  }));

  useAppStore.getState().setNews(normalized);
  return normalized;
};

let marketPollingHandle: NodeJS.Timeout | null = null;

export const startMarketPolling = (vs_currency: Currency) => {
  if (marketPollingHandle) {
    clearInterval(marketPollingHandle);
  }
  fetchTopTokens(vs_currency);
  marketPollingHandle = setInterval(() => fetchTopTokens(vs_currency), 30000);
};

export const stopMarketPolling = () => {
  if (marketPollingHandle) {
    clearInterval(marketPollingHandle);
    marketPollingHandle = null;
  }
};

