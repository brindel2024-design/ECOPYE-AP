'use client'
import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { Camera, X } from 'lucide-react'

interface Props {
  onScan: (data: string) => void
  onClose: () => void
}

export default function QRScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setScanning(true)
        scanFrame()
      }
    } catch {
      setError('Impossible d\'accéder à la caméra')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    setScanning(false)
  }

  const scanFrame = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanFrame)
      return
    }

    canvas.height = video.videoHeight
    canvas.width = video.videoWidth
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    })

    if (code?.data) {
      stopCamera()
      onScan(code.data)
      return
    }

    requestAnimationFrame(scanFrame)
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 safe-top">
        <p className="text-white font-semibold">Scanner un QR Code</p>
        <button onClick={onClose} className="p-2 rounded-full bg-white/10 tap-feedback" aria-label="Fermer">
          <X size={20} className="text-white" />
        </button>
      </div>

      <div className="flex-1 relative">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />

        {/* Viseur */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-64 h-64">
            <div className="absolute inset-0 border-2 border-brand-500 rounded-2xl" />
            {/* Coins */}
            {[['top-0 left-0', 'border-t-4 border-l-4 rounded-tl-2xl'],
              ['top-0 right-0', 'border-t-4 border-r-4 rounded-tr-2xl'],
              ['bottom-0 left-0', 'border-b-4 border-l-4 rounded-bl-2xl'],
              ['bottom-0 right-0', 'border-b-4 border-r-4 rounded-br-2xl']
            ].map(([pos, style]) => (
              <div key={pos} className={`absolute w-8 h-8 border-brand-400 ${pos} ${style}`} />
            ))}
            {/* Ligne de scan animée */}
            <div className="absolute left-2 right-2 h-0.5 bg-brand-400 animate-bounce top-1/2" />
          </div>
        </div>

        {error && (
          <div className="absolute inset-x-4 top-4 bg-red-500/90 text-white p-3 rounded-2xl text-center text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="p-6 safe-bottom text-center text-gray-400 text-sm">
        Pointez la caméra vers un QR Code EcoPye
      </div>
    </div>
  )
}
