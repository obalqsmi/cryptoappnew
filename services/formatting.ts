/**
 * Formatting Service: A collection of utility functions for formatting numbers and currencies.
 * It provides consistent formatting for currency values, percentages, and large numbers
 * across the entire application, supporting different currencies and locales.
 */

import { Currency } from '../types/market';

export const formatCurrency = (value: number, currency: Currency): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: value > 1 ? 2 : 6,
  }).format(value);
};

export const formatPercent = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatCompact = (value: number): string => {
   if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`;
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
};

export const getPriceColor = (change: number): string => {
  return change >= 0 ? '#1DB954' : '#EF4444';
};
