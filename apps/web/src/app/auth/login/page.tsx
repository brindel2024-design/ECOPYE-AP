'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

interface LoginForm {
  phoneNumber: string;
  pin: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

export default function LoginPage() {
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginForm>();

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const data = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: values,
      });
      setTokens(data.accessToken, data.refreshToken, data.userId);
      router.push('/app');
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError('Erreur réseau');
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/40">
        <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
        <p className="mt-1 text-sm text-slate-500">Accédez à votre compte ECOPYE.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Téléphone</span>
            <input
              type="tel"
              placeholder="+213555123456"
              autoComplete="tel"
              {...register('phoneNumber', { required: true, pattern: /^\+213[567]\d{8}$/ })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">PIN</span>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoComplete="current-password"
              {...register('pin', { required: true, minLength: 6, maxLength: 6 })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 tracking-widest focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </label>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-brand-600 py-3 font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </main>
  );
}
