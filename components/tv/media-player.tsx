"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import type { MediaContent } from "@/lib/types"
import { getEmbedUrl } from "@/lib/video-utils"
import { ensureHttpsUrl } from "@/lib/url"
import { LivePlayer } from "./live-player"

interface MediaPlayerProps {
  contents: MediaContent[]
  onContentChange?: (content: MediaContent) => void
}

export function MediaPlayer({ contents, onContentChange }: MediaPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [opacity, setOpacity] = useState(1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentsRef = useRef(contents)
  const onContentChangeRef = useRef(onContentChange)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => { onContentChangeRef.current = onContentChange }, [onContentChange])

  useEffect(() => {
    contentsRef.current = contents
    if (currentIndex >= contents.length && contents.length > 0) {
      setCurrentIndex(0)
    }
  }, [contents, currentIndex])

  const currentContent = contents[currentIndex]

  const goToNext = useCallback(() => {
    const list = contentsRef.current
    if (list.length === 0) return
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }

    // Fade out
    setOpacity(0)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % list.length)
      setOpacity(1)
    }, 400)
  }, [])

  useEffect(() => {
    if (!currentContent || contents.length === 0) return

    onContentChangeRef.current?.(currentContent)
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }

    if (currentContent.type === "image") {
      const duration = (currentContent.duration_seconds || 10) * 1000
      timerRef.current = setTimeout(goToNext, duration)
    } else if (currentContent.type === "youtube" || currentContent.type === "live") {
      const duration = (currentContent.duration_seconds || (currentContent.type === "live" ? 300 : 60)) * 1000
      timerRef.current = setTimeout(goToNext, duration)
    } else if (currentContent.type === "video") {
      if (!currentContent.loop_video) {
        const maxDuration = (currentContent.duration_seconds || 600) * 1000
        timerRef.current = setTimeout(goToNext, maxDuration)
      }
    }

    return () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null } }
  }, [currentContent?.id, currentContent?.type, currentContent?.duration_seconds, currentContent?.loop_video, goToNext])

  const handleVideoEnded = useCallback(() => { goToNext() }, [goToNext])

  const handleVideoError = useCallback(() => {
    setTimeout(goToNext, 1000)
  }, [goToNext])

  const handleVideoCanPlay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        if (videoRef.current) {
          videoRef.current.muted = true
          videoRef.current.play().catch(() => setTimeout(goToNext, 5000))
        }
      })
    }
  }, [goToNext])

  if (contents.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#003B71",
        }}
      >
        <div style={{ textAlign: "center", color: "#ffffff" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>📺</div>
          <h2 style={{ margin: 0, fontSize: "32px", fontWeight: 700 }}>SENAI Cast</h2>
          <p style={{ margin: "8px 0 0", fontSize: "20px", opacity: 0.8 }}>Aguardando conteúdo...</p>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    if (!currentContent) return null

    if (currentContent.type === "live") {
      return <LivePlayer src={currentContent.file_url} />
    }

    if (currentContent.type === "youtube") {
      const embedUrl = getEmbedUrl(ensureHttpsUrl(currentContent.file_url))
      if (embedUrl) {
        return (
          <iframe
            key={currentContent.id}
            src={embedUrl}
            style={{ width: "100%", height: "100%", border: "none" }}
            allow="autoplay; encrypted-media"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        )
      }
      return (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#003B71", color: "#fff" }}>
          <p>URL de vídeo inválida</p>
        </div>
      )
    }

    if (currentContent.type === "video") {
      return (
        <video
          key={currentContent.id}
          ref={videoRef}
          src={ensureHttpsUrl(currentContent.file_url)}
          autoPlay
          muted
          playsInline
          loop={currentContent.loop_video === true}
          onEnded={currentContent.loop_video ? undefined : handleVideoEnded}
          onError={handleVideoError}
          onCanPlay={handleVideoCanPlay}
          style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", display: "block" }}
        />
      )
    }

    // Image
    return (
      <img
        key={currentContent.id}
        src={ensureHttpsUrl(currentContent.file_url) || "/placeholder.svg"}
        alt={currentContent.title}
        style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", display: "block" }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg" }}
      />
    )
  }

  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        backgroundColor: "#000000",
      }}
    >
      {/* Transition wrapper */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity,
          transition: "opacity 0.4s ease",
        }}
      >
        {renderContent()}
      </div>

      {/* Dot indicators */}
      {contents.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "8px",
            zIndex: 10,
          }}
        >
          {contents.map((_, index) => (
            <div
              key={index}
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: index === currentIndex ? "#ffffff" : "rgba(255,255,255,0.35)",
                transition: "background-color 0.3s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
