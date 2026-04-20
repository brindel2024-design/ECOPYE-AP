export const DEFAULT_CURRENCY = 'DZD';
export const SUPPORTED_CURRENCIES = ['DZD', 'EUR', 'USD', 'GBP'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/** Number of minor units per major unit. DZD uses 2 decimals → 100 centimes. */
export const CURRENCY_MINOR_UNITS: Record<SupportedCurrency, number> = {
  DZD: 100,
  EUR: 100,
  USD: 100,
  GBP: 100,
};
