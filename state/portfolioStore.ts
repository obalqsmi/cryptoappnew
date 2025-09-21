/**
 * Zustand Portfolio Store: Manages the user's financial data.
 * This store holds the user's asset holdings and transaction history (activities).
 * It includes selectors to compute derived data like total portfolio value and P&L,
 * and actions to modify the portfolio state, such as after a swap. It persists
 * holdings and activities to AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { Activity, Holding, Quote } from '../types/market';

interface PortfolioState {
  holdings: Holding[];
  activities: Activity[];
  quotes: Record<string, Quote>;
  setQuotes: (quotes: Record<string, Quote>) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'date'>) => void;
  recordSwap: (from: Holding, to: Holding) => void;
}

const usePortfolioStoreBase = create<PortfolioState>()(
  devtools(
    persist(
      (set, get) => ({
        holdings: [
          // Seed data
          { id: 'bitcoin', symbol: 'BTC', amount: 0.05 },
          { id: 'ethereum', symbol: 'ETH', amount: 1.2 },
          { id: 'solana', symbol: 'SOL', amount: 25 },
          { id: 'dogecoin', symbol: 'DOGE', amount: 10000 },
          { id: 'crypto-com-chain', symbol: 'CRO', amount: 5000 },
          { id: 'ripple', symbol: 'XRP', amount: 1200 },
        ],
        activities: [
             {
                id: 'seed-swap-1',
                date: new Date('2024-07-20T10:00:00Z').toISOString(),
                type: 'swap',
                from: { id: 'ethereum', symbol: 'ETH', amount: 0.1, valueUsd: 350 },
                to: { id: 'solana', symbol: 'SOL', amount: 2.5, valueUsd: 350 },
            }
        ],
        quotes: {},
        setQuotes: (quotes) => set({ quotes }),
        addActivity: (activity) => {
          set((state) => {
            const newActivity = {
              ...activity,
              id: `act_${Date.now()}`,
              date: new Date().toISOString(),
            } as Activity;

            const nextState: Partial<PortfolioState> = {
              activities: [newActivity, ...state.activities],
            };

            return nextState;
          });
        },
        recordSwap: (from, to) => {
          const { quotes } = get();
          const fromValue = (quotes[from.id]?.current_price ?? 0) * from.amount;

          set((state) => {
            const newHoldings = [...state.holdings];

            const fromIndex = newHoldings.findIndex(h => h.id === from.id);
            if (fromIndex > -1) {
              newHoldings[fromIndex].amount -= from.amount;
              if (newHoldings[fromIndex].amount <= 1e-6) {
                newHoldings.splice(fromIndex, 1);
              }
            }

            const toIndex = newHoldings.findIndex(h => h.id === to.id);
            if(toIndex > -1) {
                newHoldings[toIndex].amount += to.amount;
            } else {
                newHoldings.push({ ...to });
            }

            const swapActivity: Activity = {
              id: `swap_${Date.now()}`,
              date: new Date().toISOString(),
              type: 'swap',
              from: { ...from, valueUsd: fromValue },
              to: { ...to, valueUsd: fromValue },
            };

            const nextState: Partial<PortfolioState> = {
              holdings: newHoldings,
              activities: [swapActivity, ...state.activities],
            };
            return nextState;
          });
        },
      }),
      {
        name: 'crypto-wallet-portfolio-storage',
        storage: createJSONStorage(() => AsyncStorage),
      }
    )
  )
);

export const usePortfolioStore = usePortfolioStoreBase;

// --- Selectors ---
const selectPortfolioValue = (state: PortfolioState) => {
    return state.holdings.reduce((total, holding) => {
      const price = state.quotes[holding.id]?.current_price ?? 0;
      return total + holding.amount * price;
    }, 0);
};

const selectPnl24hValue = (state: PortfolioState) =>
  state.holdings.reduce((total, holding) => {
    const quote = state.quotes[holding.id];
    if (!quote) return total;
    const priceNow = quote.current_price;
    const price24hAgo = priceNow / (1 + (quote.price_change_percentage_24h ?? 0) / 100);
    const valueChange = (priceNow - price24hAgo) * holding.amount;
    return total + valueChange;
  }, 0);

const selectPnl24hPercent = (state: PortfolioState) => {
  const pnlValue = selectPnl24hValue(state);
  const totalValue = selectPortfolioValue(state);
  const totalValue24hAgo = totalValue - pnlValue;
  return totalValue24hAgo === 0 ? 0 : pnlValue / totalValue24hAgo;
};

// --- Selector Hooks ---
export const usePortfolioValue = () => usePortfolioStore(selectPortfolioValue);

export const usePnl24h = () => {
  const value = usePortfolioStore(selectPnl24hValue);
  const percent = usePortfolioStore(selectPnl24hPercent);
  return useMemo(() => ({ value, percent }), [value, percent]);
};

