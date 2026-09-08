"use client"

import { useEffect, useState } from "react"
import type { InstitutionSettings } from "@/lib/types"
import { ensureHttpsUrl } from "@/lib/url"

interface TVHeaderProps {
  institution: InstitutionSettings
}

export function TVHeader({ institution }: TVHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const logoSrc = ensureHttpsUrl(institution.logo_url || "/placeholder.svg")

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <header className="flex items-center justify-between px-6 py-2 bg-[#E30613] text-white">
      <div className="flex items-center gap-4">
        <img
          src={logoSrc}
          alt="Logo SENAI"
          className="h-10 w-auto object-contain bg-white rounded px-2 py-1"
        />
        <h1 className="text-xl font-bold tracking-tight">{institution.name}</h1>
      </div>
      <div className="text-right">
        <div className="text-3xl font-bold tabular-nums">{formatTime(currentTime)}</div>
        <div className="text-base capitalize opacity-90">{formatDate(currentTime)}</div>
      </div>
    </header>
  )
}
