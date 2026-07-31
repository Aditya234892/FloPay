import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import jsQR from 'jsqr'
import { AlertCircle, ImageIcon, X, Zap, ZapOff } from 'lucide-react'

interface ScannedPayee {
  vpa: string
  name: string | null
}

/** Our own scheme (see ReceiveScreen) — not a real UPI intent. */
function parsePayload(raw: string): ScannedPayee | null {
  if (!raw.startsWith('flopay://pay?')) return null
  const params = new URLSearchParams(raw.slice('flopay://pay?'.length))
  const vpa = params.get('vpa')
  if (!vpa) return null
  return { vpa, name: params.get('name') }
}

function decodeImageData(data: ImageData): string | null {
  return jsQR(data.data, data.width, data.height)?.data ?? null
}

export function ScanScreen() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handledRef = useRef(false)

  const [cameraError, setCameraError] = useState<string | null>(null)
  const [decodeError, setDecodeError] = useState<string | null>(null)
  const [torchOn, setTorchOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const handleResult = useCallback(
    (raw: string) => {
      if (handledRef.current) return
      const payee = parsePayload(raw)
      if (!payee) {
        setDecodeError('That QR code isn’t a FloPay payment code.')
        setTimeout(() => setDecodeError(null), 2000)
        return
      }
      handledRef.current = true
      stopCamera()
      navigate('/send', { state: { toVpa: payee.vpa, toName: payee.name } })
    },
    [navigate, stopCamera],
  )

  useEffect(() => {
    let cancelled = false

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const track = stream.getVideoTracks()[0]
        const capabilities = track?.getCapabilities?.()
        setTorchSupported(!!capabilities && 'torch' in capabilities)

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        const tick = () => {
          const video = videoRef.current
          const canvas = canvasRef.current
          if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d', { willReadFrequently: true })
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
              const result = decodeImageData(imageData)
              if (result) handleResult(result)
            }
          }
          rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
      } catch {
        if (!cancelled) {
          setCameraError('Camera access was denied or unavailable. Enter the VPA manually instead.')
        }
      }
    }

    void start()
    return () => {
      cancelled = true
      stopCamera()
    }
  }, [handleResult, stopCamera])

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      // `torch` is a real, widely-supported constraint on Android Chrome, but
      // it isn't part of TypeScript's lib.dom MediaTrackConstraintSet.
      await track.applyConstraints({
        advanced: [{ torch: !torchOn } as unknown as MediaTrackConstraintSet],
      })
      setTorchOn((prev) => !prev)
    } catch {
      // Some browsers report torch capability but reject the constraint anyway.
    }
  }

  const handleGalleryPick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const result = decodeImageData(imageData)
        if (result) {
          handleResult(result)
        } else {
          setDecodeError('No QR code found in that image.')
          setTimeout(() => setDecodeError(null), 2000)
        }
      }
      URL.revokeObjectURL(url)
    }
    img.src = url
    event.target.value = ''
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />

      <div
        className="absolute inset-x-0 top-0 flex items-center justify-between px-5"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        <button
          type="button"
          onClick={() => {
            stopCamera()
            navigate(-1)
          }}
          aria-label="Close scanner"
          className="tap-target grid h-11 w-11 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm"
        >
          <X className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold text-white">Scan to pay</p>
        <button
          type="button"
          onClick={toggleTorch}
          disabled={!torchSupported}
          aria-label="Toggle torch"
          className="tap-target grid h-11 w-11 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm disabled:opacity-30"
        >
          {torchOn ? <ZapOff className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
        </button>
      </div>

      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="relative h-64 w-64">
          {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((corner) => (
            <span
              key={corner}
              className={`absolute h-9 w-9 border-brand-500 ${
                corner === 'top-left'
                  ? 'top-0 left-0 rounded-tl-2xl border-t-4 border-l-4'
                  : corner === 'top-right'
                    ? 'top-0 right-0 rounded-tr-2xl border-t-4 border-r-4'
                    : corner === 'bottom-left'
                      ? 'bottom-0 left-0 rounded-bl-2xl border-b-4 border-l-4'
                      : 'right-0 bottom-0 rounded-br-2xl border-r-4 border-b-4'
              }`}
            />
          ))}
          <motion.div
            className="absolute inset-x-2 h-0.5 rounded-full bg-brand-500 shadow-[0_0_12px_2px_rgba(37,99,235,0.7)]"
            animate={{ top: ['4%', '92%', '4%'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 px-6 pb-8"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}
      >
        <AnimatePresence>
          {(cameraError || decodeError) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-2xl bg-rose-500/90 px-4 py-2.5 text-sm font-medium text-white"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {cameraError ?? decodeError}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-white/70">Point your camera at a FloPay QR code</p>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="tap-target inline-flex items-center gap-2 rounded-2xl bg-white/15 px-5 text-sm font-semibold text-white backdrop-blur-sm active:bg-white/25"
        >
          <ImageIcon className="h-4 w-4" />
          Upload from gallery
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleGalleryPick}
          className="hidden"
        />

        {cameraError && (
          <button
            type="button"
            onClick={() => navigate('/send')}
            className="tap-target text-sm font-semibold text-brand-400 underline underline-offset-2"
          >
            Enter VPA manually instead
          </button>
        )}
      </div>
    </div>
  )
}
