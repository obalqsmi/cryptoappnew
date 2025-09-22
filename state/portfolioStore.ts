import { useAppStore } from './store';
import { selectActiveWallet, selectHoldingsAllocation, selectPnl, selectPortfolioValue, selectSwapAnalytics } from './store';

export const usePortfolioStore = useAppStore;
export const useActiveWallet = () => useAppStore(selectActiveWallet);
export const usePortfolioValue = () => useAppStore((state) => selectPortfolioValue(state));
export const usePnl24h = () => useAppStore((state) => selectPnl(state, '24h'));
export const usePnl7d = () => useAppStore((state) => selectPnl(state, '7d'));
export const usePnlAllTime = () => useAppStore((state) => selectPnl(state, 'all'));
export const useHoldingsAllocation = () => useAppStore((state) => selectHoldingsAllocation(state));
export const useSwapAnalytics = () => useAppStore((state) => selectSwapAnalytics(state));

