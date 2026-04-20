'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

interface WalletSummary {
  balance: string;
  availableBalance: string;
  currency: string;
  dailySpent: string;
  monthlySpent: string;
  dailyLimit: string;
  monthlyLimit: string;
}

function fmtDzd(centimes: string) {
  const n = BigInt(centimes);
  const integer = n / 100n;
  const decimal = (n % 100n).toString().padStart(2, '0');
  return `${integer.toLocaleString('fr-DZ')},${decimal} DZD`;
}

export default function DashboardPage() {
  const token = useAuthStore((s) => s.accessToken);
  const { data, isLoading } = useQuery({
    queryKey: ['wallet', 'summary'],
    enabled: !!token,
    queryFn: () => apiFetch<WalletSummary>('/wallets/summary', { token: token! }),
  });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-semibold tracking-tight">Bonjour</h1>
      <p className="mt-1 text-slate-500">Voici l&apos;état de votre portefeuille.</p>

      <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <span className="text-sm font-medium text-slate-500">Solde disponible</span>
        <div className="mt-2 text-5xl font-semibold tracking-tight text-brand-700">
          {isLoading ? '—' : data ? fmtDzd(data.availableBalance) : '0,00 DZD'}
        </div>
        {data && (
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-600">
            <div>
              <span className="block text-slate-400">Plafond journalier</span>
              <span>{fmtDzd(data.dailyLimit)}</span>
            </div>
            <div>
              <span className="block text-slate-400">Plafond mensuel</span>
              <span>{fmtDzd(data.monthlyLimit)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
