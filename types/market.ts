/**
 * Global Type Definitions: Centralized types for the application's data models.
 * Defining these interfaces here ensures type safety and consistency across services,
 * state management, and components, making the codebase more robust and maintainable.
 */

export type Currency = 'USD' | 'EUR' | 'AED';
export type Theme = 'dark' | 'light' | 'system';

export interface Token {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h: number;
  sparkline_in_7d: {
    price: number[];
  };
}

export interface Quote {
  current_price: number;
  price_change_percentage_24h: number;
}

export interface Holding {
  id: string;
  symbol: string;
  amount: number;
}

type ActivityBase = {
  id: string;
  date: string; // ISO string
};

type SwapActivity = ActivityBase & {
  type: 'swap';
  from: { id: string; symbol: string; amount: number; valueUsd: number };
  to: { id: string; symbol: string; amount: number; valueUsd: number };
};

type SendActivity = ActivityBase & {
  type: 'send';
  from: { id: string; symbol: string; amount: number; valueUsd: number };
  to: { address: string };
};

type ReceiveActivity = ActivityBase & {
  type: 'receive';
  from: { address: string };
  to: { id:string; symbol: string; amount: number; valueUsd: number };
};

type StakeActivity = ActivityBase & {
  type: 'stake';
  from: { id: string; symbol: string; amount: number; valueUsd: number };
  to: { validator: string };
};

export type Activity = SwapActivity | SendActivity | ReceiveActivity | StakeActivity;
