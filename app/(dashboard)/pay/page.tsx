'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDZD } from '@/lib/utils'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CreditCard,
  Phone,
  QrCode,
  Smartphone,
  Zap,
  Download,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'

const QRScanner = dynamic(() => import('@/components/QRScanner'), { ssr: false })

type PayMethod = 'qr' | 'merchant' | 'receive' | 'card'

const merchants = [
  { id: 'djezzy',   name: 'Djezzy',         category: 'Téléphonie', icon: Smartphone, color: 'bg-red-50 text-red-500' },
  { id: 'mobilis',  name: 'Mobilis',         category: 'Téléphonie', icon: Phone,      color: 'bg-blue-50 text-blue-500' },
  { id: 'ooredoo',  name: 'Ooredoo',         category: 'Téléphonie', icon: Phone,      color: 'bg-red-50 text-red-600' },
  { id: 'sonelgaz', name: 'Sonelgaz',        category: 'Énergie',    icon: Zap,        color: 'bg-amber-50 text-amber-600' },
  { id: 'seaal',    name: 'Seaal',           category: 'Eau',        icon: Building2,  color: 'bg-cyan-50 text-cyan-600' },
  { id: 'atm',      name: 'ATM Mobilis',     category: 'Banque',     icon: CreditCard, color: 'bg-green-50 text-green-600' },
  { id: 'barid',    name: 'Algérie Poste',   category: 'Poste',      icon: Building2,  color: 'bg-yellow-50 text-yellow-600' },
  { id: 'autre',    name: 'Autre marchand',  category: 'Divers',     icon: QrCode,     color: 'bg-gray-100 text-gray-500' },
]

type Step = 'select' | 'amount' | 'confirm' | 'success'

interface ScannedMerchant {
  id: string
  name: string
  category: string
  icon: typeof Building2
  color: string
  phone?: string
  prefillAmount?: number
  label?: string
}

