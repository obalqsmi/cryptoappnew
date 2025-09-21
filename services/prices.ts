/**
 * Price Fetching Service: Handles all network requests to the CoinGecko API.
 * It provides functions to fetch market data and historical price charts,
 * normalizes the API response into the app's internal data types, and
 * includes a fallback to mock data to ensure functionality even if the API is down.
 */
import { create } from 'zustand';

import { usePortfolioStore } from '../state/portfolioStore';
import { Currency, Quote, Token } from '../types/market';
import { MOCK_HISTORY, MOCK_TOKENS } from './mockData';

const API_BASE = 'https://api.coingecko.com/api/v3';

type TokenState = {
  tokens: Token[];
  loading: boolean;
  setTokens: (tokens: Token[]) => void;
  setLoading: (loading: boolean) => void;
};

export const useTokenStore = create<TokenState>((set) => ({
  tokens: [],
  loading: false,
  setTokens: (tokens) => set({ tokens }),
  setLoading: (loading) => set({ loading }),
}));

const fetchWithFallback = async <T>(url: string, fallbackData: T): Promise<T> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`API request failed: ${response.status}. Using fallback data.`);
      return fallbackData;
    }
    return await response.json();
  } catch (error) {
    console.error('Network error during fetch:', error);
    return fallbackData;
  }
};

export const fetchTopTokens = async (vs_currency: Currency, page: number = 1): Promise<Token[]> => {
  const url = `${API_BASE}/coins/markets?vs_currency=${vs_currency.toLowerCase()}&order=market_cap_desc&per_page=50&page=${page}&sparkline=true&price_change_percentage=24h`;
  const rawData = await fetchWithFallback<any[]>(url, MOCK_TOKENS);

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

  // Update quotes in Zustand store
  const quotes = tokens.reduce((acc, token) => {
    acc[token.id] = {
      current_price: token.current_price,
      price_change_percentage_24h: token.price_change_percentage_24h,
    };
    return acc;
  }, {} as Record<string, Quote>);
  usePortfolioStore.getState().setQuotes(quotes);

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

