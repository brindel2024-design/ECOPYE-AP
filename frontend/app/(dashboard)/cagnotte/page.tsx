'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Heart, Users, Sparkles, ArrowLeft, Share2, CheckCircle } from 'lucide-react'
import { api } from '@/lib/api'

interface Cagnotte {
  id: string; title: string; type: string; description?: string
  currentAmount: number; targetAmount?: number; shareCode: string
  isActive: boolean; deadline?: string; _count: { contributions: number }
  creator?: { fullName: string }; progress?: number
}

type Tab = 'mine' | 'public'

const typeConfig = {
  charity: { label: 'Caritatif', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/20' },
  family:  { label: 'Famille',   icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  event:   { label: 'Événement', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/20' },
}

const formatDZD = (n: number) =>
  new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 }).format(n) + ' DZD'

export default function CagnottePage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('mine')
  const [mine, setMine] = useState<Cagnotte[]>([])
  const [publics, setPublics] = useState<Cagnotte[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [selectedCagnotte, setSelectedCagnotte] = useState<Cagnotte | null>(null)
  const [loading, setLoading] = useState(true)

  // Form
  const [form, setForm] = useState({ title: '', type: 'charity', description: '', targetAmount: '', deadline: '', isPublic: true })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Contribution
  const [contribAmount, setContribAmount] = useState('')
  const [contribPin, setContribPin] = useState('')
  const [contribMsg, setContribMsg] = useState('')
  const [contribAnon, setContribAnon] = useState(false)
  const [contribLoading, setContribLoading] = useState(false)
  const [contribSuccess, setContribSuccess] = useState(false)
  const [contribError, setContribError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [m, p] = await Promise.all([api.getMyCagnottes(), api.getPublicCagnottes()])
        setMine(m); setPublics(p)
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const handleCreate = async () => {
    if (!form.title.trim() || form.title.length < 3) return setCreateError('Titre requis (min 3 caractères)')
    setCreating(true); setCreateError('')
    try {
      const data: Record<string, unknown> = { ...form }
      if (!form.targetAmount) delete data.targetAmount
      if (!form.deadline) delete data.deadline
      await api.createCagnotte(data)
      const [m] = await Promise.all([api.getMyCagnottes()])
      setMine(m); setShowCreate(false)
      setForm({ title: '', type: 'charity', description: '', targetAmount: '', deadline: '', isPublic: true })
    } catch (e: unknown) { setCreateError(e instanceof Error ? e.message : 'Erreur') }
    finally { setCreating(false) }
  }

  const handleContribute = async () => {
    if (!selectedCagnotte) return
    setContribLoading(true); setContribError('')
    try {
      await api.contribute(selectedCagnotte.shareCode, {
        amount: Number(contribAmount), pin: contribPin,
        message: contribMsg || undefined, isAnonymous: contribAnon
      })
      setContribSuccess(true)
      const [m, p] = await Promise.all([api.getMyCagnottes(), api.getPublicCagnottes()])
      setMine(m); setPublics(p)
    } catch (e: unknown) { setContribError(e instanceof Error ? e.message : 'Erreur') }
    finally { setContribLoading(false) }
  }

  const CagnotteCard = ({ c }: { c: Cagnotte }) => {
    const cfg = typeConfig[c.type as keyof typeof typeConfig]
    const Icon = cfg.icon
    return (
      <button
        onClick={() => { setSelectedCagnotte(c); setContribSuccess(false); setContribAmount(''); setContribPin('') }}
        className="card w-full text-left tap-feedback active:scale-[0.98] transition-transform"
      >
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
            <Icon size={20} className={cfg.color} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate">{c.title}</p>
            <p className="text-xs text-gray-500">{cfg.label} · {c._count.contributions} contribution{c._count.contributions !== 1 ? 's' : ''}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-brand-400 font-bold text-sm">{formatDZD(Number(c.currentAmount))}</p>
            {c.targetAmount && <p className="text-xs text-gray-600">/ {formatDZD(Number(c.targetAmount))}</p>}
          </div>
        </div>
        {c.targetAmount && (
          <div className="mt-3 h-1.5 bg-surface-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-brand rounded-full transition-all"
              style={{ width: `${Math.min(100, (Number(c.currentAmount) / Number(c.targetAmount)) * 100)}%` }}
            />
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="min-h-dvh bg-surface px-5 pt-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Cagnottes</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="w-10 h-10 rounded-2xl bg-brand-500 flex items-center justify-center tap-feedback"
          aria-label="Créer une cagnotte"
        >
          <Plus size={20} className="text-white" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-muted rounded-2xl p-1 mb-6">
        {(['mine', 'public'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all tap-feedback
              ${tab === t ? 'bg-brand-500 text-white' : 'text-gray-400'}`}
          >
            {t === 'mine' ? 'Mes cagnottes' : 'Découvrir'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {(tab === 'mine' ? mine : publics).map(c => <CagnotteCard key={c.id} c={c} />)}
          {(tab === 'mine' ? mine : publics).length === 0 && (
            <div className="card text-center py-10">
              <Heart className="text-gray-600 mx-auto mb-3" size={40} />
              <p className="text-gray-500 text-sm">
                {tab === 'mine' ? 'Aucune cagnotte. Créez-en une !' : 'Aucune cagnotte publique disponible.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal Créer */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            className="fixed inset-0 bg-black/70 z-50 flex items-end"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.div
              className="w-full bg-surface-card rounded-t-3xl p-6 space-y-4"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Nouvelle cagnotte</h2>
                <button onClick={() => setShowCreate(false)} className="tap-feedback text-gray-500">✕</button>
              </div>

              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="input-field" placeholder="Titre de la cagnotte" />

              <div className="grid grid-cols-3 gap-2">
                {Object.entries(typeConfig).map(([k, cfg]) => {
                  const Icon = cfg.icon
                  return (
                    <button key={k} onClick={() => setForm(f => ({ ...f, type: k }))}
                      className={`py-3 rounded-2xl flex flex-col items-center gap-1 tap-feedback transition-colors
                        ${form.type === k ? 'bg-brand-500/20 border border-brand-500' : 'bg-surface-muted'}`}
                    >
                      <Icon size={18} className={form.type === k ? 'text-brand-400' : 'text-gray-500'} />
                      <span className={`text-xs ${form.type === k ? 'text-brand-400' : 'text-gray-500'}`}>{cfg.label}</span>
                    </button>
                  )
                })}
              </div>

              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="input-field resize-none h-20" placeholder="Description (optionnel)" />

              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
                  className="input-field" placeholder="Objectif DZD" inputMode="decimal" />
                <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="input-field text-gray-400" />
              </div>

              {createError && <p className="text-red-400 text-sm">{createError}</p>}
              <button onClick={handleCreate} disabled={creating} className="btn-primary">
                {creating ? 'Création…' : 'Créer la cagnotte'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Contribution */}
      <AnimatePresence>
        {selectedCagnotte && (
          <motion.div
            className="fixed inset-0 bg-black/70 z-50 flex items-end"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setSelectedCagnotte(null)}
          >
            <motion.div
              className="w-full bg-surface-card rounded-t-3xl p-6 space-y-4 max-h-[90dvh] overflow-y-auto"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              {!contribSuccess ? (
                <>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedCagnotte(null)} className="tap-feedback">
                      <ArrowLeft size={20} className="text-gray-400" />
                    </button>
                    <div>
                      <h2 className="font-bold text-white">{selectedCagnotte.title}</h2>
                      <p className="text-xs text-gray-500">{typeConfig[selectedCagnotte.type as keyof typeof typeConfig]?.label}</p>
                    </div>
                    <button className="ml-auto tap-feedback"><Share2 size={18} className="text-gray-400" /></button>
                  </div>

                  <div className="card space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Collecté</span>
                      <span className="text-brand-400 font-bold">{formatDZD(Number(selectedCagnotte.currentAmount))}</span>
                    </div>
                    {selectedCagnotte.targetAmount && (
                      <>
                        <div className="h-2 bg-surface-border rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-brand rounded-full"
                            style={{ width: `${Math.min(100, (Number(selectedCagnotte.currentAmount) / Number(selectedCagnotte.targetAmount)) * 100)}%` }} />
                        </div>
                        <p className="text-xs text-gray-600 text-right">
                          Objectif: {formatDZD(Number(selectedCagnotte.targetAmount))}
                        </p>
                      </>
                    )}
                  </div>

                  <input type="number" value={contribAmount} onChange={e => setContribAmount(e.target.value)}
                    className="input-field text-center text-2xl font-bold" placeholder="Montant en DZD" inputMode="decimal" />

                  <input type="text" value={contribMsg} onChange={e => setContribMsg(e.target.value)}
                    className="input-field" placeholder="Message (optionnel)" />

                  <label className="flex items-center gap-3 tap-feedback cursor-pointer">
                    <div onClick={() => setContribAnon(v => !v)}
                      className={`w-10 h-5 rounded-full relative transition-colors ${contribAnon ? 'bg-brand-500' : 'bg-surface-muted border border-surface-border'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${contribAnon ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-sm text-gray-300">Contribuer anonymement</span>
                  </label>

                  {/* PIN */}
                  <div className="flex justify-center gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className={`pin-dot ${i < contribPin.length ? 'filled' : ''}`} />
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
                      <button key={i} disabled={k === ''}
                        onClick={() => {
                          if (k === '⌫') setContribPin(p => p.slice(0,-1))
                          else if (k !== '' && contribPin.length < 6) setContribPin(p => p + k)
                        }}
                        className={`h-12 rounded-2xl text-lg font-semibold tap-feedback
                          ${k === '' ? 'invisible' : 'bg-surface-muted text-white'}`}
                      >{k}</button>
                    ))}
                  </div>

                  {contribError && <p className="text-red-400 text-sm text-center">{contribError}</p>}
                  <button onClick={handleContribute} disabled={!contribAmount || contribPin.length !== 6 || contribLoading} className="btn-primary">
                    {contribLoading ? 'Envoi…' : `Contribuer ${contribAmount ? formatDZD(Number(contribAmount)) : ''}`}
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-6 py-8">
                  <CheckCircle className="text-brand-500" size={64} />
                  <h2 className="text-xl font-bold text-white">Merci pour votre contribution !</h2>
                  <p className="text-gray-400 text-center text-sm">{formatDZD(Number(contribAmount))} ajoutés à « {selectedCagnotte.title} »</p>
                  <button onClick={() => setSelectedCagnotte(null)} className="btn-primary">Fermer</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
