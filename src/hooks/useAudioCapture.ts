import { useCallback, useRef, useState } from 'react'

export type AudioCaptureState = 'idle' | 'requesting' | 'capturing' | 'paused' | 'error'

export interface UseAudioCaptureOptions {
  onAudioChunk: (data: string, mimeType: string) => void
  onError?: (error: Error) => void
  chunkIntervalMs?: number
}

export interface UseAudioCaptureReturn {
  state: AudioCaptureState
  error: string | null
  startCapture: () => Promise<void>
  stopCapture: () => void
  pauseCapture: () => void
  resumeCapture: () => void
}

export function useAudioCapture({
  onAudioChunk,
  onError,
  chunkIntervalMs = 250,
}: UseAudioCaptureOptions): UseAudioCaptureReturn {
  const [state, setState] = useState<AudioCaptureState>('idle')
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCapture = useCallback(async () => {
    try {
      setState('requesting')
      setError(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })

      streamRef.current = stream

      // Pick the best supported MIME type
      const mimeType = getSupportedMimeType()
      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      })

      recorder.ondataavailable = async (event) => {
        if (event.data.size === 0) return
        const buffer = await event.data.arrayBuffer()
        const base64 = arrayBufferToBase64(buffer)
        onAudioChunk(base64, mimeType)
      }

      recorder.onerror = (event) => {
        const err = new Error(`MediaRecorder error: ${event.type}`)
        setError(err.message)
        setState('error')
        onError?.(err)
      }

      mediaRecorderRef.current = recorder
      recorder.start(chunkIntervalMs)
      setState('capturing')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to capture audio')
      setError(error.message)
      setState('error')
      onError?.(error)
    }
  }, [onAudioChunk, onError, chunkIntervalMs])

  const stopCapture = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    mediaRecorderRef.current = null
    setState('idle')
  }, [])

  const pauseCapture = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause()
      setState('paused')
    }
  }, [])

  const resumeCapture = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume()
      setState('capturing')
    }
  }, [])

  return { state, error, startCapture, stopCapture, pauseCapture, resumeCapture }
}

function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ]
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
