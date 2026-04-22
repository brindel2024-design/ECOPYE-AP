'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { QrCode, Camera, Download, Share2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import QRScanner from '@/components/qr/QRScanner'

type Tab = 'receive' | 'pay'

const formatDZD = (n: number) =>
  new Intl.NumberFormat('fr-DZ', { minimumFractionDigits: 0 }).format(n) + ' DZD'

export default function QRPage() {
  const { user } = useAppStore()
  const [tab, setTab] = useState<Tab>('receive')
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('')
  const [qrImage, setQrImage] = useState('')
  const [isStatic, setIsStatic] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [scannedData, setScannedData] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [pin, setPin] = useState('')
  const [payStep, setPayStep] = useState<'scan' | 'confirm' | 'done'>('scan')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleGenerateQR = async () => {
    setLoading(true); setError('')
    try {
      const res = await api.generateQR({
        amount: amount ? Number(amount) : undefined,
        label: label || `Paiement ${user?.fullName}`,
        isStatic
      })
      setQrImage(res.qrImage)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur') }
    finally { setLoading(false) }
  }

  const handleScan = (data: string) => {
    setShowScanner(false)
    try {
      const parsed = JSON.parse(data)
      if (parsed.type !== 'ecopye_payment') { setError('QR Code non reconnu'); return }
      setScannedData(data)
      if (parsed.amount) setPayAmount(String(parsed.amount))
      setPayStep('confirm')
    } catch { setError('QR Code invalide') }
  }

  const handlePayQR = async () => {
    setLoading(true); setError('')
    try {
      const res = await api.payQR({ qrPayload: scannedData, pin, amount: payAmount ? Number(payAmount) : undefined })
      setSuccessMsg(res.message)
      setPayStep('done')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Paiement échoué') }
    finally { setLoading(false) }
  }

  const parsed = scannedData ? (() => { try { return JSON.parse(scannedData) } catch { return null } })() : null

  return (
    <div className="min-h-dvh bg-surface px-5 pt-12">
      <h1 className="text-xl font-bold text-white mb-6">QR Code</h1>

      {/* Tabs */}
      <div className="flex bg-surface-muted rounded-2xl p-1 mb-6">
        {(['receive', 'pay'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 tap-feedback
              ${tab === t ? 'bg-brand-500 text-white' : 'text-gray-400'}`}
          >
            {t === 'receive' ? 'Recevoir' : 'Payer'}
          </button>
        ))}
      </div>

      {/* Recevoir */}
      {tab === 'receive' && (
        <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {!qrImage ? (
            <>
              <div className="space-y-3">
                <input
                  type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  className="input-field" placeholder="Montant (optionnel) en DZD"
                  inputMode="decimal"
                />
                <input
                  type="text" value={label} onChange={e => setLabel(e.target.value)}
                  className="input-field" placeholder="Description (ex: Repas, Loyer)"
                />
                <label className="flex items-center gap-3 cursor-pointer tap-feedback">
                  <div
                    onClick={() => setIsStatic(v => !v)}
                    className={`w-12 h-6 rounded-full transition-colors duration-200 relative
                      ${isStatic ? 'bg-brand-500' : 'bg-surface-muted border border-surface-border'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200
                      ${isStatic ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">QR Permanent</p>
                    <p className="text-xs text-gray-500">Utilisable plusieurs fois (pour commerçants)</p>
                  </div>
                </label>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button onClick={handleGenerateQR} disabled={loading} className="btn-primary flex items-center justify-center gap-2">
                <QrCode size={18} />
                {loading ? 'Génération…' : 'Générer mon QR Code'}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-5">
              <div className="card p-6 flex flex-col items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrImage} alt="QR Code EcoPye" className="w-56 h-56 rounded-2xl" />
                <div className="text-center">
                  <p className="font-semibold text-white">{user?.fullName}</p>
                  {amount && <p className="text-brand-400 font-bold text-lg">{formatDZD(Number(amount))}</p>}
                  {label && <p className="text-gray-400 text-sm">{label}</p>}
                </div>
              </div>
              <div className="flex gap-3 w-full">
                <button className="btn-secondary flex items-center justify-center gap-2 flex-1 tap-feedback">
                  <Download size={18} /> Enregistrer
                </button>
                <button className="btn-secondary flex items-center justify-center gap-2 flex-1 tap-feedback">
                  <Share2 size={18} /> Partager
                </button>
              </div>
              <button onClick={() => setQrImage('')} className="text-gray-500 text-sm tap-feedback">
                Générer un nouveau QR
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Payer par QR */}
      {tab === 'pay' && (
        <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {payStep === 'scan' && (
            <>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button
                onClick={() => setShowScanner(true)}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <Camera size={20} />
                Scanner un QR Code
              </button>
              <p className="text-center text-gray-500 text-sm">
                Pointez votre caméra vers le QR Code du commerçant
              </p>
            </>
          )}

          {payStep === 'confirm' && parsed && (
            <div className="space-y-5">
              <div className="card text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-gradient-brand mx-auto flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{parsed.merchantName?.[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-white text-lg">{parsed.merchantName}</p>
                  <p className="text-gray-400 text-sm">{parsed.phone}</p>
                </div>
              </div>

              <input
                type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                className="input-field text-center text-2xl font-bold"
                placeholder="Montant en DZD" inputMode="decimal"
                readOnly={!!parsed.amount}
              />

              {/* PIN */}
              <div className="flex justify-center gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
                  <button key={i} disabled={k === ''}
                    onClick={() => {
                      if (k === '⌫') setPin(p => p.slice(0,-1))
                      else if (k !== '' && pin.length < 6) setPin(p => p + k)
                    }}
                    className={`h-14 rounded-2xl text-lg font-semibold tap-feedback
                      ${k === '' ? 'invisible' : 'bg-surface-muted text-white'}`}
                  >{k}</button>
                ))}
              </div>

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button onClick={handlePayQR} disabled={pin.length !== 6 || !payAmount || loading} className="btn-primary">
                {loading ? 'Paiement…' : `Payer ${payAmount ? formatDZD(Number(payAmount)) : ''}`}
              </button>
            </div>
          )}

          {payStep === 'done' && (
            <div className="flex flex-col items-center gap-6 pt-8">
              <div className="w-20 h-20 rounded-full bg-brand-500/20 flex items-center justify-center">
                <QrCode className="text-brand-500" size={40} />
              </div>
              <h2 className="text-xl font-bold text-white">Paiement réussi !</h2>
              <p className="text-gray-400 text-center text-sm">{successMsg}</p>
              <button onClick={() => { setPayStep('scan'); setPin(''); setScannedData(''); setPayAmount('') }} className="btn-primary">
                Nouveau paiement
              </button>
            </div>
          )}
        </motion.div>
      )}

      {showScanner && <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
    </div>
  )
}
