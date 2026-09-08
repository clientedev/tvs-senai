"use client"

import { useEffect, useRef } from "react"
import { ensureHttpsUrl } from "@/lib/url"

interface LivePlayerProps {
  src: string
}

export function LivePlayer({ src }: LivePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const url = ensureHttpsUrl(src)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !url) return

    let hls: { destroy: () => void } | null = null
    let cancelled = false

    const start = async () => {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url
        await video.play().catch(() => undefined)
        return
      }

      const { default: Hls } = await import("hls.js")
      if (cancelled || !Hls.isSupported()) return

      const instance = new Hls({ enableWorker: true })
      hls = instance
      instance.loadSource(url)
      instance.attachMedia(video)
      instance.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => undefined)
      })
    }

    start().catch(() => undefined)

    return () => {
      cancelled = true
      if (hls) hls.destroy()
      video.removeAttribute("src")
      video.load()
    }
  }, [url])

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="max-h-full max-w-full object-contain"
    />
  )
}
