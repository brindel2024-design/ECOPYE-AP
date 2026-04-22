'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle, Loader2, Scan, XCircle } from 'lucide-react'

// Import dynamique pour éviter les erreurs SSR
let faceapi: typeof import('face-api.js') | null = null

type Mode = 'enroll' | 'verify'
type Status = 'loading' | 'ready' | 'scanning' | 'success' | 'error'

interface Props {
  mode: Mode
  onSuccess: (descriptor: number[]) => void
  onError?: (msg: string) => void
  className?: string
}

const MODELS_URL = '/models'
const FACE_THRESHOLD = 0.5
const STABLE_FRAMES = 12
const LIVENESS_MIN = 4

export default function FaceCapture({ mode, onSuccess, onError, className }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const loopRef   = useRef<number | null>(null)

  const [status,       setStatus]       = useState<Status>('loading')
  const [message,      setMessage]      = useState('Chargement IA…')
  const [liveness,     setLiveness]     = useState(0)
  const [stableCount,  setStableCount]  = useState(0)

  const stopAll = useCallback(() => {
    if (loopRef.current) cancelAnimationFrame(loopRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  const loadModels = useCallback(async () => {
    try {
      faceapi = await import('face-api.js')
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL),
      ])
      setStatus('ready')
      setMessage(
        mode === 'enroll'
          ? 'Modèles prêts — appuyez pour enregistrer votre visage'
          : 'Prêt — appuyez pour vous identifier'
      )
    } catch {
      setStatus('error')
      setMessage('Impossible de charger les modèles IA')
      onError?.('Modèles non disponibles. Téléchargez-les avec : npm run models:download')
    }
  }, [mode, onError])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch {
      setStatus('error')
      setMessage('Accès à la caméra refusé — vérifiez les permissions')
      onError?.('Caméra inaccessible')
    }
  }, [onError])

  const startDetection = useCallback(async () => {
    if (!faceapi || !videoRef.current) return
    await startCamera()
    setStatus('scanning')
    setMessage('Regardez la caméra…')

    let prev: Float32Array | null = null
    let stable = 0
    let live = 0

    const loop = async () => {
      if (!videoRef.current || !faceapi) return

      const result = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
        .withFaceLandmarks()
        .withFaceDescriptor()
        .withFaceExpressions()

      if (result) {
        const { descriptor, expressions } = result

        // Rendu landmarks
        if (canvasRef.current && videoRef.current) {
          const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true)
          faceapi.draw.drawFaceLandmarks(canvasRef.current, faceapi.resizeResults(result, dims))
        }

        // Liveness — expressions naturelles
        const maxExpr = Math.max(...Object.values(expressions))
        if (maxExpr > 0.25) { live++; setLiveness(Math.min(live, LIVENESS_MIN)) }

        // Stabilité du descripteur
        if (prev) {
          const dist = Math.sqrt(Array.from(prev).reduce((s, v, i) => s + (v - descriptor[i]) ** 2, 0))
          stable = dist < 0.12 ? stable + 1 : 0
          setStableCount(Math.min(stable, STABLE_FRAMES))
        }
        prev = descriptor

        if (stable >= STABLE_FRAMES && live >= LIVENESS_MIN) {
          setStatus('success')
          setMessage(mode === 'enroll' ? 'Visage enregistré avec succès !' : 'Identité vérifiée !')
          stopAll()
          onSuccess(Array.from(descriptor))
          return
        }
      } else {
        setMessage('Centrez votre visage dans le cadre')
        stable = 0
      }

      loopRef.current = requestAnimationFrame(loop)
    }

    loopRef.current = requestAnimationFrame(loop)
  }, [mode, onSuccess, startCamera, stopAll])

  useEffect(() => {
    loadModels()
    return stopAll
  }, [loadModels, stopAll])

  const progressStable  = Math.round((stableCount / STABLE_FRAMES) * 100)
  const progressLive    = Math.round((liveness / LIVENESS_MIN) * 100)

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Cercle caméra */}
      <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-brand-500 shadow-wallet">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
          muted
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Overlay état */}
        {status !== 'scanning' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            {status === 'loading'  && <Loader2 className="animate-spin text-brand-400" size={48} />}
            {status === 'success'  && <CheckCircle className="text-success-500" size={64} />}
            {status === 'error'    && <XCircle className="text-red-400" size={64} />}
          </div>
        )}

        {/* Coins de scan */}
        {status === 'scanning' && ['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map(pos => (
          <div key={pos} className={`absolute w-6 h-6 border-brand-400 border-2 ${pos.includes('top') ? 'border-b-0' : 'border-t-0'} ${pos.includes('left') ? 'border-r-0 rounded-tl' : 'border-l-0 rounded-tr'}`} />
        ))}
      </div>

      {/* Message */}
      <p className={`text-sm font-medium text-center px-4 ${
        status === 'error' ? 'text-red-600' :
        status === 'success' ? 'text-success-600' : 'text-gray-600'
      }`}>
        {message}
      </p>

      {/* Barres de progression */}
      {status === 'scanning' && (
        <div className="w-full max-w-xs space-y-2">
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Stabilité du visage</span>
              <span>{progressStable}%</span>
            </div>
            <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-brand rounded-full transition-all duration-200" style={{ width: `${progressStable}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Détection de vivacité</span>
              <span>{progressLive}%</span>
            </div>
            <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-brand rounded-full transition-all duration-200" style={{ width: `${progressLive}%` }} />
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center">Clignez légèrement des yeux ou souriez</p>
        </div>
      )}

      {/* Bouton démarrer */}
      {status === 'ready' && (
        <button
          onClick={startDetection}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-brand text-white font-semibold rounded-2xl shadow-card hover:shadow-card-hover transition-shadow active:scale-95"
        >
          <Scan size={20} />
          {mode === 'enroll' ? 'Enregistrer mon visage' : 'M\'identifier par le visage'}
        </button>
      )}
    </div>
  )
}
