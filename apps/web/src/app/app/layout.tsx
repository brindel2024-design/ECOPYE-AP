import Link from 'next/link';

const nav = [
  { href: '/app', label: 'Accueil' },
  { href: '/app/wallet', label: 'Portefeuille' },
  { href: '/app/send', label: 'Envoyer' },
  { href: '/app/bills', label: 'Factures' },
  { href: '/app/cagnottes', label: 'Cagnottes' },
  { href: '/app/settings', label: 'Paramètres' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 border-r border-slate-200 bg-white md:block">
        <div className="px-6 py-6 text-xl font-semibold tracking-tight text-brand-700">ECOPYE</div>
        <nav className="mt-4 px-3">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
