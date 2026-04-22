'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { X, Flashlight } from 'lucide-react'

interface Props {
  onScan: (data: string) => void
  onClose: () => void
}

export default function QRScanner({ onScan, onClose }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const loopRef   = useRef<number | null>(null)
  const [error, setError] = useState('')
  const [torch, setTorch] = useState(false)

  const stopAll = useCallback(() => {
    if (loopRef.current) cancelAnimationFrame(loopRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  const scan = useCallback(() => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
      loopRef.current = requestAnimationFrame(scan)
      return
    }

    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })

    if (code?.data) {
      stopAll()
      onScan(code.data)
      return
    }

    loopRef.current = requestAnimationFrame(scan)
  }, [onScan, stopAll])

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 }, height: { ideal: 720 },
        },
      })
      .then(stream => {
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().then(() => { loopRef.current = requestAnimationFrame(scan) })
        }
      })
      .catch(() => setError('Impossible d\'accéder à la caméra'))

    return stopAll
  }, [scan, stopAll])

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch } as any] })
      setTorch(t => !t)
    } catch { /* torch non supporté */ }
  }, [torch])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Barre haute */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-gradient-to-b from-black/70 to-transparent absolute top-0 left-0 right-0 z-10">
        <p className="text-white font-semibold text-lg">Scanner QR Code</p>
        <div className="flex items-center gap-3">
          <button onClick={toggleTorch} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center" aria-label="Lampe torche">
            <Flashlight size={20} className={torch ? 'text-yellow-300' : 'text-white'} />
          </button>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center" aria-label="Fermer">
            <X size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* Flux vidéo */}
      <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />

      {/* Viseur */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-72 h-72">
          {/* Fond assombri autour */}
          <div className="absolute -inset-[100vmax] bg-black/50" />
          {/* Zone de scan transparente */}
          <div className="absolute inset-0 rounded-3xl" style={{ boxShadow: '0 0 0 100vmax rgba(0,0,0,0.5)' }} />
          {/* Coins */}
          {[
            'top-0 left-0 border-t-4 border-l-4 rounded-tl-3xl',
            'top-0 right-0 border-t-4 border-r-4 rounded-tr-3xl',
            'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-3xl',
            'bottom-0 right-0 border-b-4 border-r-4 rounded-br-3xl',
          ].map((cls, i) => (
            <div key={i} className={`absolute w-10 h-10 border-brand-400 ${cls}`} />
          ))}
          {/* Ligne de scan animée */}
          <div className="absolute left-3 right-3 h-0.5 bg-brand-400/80 animate-bounce" style={{ top: '50%' }} />
        </div>
      </div>

      {/* Message bas */}
      <div className="absolute bottom-0 left-0 right-0 pb-12 bg-gradient-to-t from-black/70 to-transparent">
        {error
          ? <p className="text-center text-red-400 text-sm px-6">{error}</p>
          : <p className="text-center text-white/70 text-sm">Pointez vers un QR Code EcoPye</p>
        }
      </div>
    </div>
  )
}
