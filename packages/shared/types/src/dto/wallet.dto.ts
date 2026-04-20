export interface WalletSummary {
  id: string;
  type: 'PERSONAL' | 'MERCHANT' | 'AGENT' | 'ESCROW' | 'SYSTEM';
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  currency: string;
  balance: string; // BigInt serialized
  availableBalance: string;
  reservedBalance: string;
  dailyLimit: string;
  monthlyLimit: string;
  dailySpent: string;
  monthlySpent: string;
}
