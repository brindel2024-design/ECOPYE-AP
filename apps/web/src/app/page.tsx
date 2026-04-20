import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-white via-brand-50 to-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-24 md:py-32">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-4 py-1.5 text-sm text-brand-700 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Agréé Banque d&apos;Algérie · Conforme Loi 23-09
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-900 md:text-7xl">
            Le paiement mobile{' '}
            <span className="bg-gradient-to-r from-brand-600 to-brand-900 bg-clip-text text-transparent">
              pensé pour l&apos;Algérie.
            </span>
          </h1>
          <p className="max-w-xl text-lg text-slate-600">
            Transferts instantanés, paiements QR en magasin, règlement des factures
            Sonelgaz et recharges mobiles — tout depuis votre smartphone.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/auth/register"
              className="rounded-full bg-brand-600 px-6 py-3 text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700"
            >
              Créer un compte
            </Link>
            <Link
              href="/auth/login"
              className="rounded-full border border-slate-200 bg-white px-6 py-3 text-slate-900 transition hover:border-slate-300"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Un produit, quatre surfaces.
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'P2P instantané', body: 'Envoyez du DZD à un contact en 2 secondes. 0 frais.' },
            { title: 'QR marchand', body: 'Scannez, payez. Commission 1,20 % côté marchand.' },
            { title: 'Factures', body: 'Sonelgaz, Djezzy, Ooredoo, Mobilis, SEAAL, CNAS.' },
            { title: 'Cagnottes', body: 'Collecte en groupe, partage par lien, suivi temps réel.' },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-100 bg-white p-6 transition hover:border-brand-200 hover:shadow-lg hover:shadow-brand-100"
            >
              <h3 className="text-lg font-medium">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 text-sm text-slate-500 md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} ECOPYE — Alger, Algérie</span>
          <div className="flex gap-6">
            <Link href="/legal/privacy" className="hover:text-slate-800">Confidentialité</Link>
            <Link href="/legal/terms" className="hover:text-slate-800">CGU</Link>
            <Link href="/support" className="hover:text-slate-800">Support</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
