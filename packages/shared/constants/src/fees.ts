/**
 * Fee table (in basis points = 1/10000).
 * 120 bps = 1.20 %
 */
export const FEES_BPS = {
  P2P_TRANSFER: 0, // 0 %
  QR_PAYMENT_MERCHANT: 120, // 1.20 % côté marchand
  BILL_PAYMENT: 0,
  MOBILE_RECHARGE: 0,
  CAGNOTTE_CONTRIBUTION: 0,
  AGENT_CASH_IN: 0,
  AGENT_CASH_OUT: 50, // 0.50 %
  BEA_OUTBOUND: 250, // 2.50 %
} as const;

export const AGENT_COMMISSION_BPS = 50; // 0.50 % retenue à l'agent
export const MERCHANT_DEFAULT_COMMISSION_BPS = 120;

/** TVA Algérie (si applicable sur certaines commissions) */
export const VAT_BPS = 1900; // 19 %