export default function PayPage() {
  const router = useRouter()
  const [method, setMethod] = useState<PayMethod>('merchant')
  const [step, setStep] = useState<Step>('select')
  const [selectedMerchant, setSelectedMerchant] = useState<ScannedMerchant | null>(null)
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [txRef, setTxRef] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [myQR, setMyQR] = useState<{ qrDataUrl: string; shareUrl: string } | null>(null)
  const [qrLoading, setQrLoading] = useState(false)

  const parsedAmount = parseFloat(amount) || 0

  function selectMerchant(merchant: ScannedMerchant) {
    setSelectedMerchant(merchant)
    if (merchant.prefillAmount) setAmount(String(merchant.prefillAmount))
    setStep('amount')
  }

  const handleQRScan = useCallback((data: string) => {
    setShowScanner(false)
    try {
      const payload = JSON.parse(data)
      if (payload.t !== 'ecopye') {
        toast.error('QR code non reconnu — utilisez un QR EcoPye')
        return
      }
      const merchant: ScannedMerchant = {
        id: payload.mid || 'qr-merchant',
        name: payload.name || 'Marchand EcoPye',
        category: payload.label || 'QR Code',
        icon: QrCode,
        color: 'bg-brand-50 text-brand-600',
        phone: payload.phone,
        prefillAmount: payload.amount ? parseFloat(payload.amount) : undefined,
        label: payload.label,
      }
      selectMerchant(merchant)
      toast.success(`Marchand détecté : ${merchant.name}`)
    } catch {
      toast.error('QR code invalide ou non supporté')
    }
  }, [])

  async function generateMyQR() {
    setQrLoading(true)
    try {
      const res = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: 'Paiement EcoPye' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMyQR({ qrDataUrl: data.qrCode, shareUrl: data.shareUrl })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur génération QR')
    } finally {
      setQrLoading(false)
    }
  }

  async function confirmPayment() {
    if (!parsedAmount || parsedAmount < 100) {
      toast.error('Montant minimum: 100 DZD')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantName: selectedMerchant?.name,
          merchantId: selectedMerchant?.id,
          amount: parsedAmount,
          description: reference || `Paiement ${selectedMerchant?.name}`,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Paiement échoué')
        return
      }
      setTxRef(data.reference)
      setStep('success')
    } catch {
      toast.error('Erreur lors du paiement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Scanner overlay */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* En-tête */}
      <div className="flex items-center gap-3">
        {step !== 'select' && step !== 'success' && (
          <button
            onClick={() => setStep(step === 'amount' ? 'select' : step === 'confirm' ? 'amount' : 'select')}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {step === 'success' ? 'Paiement effectué' : 'Payer'}
          </h1>
          <p className="text-sm text-gray-500">
            {step === 'select' && 'Choisissez votre mode de paiement'}
            {step === 'amount' && 'Entrez le montant'}
            {step === 'confirm' && 'Confirmez le paiement'}
            {step === 'success' && 'Transaction réussie'}
          </p>
        </div>
      </div>

      {/* Onglets mode */}
      {step === 'select' && (
        <div className="flex gap-1.5 p-1 bg-gray-100 rounded-2xl">
          {([
            { key: 'merchant', label: 'Marchand' },
            { key: 'qr',       label: 'Scanner QR' },
            { key: 'receive',  label: 'Recevoir' },
            { key: 'card',     label: 'Carte' },
          ] as const).map((m) => (
            <button
              key={m.key}
              onClick={() => setMethod(m.key)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                method === m.key ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Liste marchands */}
      {step === 'select' && method === 'merchant' && (
        <div className="grid grid-cols-2 gap-3">
          {merchants.map((merchant) => {
            const Icon = merchant.icon
            return (
              <button
                key={merchant.id}
                onClick={() => selectMerchant(merchant)}
                className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-brand-200 hover:shadow-card transition-all text-left flex items-center gap-3 active:scale-[0.97]"
              >
                <div className={`w-10 h-10 rounded-xl ${merchant.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{merchant.name}</p>
                  <p className="text-xs text-gray-400">{merchant.category}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Paiement par carte — redirige vers la page dédiée */}
      {step === 'select' && method === 'card' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-card text-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto">
            <CreditCard className="w-10 h-10 text-brand-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Payer par carte</h3>
            <p className="text-sm text-gray-500 mt-1">
              Utilisez votre carte CIB, DAHABIA ou BaridiMob pour payer en ligne
            </p>
          </div>
          <button
            onClick={() => router.push('/pay/card')}
            className="w-full py-4 bg-gradient-brand text-white font-semibold rounded-2xl shadow-card hover:shadow-card-hover active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            Payer par carte bancaire
          </button>
        </div>
      )}

      {/* Scanner QR réel */}
      {step === 'select' && method === 'qr' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-card text-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto">
            <QrCode className="w-10 h-10 text-brand-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Scanner un QR EcoPye</h3>
            <p className="text-sm text-gray-500 mt-1">
              Pointez la caméra vers le QR code du marchand pour payer instantanément
            </p>
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="w-full py-4 bg-gradient-brand text-white font-semibold rounded-2xl shadow-card hover:shadow-card-hover active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            Ouvrir la caméra
          </button>
        </div>
      )}

      {/* Recevoir — générer mon QR */}
      {step === 'select' && method === 'receive' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-card text-center space-y-4">
          {myQR ? (
            <>
              <p className="text-sm font-semibold text-gray-700">Mon QR EcoPye</p>
              <img
                src={myQR.qrDataUrl}
                alt="Mon QR Code EcoPye"
                className="mx-auto rounded-2xl border border-gray-200 w-52 h-52 object-contain"
              />
              <p className="text-xs text-gray-400 break-all">{myQR.shareUrl}</p>
              <a
                href={myQR.qrDataUrl}
                download="qr-ecopye.png"
                className="flex items-center justify-center gap-2 w-full py-3 bg-brand-50 text-brand-700 font-semibold rounded-2xl hover:bg-brand-100 transition-colors"
              >
                <Download className="w-4 h-4" />
                Télécharger le QR
              </a>
              <button
                onClick={() => setMyQR(null)}
                className="w-full py-3 text-sm text-gray-400 hover:text-gray-600"
              >
                Générer un nouveau QR
              </button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center mx-auto">
                <Download className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Recevoir un paiement</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Générez votre QR code personnel pour que vos clients ou proches vous paient en un scan
                </p>
              </div>
              <button
                onClick={generateMyQR}
                disabled={qrLoading}
                className="w-full py-4 bg-gradient-brand text-white font-semibold rounded-2xl shadow-card hover:shadow-card-hover active:scale-95 transition-all disabled:opacity-60"
              >
                {qrLoading ? 'Génération…' : 'Générer mon QR Code'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Montant */}
      {step === 'amount' && selectedMerchant && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl ${selectedMerchant.color} flex items-center justify-center flex-shrink-0`}>
              <selectedMerchant.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{selectedMerchant.name}</p>
              <p className="text-sm text-gray-500">{selectedMerchant.category}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Montant à payer</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0"
                  min={100}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-right text-3xl font-bold text-gray-900 bg-surface-50 rounded-xl px-4 py-5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  autoFocus
                />
                <span className="absolute right-4 bottom-2 text-sm text-gray-400 font-medium">DZD</span>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[500, 1000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(String(amt))}
                    className="text-xs py-2 px-1 bg-brand-50 text-brand-700 rounded-xl hover:bg-brand-100 font-medium"
                  >
                    {formatDZD(amt)}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Référence / Numéro de contrat (optionnel)"
              placeholder="Ex: N° facture, abonné..."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={() => parsedAmount >= 100 ? setStep('confirm') : toast.error('Montant minimum: 100 DZD')}
          >
            Continuer
          </Button>
        </div>
      )}

      {/* Confirmation */}
      {step === 'confirm' && selectedMerchant && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900">Résumé du paiement</h2>

            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className={`w-12 h-12 rounded-2xl ${selectedMerchant.color} flex items-center justify-center flex-shrink-0`}>
                <selectedMerchant.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{selectedMerchant.name}</p>
                <p className="text-sm text-gray-500">{selectedMerchant.category}</p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { label: 'Montant',    value: formatDZD(parsedAmount) },
                { label: 'Frais',      value: 'Gratuit' },
                ...(reference ? [{ label: 'Référence', value: reference }] : []),
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.label}</span>
                  <span className={`font-medium ${item.label === 'Frais' ? 'text-green-600' : 'text-gray-900'}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <span className="font-semibold text-gray-900">Total à débiter</span>
              <span className="font-bold text-brand-700 text-lg">{formatDZD(parsedAmount)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep('amount')}>
              Modifier
            </Button>
            <Button size="lg" className="flex-1" loading={loading} onClick={confirmPayment}>
              Payer maintenant
            </Button>
          </div>
        </div>
      )}

      {/* Succès */}
      {step === 'success' && (
        <div className="text-center space-y-5 py-4">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Paiement réussi !</h2>
            <p className="text-gray-500">
              <span className="font-semibold text-brand-600">{formatDZD(parsedAmount)}</span> payés à{' '}
              <span className="font-semibold">{selectedMerchant?.name}</span>
            </p>
            {txRef && (
              <p className="text-xs text-gray-400 mt-2 font-mono">Réf: {txRef}</p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => {
                setStep('select')
                setAmount('')
                setReference('')
                setSelectedMerchant(null)
              }}
            >
              Nouveau paiement
            </Button>
            <Button size="lg" className="flex-1" onClick={() => router.push('/dashboard')}>
              Accueil
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
