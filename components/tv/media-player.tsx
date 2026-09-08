"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import type { MediaContent } from "@/lib/types"
import { getEmbedUrl } from "@/lib/video-utils"
import { ensureHttpsUrl } from "@/lib/url"

interface MediaPlayerProps {
  contents: MediaContent[]
  onContentChange?: (content: MediaContent) => void
}

export function MediaPlayer({ contents, onContentChange }: MediaPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const contentsRef = useRef(contents)
  const onContentChangeRef = useRef(onContentChange)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    onContentChangeRef.current = onContentChange
  }, [onContentChange])

  useEffect(() => {
    contentsRef.current = contents
    if (currentIndex >= contents.length && contents.length > 0) {
      setCurrentIndex(0)
    }
  }, [contents, currentIndex])

  const currentContent = contents[currentIndex]

  const goToNext = useCallback(() => {
    const contentsList = contentsRef.current
    if (contentsList.length === 0) return

    // Limpa qualquer timer ativo antes de avançar
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => {
        const nextIndex = (prev + 1) % contentsList.length
        console.log("[MediaPlayer] Avançando para índice:", nextIndex, "de", contentsList.length)
        return nextIndex
      })
      setIsTransitioning(false)
    }, 500)
  }, [])

  useEffect(() => {
    if (!currentContent || contents.length === 0) return

    console.log(
      "[MediaPlayer] Conteúdo atual:",
      currentContent.title,
      "| Tipo:",
      currentContent.type,
      "| Duração:",
      currentContent.duration_seconds,
    )
    onContentChangeRef.current?.(currentContent)

    // Limpa timer anterior
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (currentContent.type === "image") {
      // Imagem: avança após duração definida (padrão 10s)
      const duration = (currentContent.duration_seconds || 10) * 1000
      console.log("[MediaPlayer] Imagem - timer de", duration, "ms")
      timerRef.current = setTimeout(goToNext, duration)
    } else if (currentContent.type === "youtube") {
      // YouTube: timer de segurança baseado na duração configurada
      // O iframe não emite eventos onEnded, então usamos timer
      const duration = (currentContent.duration_seconds || 60) * 1000
      console.log("[MediaPlayer] YouTube - timer de segurança:", duration, "ms")
      timerRef.current = setTimeout(goToNext, duration)
    } else if (currentContent.type === "video") {
      // Vídeo nativo: avança pelo onEnded, mas garante timeout máximo de segurança
      // Usa duration_seconds como backup caso o vídeo trave (máximo 10 minutos se não configurado)
      const maxDuration = (currentContent.duration_seconds || 600) * 1000
      console.log("[MediaPlayer] Vídeo - timeout máximo de segurança:", maxDuration, "ms")
      timerRef.current = setTimeout(() => {
        console.log("[MediaPlayer] Vídeo - timeout de segurança atingido, avançando")
        goToNext()
      }, maxDuration)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [currentContent?.id, currentContent?.type, currentContent?.duration_seconds, goToNext])

  const handleVideoEnded = useCallback(() => {
    console.log("[MediaPlayer] Vídeo terminou, avançando para próximo")
    goToNext()
  }, [goToNext])

  const handleVideoError = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.log("[MediaPlayer] Erro no vídeo, pulando:", e.currentTarget.error?.message)
    setTimeout(goToNext, 1000)
  }, [goToNext])

  const handleVideoCanPlay = useCallback(() => {
    // Garante que o vídeo realmente inicia reprodução
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log("[MediaPlayer] Erro ao iniciar vídeo (autoplay bloqueado?):", err)
        // Se autoplay bloqueado, tenta muted + play
        if (videoRef.current) {
          videoRef.current.muted = true
          videoRef.current.play().catch(() => {
            console.log("[MediaPlayer] Falha total no autoplay, avançando em 5s")
            setTimeout(goToNext, 5000)
          })
        }
      })
    }
  }, [goToNext])

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log("[MediaPlayer] Erro na imagem")
    e.currentTarget.src = "/content-unavailable.jpg"
  }

  if (contents.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-[#003B71]">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">📺</div>
          <h2 className="text-3xl font-bold">SENAI Cast</h2>
          <p className="text-xl opacity-80 mt-2">Aguardando conteúdo...</p>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    if (!currentContent) return null

    if (currentContent.type === "youtube") {
      const safeUrl = ensureHttpsUrl(currentContent.file_url)
      // IMPORTANTE: loop=0 para o YouTube avançar para o próximo conteúdo
      // O timer de segurança (duration_seconds) garante a troca mesmo sem evento onEnded
      const embedUrl = getEmbedUrl(safeUrl)
      console.log("[MediaPlayer] YouTube embed URL:", embedUrl)
      if (embedUrl) {
        return (
          <iframe
            key={currentContent.id}
            src={embedUrl}
            className="h-full w-full max-h-full max-w-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            style={{ border: "none" }}
          />
        )
      }
      return (
        <div className="w-full h-full flex items-center justify-center bg-[#003B71] text-white">
          <p>URL de vídeo inválida</p>
        </div>
      )
    }

    if (currentContent.type === "video") {
      const safeUrl = ensureHttpsUrl(currentContent.file_url)
      return (
        <video
          key={currentContent.id}
          ref={videoRef}
          src={safeUrl}
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnded}
          onError={handleVideoError}
          onCanPlay={handleVideoCanPlay}
          className="max-h-full max-w-full object-contain"
        />
      )
    }

    // Imagem
    const safeUrl = ensureHttpsUrl(currentContent.file_url)
    return (
      <img
        key={currentContent.id}
        src={safeUrl || "/placeholder.svg"}
        alt={currentContent.title}
        className="max-h-full max-w-full object-contain"
        onError={handleImageError}
      />
    )
  }

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${isTransitioning ? "opacity-0" : "opacity-100"}`}
      >
        {renderContent()}
      </div>

      {/* Indicador de conteúdo */}
      {contents.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {contents.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${index === currentIndex ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
