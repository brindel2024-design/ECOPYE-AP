'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import * as faceapi from 'face-api.js'
import { Scan, CheckCircle, XCircle, Loader } from 'lucide-react'

type Mode = 'enroll' | 'verify'

interface Props {
  mode: Mode
  onSuccess: (descriptor: number[]) => void
  onError?: (msg: string) => void
}

type Status = 'loading' | 'ready' | 'scanning' | 'success' | 'error'

export default function FaceAuth({ mode, onSuccess, onError }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('Chargement des modèles…')
  const [livenessCount, setLivenessCount] = useState(0)

  const MODELS_URL = '/models'
  const LIVENESS_THRESHOLD = 5  // nombre de frames avec mouvement détecté

  const loadModels = useCallback(async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL),
      ])
      setStatus('ready')
      setMessage(mode === 'enroll' ? 'Regardez la caméra et restez immobile' : 'Regardez la caméra pour vous identifier')
      startCamera()
    } catch {
      setStatus('error')
      setMessage('Impossible de charger les modèles IA')
      onError?.('Modèles non disponibles')
    }
  }, [mode, onError])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch {
      setStatus('error')
      setMessage('Accès à la caméra refusé')
      onError?.('Caméra inaccessible')
    }
  }

  const detectFace = useCallback(async () => {
    if (!videoRef.current || status !== 'ready') return
    setStatus('scanning')

    let prevDescriptor: Float32Array | null = null
    let stableFrames = 0
    const REQUIRED_STABLE = 10

    const loop = async () => {
      if (status === 'success') return

      const result = await faceapi
        .detectSingleFace(videoRef.current!, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()
        .withFaceExpressions()

      if (result) {
        const { descriptor, expressions } = result

        // Dessin du contour sur le canvas
        if (canvasRef.current && videoRef.current) {
          const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true)
          const resized = faceapi.resizeResults(result, dims)
          const ctx = canvasRef.current.getContext('2d')
          ctx?.clearRect(0, 0, dims.width, dims.height)
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resized)
        }

        // Détection de vivacité (liveness) — blink/expression check
        const hasExpression = Object.values(expressions).some(v => v > 0.3)
        if (hasExpression) setLivenessCount(c => c + 1)

        // Stabilité du descripteur
        if (prevDescriptor) {
          const dist = faceapi.euclideanDistance(Array.from(prevDescriptor), Array.from(descriptor))
          if (dist < 0.15) stableFrames++
          else stableFrames = 0
        }
        prevDescriptor = descriptor

        if (stableFrames >= REQUIRED_STABLE && livenessCount >= LIVENESS_THRESHOLD) {
          setStatus('success')
          setMessage(mode === 'enroll' ? 'Visage enregistré !' : 'Identité confirmée !')
          streamRef.current?.getTracks().forEach(t => t.stop())
          onSuccess(Array.from(descriptor))
          return
        }
      } else {
        setMessage('Aucun visage détecté — centrez votre visage')
      }

      requestAnimationFrame(loop)
    }

    loop()
  }, [status, mode, onSuccess, livenessCount])

  useEffect(() => {
    loadModels()
    return () => streamRef.current?.getTracks().forEach(t => t.stop())
  }, [loadModels])

  const statusColors: Record<Status, string> = {
    loading: 'text-gray-400', ready: 'text-brand-400',
    scanning: 'text-cyan-400', success: 'text-brand-500', error: 'text-red-400'
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Viewfinder */}
      <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-brand-500 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
        <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" muted playsInline />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full scale-x-[-1]" />

        {/* Overlay d'état */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          {status === 'loading' && <Loader className="animate-spin text-brand-400" size={40} />}
          {status === 'success' && <CheckCircle className="text-brand-500" size={56} />}
          {status === 'error' && <XCircle className="text-red-400" size={56} />}
        </div>

        {/* Coin scanners animés */}
        {status === 'scanning' && (
          <>
            <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-brand-400 rounded-tl-lg" />
            <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-brand-400 rounded-tr-lg" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-brand-400 rounded-bl-lg" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-brand-400 rounded-br-lg" />
          </>
        )}
      </div>

      {/* Message */}
      <p className={`text-sm font-medium text-center px-6 ${statusColors[status]}`}>
        {message}
      </p>

      {/* Indicateur de vivacité */}
      {status === 'scanning' && (
        <div className="flex flex-col items-center gap-2 w-48">
          <p className="text-xs text-gray-500">Détection de vivacité</p>
          <div className="w-full h-1.5 bg-surface-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-brand rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (livenessCount / LIVENESS_THRESHOLD) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">Clignez des yeux ou souriez légèrement</p>
        </div>
      )}

      {/* Bouton démarrer */}
      {status === 'ready' && (
        <button onClick={detectFace} className="btn-primary max-w-xs flex items-center justify-center gap-2">
          <Scan size={20} />
          {mode === 'enroll' ? 'Enregistrer mon visage' : 'M\'identifier'}
        </button>
      )}
    </div>
  )
}
