'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Users, Sparkles, Plus, Share2, CheckCircle, ArrowLeft, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDZD } from '@/lib/utils'

interface Cagnotte {
  id: string
  title: string
  description?: string
  type: string
  currentAmount: number
  targetAmount?: number
  shareCode: string
  isActive: boolean
  deadline?: string
  _count: { contributions: number }
  creator?: { fullName: string }
  progress?: number | null
}

type Tab = 'mine' | 'discover'

const TYPE_CONFIG: Record<string, { label: string; emoji: string; bg: string; text: string }> = {
  charity: { label: 'Caritatif', emoji: '❤️', bg: 'bg-pink-50',   text: 'text-pink-600'   },
  family:  { label: 'Famille',   emoji: '👨‍👩‍👧', bg: 'bg-blue-50',   text: 'text-blue-600'   },
  event:   { label: 'Événement', emoji: '🎉', bg: 'bg-purple-50', text: 'text-purple-600' },
}

export default function CagnottePage() {
  const [tab,         setTab]         = useState<Tab>('mine')
  const [mine,        setMine]        = useState<Cagnotte[]>([])
  const [publics,     setPublics]     = useState<Cagnotte[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showCreate,  setShowCreate]  = useState(false)
  const [selected,    setSelected]    = useState<Cagnotte | null>(null)
  const [search,      setSearch]      = useState('')
  const [typeFilter,  setTypeFilter]  = useState('')

  // Create form
  const [form, setForm] = useState({ title: '', type: 'charity', description: '', targetAmount: '', deadline: '', isPublic: true })
  const [creating, setCreating] = useState(false)

  // Contribute
  const [contribAmount, setContribAmount] = useState('')
  const [contribPin,    setContribPin]    = useState('')
  const [contribMsg,    setContribMsg]    = useState('')
  const [contribAnon,   setContribAnon]   = useState(false)
  const [contributing,  setContributing]  = useState(false)
  const [contribDone,   setContribDone]   = useState(false)

  const loadData = async () => {
    setLoading(true)
    const [m, p] = await Promise.all([
      fetch('/api/cagnotte?view=mine').then(r => r.json()),
      fetch('/api/cagnotte?view=public').then(r => r.json()),
    ])
    setMine(Array.isArray(m) ? m : [])
    setPublics(Array.isArray(p) ? p : [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleCreate = async () => {
    if (!form.title.trim() || form.title.length < 3) {
      toast.error('Titre requis (min 3 caractères)')
      return
    }
    setCreating(true)
    try {
      const body: Record<string, unknown> = { ...form }
      if (!form.targetAmount) delete body.targetAmount
      if (!form.deadline)     delete body.deadline

      const res  = await fetch('/api/cagnotte', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success('Cagnotte créée !')
      setShowCreate(false)
      setForm({ title: '', type: 'charity', description: '', targetAmount: '', deadline: '', isPublic: true })
      loadData()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setCreating(false)
    }
  }

  const handleContribute = async () => {
    if (!selected) return
    if (!contribAmount || parseFloat(contribAmount) < 100) { toast.error('Minimum 100 DZD'); return }
    setContributing(true)
    try {
      const res  = await fetch(`/api/cagnotte/${selected.shareCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(contribAmount), pin: contribPin, message: contribMsg, isAnonymous: contribAnon }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setContribDone(true)
      loadData()
      toast.success('Contribution enregistrée !')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setContributing(false)
    }
  }

  const shareLink = (code: string) => {
    const url = `${window.location.origin}/cagnotte/${code}`
    navigator.clipboard.writeText(url).then(() => toast.success('Lien copié !'))
  }

  const filtered = (tab === 'mine' ? mine : publics).filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase())
    const matchType   = !typeFilter || c.type === typeFilter
    return matchSearch && matchType
  })

  const CagnotteCard = ({ c }: { c: Cagnotte }) => {
    const cfg = TYPE_CONFIG[c.type] || TYPE_CONFIG.charity
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-4 shadow-card border border-gray-100 cursor-pointer hover:shadow-card-hover transition-shadow"
        onClick={() => { setSelected(c); setContribDone(false); setContribAmount(''); setContribPin('') }}
      >
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl ${cfg.bg}`}>
            {cfg.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{c.title}</h3>
              {!c.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">Clôturée</span>}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {cfg.label} · {c._count.contributions} contribution{c._count.contributions !== 1 ? 's' : ''}
              {c.creator && <span> · par {c.creator.fullName}</span>}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-brand-600 text-sm">{formatDZD(c.currentAmount)}</p>
            {c.targetAmount && <p className="text-xs text-gray-400">/ {formatDZD(c.targetAmount)}</p>}
          </div>
        </div>
        {c.targetAmount && (
          <div className="mt-3 h-1.5 bg-surface-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-brand rounded-full transition-all"
              style={{ width: `${Math.min(100, (c.currentAmount / c.targetAmount) * 100)}%` }}
            />
          </div>
        )}
        {c.description && (
          <p className="text-xs text-gray-400 mt-2 line-clamp-2">{c.description}</p>
        )}
      </motion.div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cagnottes</h1>
          <p className="text-gray-500 text-sm">Collectes solidaires & événementielles</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="w-11 h-11 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-card hover:shadow-card-hover active:scale-95 transition-all"
          aria-label="Créer une cagnotte"
        >
          <Plus size={20} className="text-white" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-100 rounded-2xl p-1 gap-1">
        {(['mine', 'discover'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${t === tab ? 'bg-white text-brand-600 shadow-soft' : 'text-gray-500'}`}
          >
            {t === 'mine' ? `Mes cagnottes (${mine.length})` : '🌍 Découvrir'}
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Rechercher…" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">Tous</option>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-surface-100 rounded-3xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="text-gray-300 mx-auto mb-3" size={48} />
          <p className="text-gray-500 font-medium">{tab === 'mine' ? 'Aucune cagnotte — créez-en une !' : 'Aucune cagnotte publique'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => <CagnotteCard key={c.id} c={c} />)}
        </div>
      )}

      {/* Modal Créer */}
      <AnimatePresence>
        {showCreate && (
          <motion.div className="fixed inset-0 z-50 bg-black/50 flex items-end"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setShowCreate(false) }}
          >
            <motion.div
              className="w-full bg-white rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Nouvelle cagnotte</h2>
                <button onClick={() => setShowCreate(false)} className="text-gray-400 text-xl">✕</button>
              </div>

              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Titre de la cagnotte *" />

              <div className="grid grid-cols-3 gap-2">
                {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                  <button key={k} onClick={() => setForm(f => ({ ...f, type: k }))}
                    className={`py-3 rounded-2xl flex flex-col items-center gap-1 border-2 transition-colors ${form.type === k ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-white'}`}
                  >
                    <span className="text-lg">{v.emoji}</span>
                    <span className={`text-xs font-medium ${form.type === k ? 'text-brand-600' : 'text-gray-500'}`}>{v.label}</span>
                  </button>
                ))}
              </div>

              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Description (optionnel)" />

              <div className="grid grid-cols-2 gap-3">
                <input type="number" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
                  className="border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Objectif DZD (opt.)" />
                <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setForm(f => ({ ...f, isPublic: !f.isPublic }))}
                  className={`w-12 h-6 rounded-full relative transition-colors ${form.isPublic ? 'bg-brand-500' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isPublic ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-600">Visible publiquement</span>
              </label>

              <button onClick={handleCreate} disabled={creating}
                className="w-full py-4 bg-gradient-brand text-white font-semibold rounded-2xl shadow-card active:scale-95 transition-transform disabled:opacity-60">
                {creating ? 'Création…' : 'Créer la cagnotte'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Contribution */}
      <AnimatePresence>
        {selected && (
          <motion.div className="fixed inset-0 z-50 bg-black/50 flex items-end"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) { setSelected(null); setContribDone(false) } }}
          >
            <motion.div
              className="w-full bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            >
              <div className="p-6 space-y-4">
                {!contribDone ? (
                  <>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelected(null)} className="p-1">
                        <ArrowLeft size={20} className="text-gray-400" />
                      </button>
                      <div className="flex-1">
                        <h2 className="font-bold text-gray-900 truncate">{selected.title}</h2>
                        <p className="text-xs text-gray-400">{TYPE_CONFIG[selected.type]?.label}</p>
                      </div>
                      <button onClick={() => shareLink(selected.shareCode)} className="p-2 rounded-xl bg-surface-100">
                        <Share2 size={16} className="text-gray-500" />
                      </button>
                    </div>

                    {/* Progression */}
                    <div className="bg-surface-50 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Collecté</span>
                        <span className="font-bold text-brand-600">{formatDZD(selected.currentAmount)}</span>
                      </div>
                      {selected.targetAmount && (
                        <>
                          <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-brand rounded-full"
                              style={{ width: `${Math.min(100, (selected.currentAmount / selected.targetAmount) * 100)}%` }} />
                          </div>
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>{Math.round((selected.currentAmount / selected.targetAmount) * 100)}% de l'objectif</span>
                            <span>Objectif: {formatDZD(selected.targetAmount)}</span>
                          </div>
                        </>
                      )}
                      <p className="text-xs text-gray-400">{selected._count.contributions} contribution{selected._count.contributions !== 1 ? 's' : ''}</p>
                    </div>

                    {selected.description && (
                      <p className="text-sm text-gray-600 leading-relaxed">{selected.description}</p>
                    )}

                    {selected.isActive ? (
                      <>
                        <input type="number" value={contribAmount} onChange={e => setContribAmount(e.target.value)}
                          className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-center text-2xl font-bold focus:outline-none focus:border-brand-500"
                          placeholder="Montant DZD" inputMode="decimal" />

                        <input type="text" value={contribMsg} onChange={e => setContribMsg(e.target.value)}
                          className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          placeholder="Laisser un message (optionnel)" />

                        <label className="flex items-center gap-3 cursor-pointer">
                          <div onClick={() => setContribAnon(v => !v)}
                            className={`w-10 h-5 rounded-full relative transition-colors ${contribAnon ? 'bg-brand-500' : 'bg-gray-200'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${contribAnon ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </div>
                          <span className="text-sm text-gray-600">Rester anonyme</span>
                        </label>

                        <input type="password" value={contribPin} onChange={e => setContribPin(e.target.value)}
                          className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500"
                          placeholder="Votre PIN" maxLength={6} inputMode="numeric" />

                        <button onClick={handleContribute} disabled={!contribAmount || !contribPin || contributing}
                          className="w-full py-4 bg-gradient-brand text-white font-semibold rounded-2xl shadow-card active:scale-95 transition-transform disabled:opacity-60">
                          {contributing ? 'Envoi…' : `Contribuer ${contribAmount ? formatDZD(parseFloat(contribAmount)) : ''}`}
                        </button>
                      </>
                    ) : (
                      <div className="bg-gray-50 rounded-2xl p-4 text-center">
                        <p className="text-gray-500 text-sm">Cette cagnotte est clôturée</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <CheckCircle className="text-success-500" size={64} />
                    <h3 className="text-xl font-bold text-gray-900">Merci !</h3>
                    <p className="text-gray-500 text-center text-sm">
                      {formatDZD(parseFloat(contribAmount))} ajoutés à « {selected.title} »
                    </p>
                    <button onClick={() => { setSelected(null); setContribDone(false) }}
                      className="w-full py-4 bg-gradient-brand text-white font-semibold rounded-2xl shadow-card active:scale-95 transition-transform">
                      Fermer
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
