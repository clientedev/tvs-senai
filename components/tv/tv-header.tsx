"use client"

import { useEffect, useState } from "react"
import type { InstitutionSettings } from "@/lib/types"
import type { TVOverlayLayout } from "@/lib/tv-overlay"
import { ensureHttpsUrl } from "@/lib/url"

interface TVHeaderProps {
  institution: InstitutionSettings
  overlay: TVOverlayLayout
}

interface WeatherState {
  city: string
  temperature: number
  label: string
}

// Emoji simples para clima — sem dependência de lucide-react no browser da TV
function weatherEmoji(label: string): string {
  const l = label.toLowerCase()
  if (l.includes("chuva") || l.includes("chu")) return "🌧"
  if (l.includes("trovoada") || l.includes("relâmpago")) return "⛈"
  if (l.includes("nublado") || l.includes("nublada") || l.includes("nuvem")) return "☁"
  if (l.includes("parcialmente")) return "⛅"
  if (l.includes("neve")) return "❄"
  if (l.includes("neblina") || l.includes("névoa")) return "🌫"
  if (l.includes("garoa") || l.includes("chuvisco")) return "🌦"
  return "☀"
}

export function TVHeader({ institution, overlay }: TVHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [weather, setWeather] = useState<WeatherState | null>(null)

  const logoSrc = institution.logo_url ? ensureHttpsUrl(institution.logo_url) : null
  const showLogo    = overlay.logo.visible
  const showWeather = overlay.weather.visible
  const showClock   = overlay.clock.visible

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!showWeather) return
    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch("/api/weather")
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (cancelled || data.error) return
        setWeather({ city: data.city, temperature: data.temperature, label: data.label })
      } catch { /* silently ignore on TV */ }
    }

    load()
    const t = setInterval(load, 10 * 60 * 1000)
    return () => { cancelled = true; clearInterval(t) }
  }, [showWeather])

  if (!showLogo && !showWeather && !showClock) return null

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

  const formatDate = (d: Date) =>
    d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })

  return (
    <header
      style={{
        position: "relative",
        zIndex: 30,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        flexShrink: 0,
        backgroundColor: "#111111",
        borderBottom: "4px solid #E30613",
        color: "#ffffff",
        padding: "0 32px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* ── Logo + Nome ── */}
      {showLogo ? (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {logoSrc && (
            <img
              src={logoSrc}
              alt=""
              style={{
                height: "56px",
                width: "auto",
                maxWidth: "200px",
                objectFit: "contain",
                flexShrink: 0,
                marginRight: "20px",
              }}
            />
          )}
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#E30613",
              }}
            >
              Climatização e Refrigeração
            </p>
            <h1
              style={{
                margin: 0,
                fontSize: "26px",
                fontWeight: 700,
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: "#ffffff",
              }}
            >
              {institution.name}
            </h1>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}

      {/* ── Widgets à direita ── */}
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", flexShrink: 0 }}>

        {/* Clima */}
        {showWeather && weather && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#1d1d1d",
              borderRadius: "14px",
              padding: "10px 18px",
              marginRight: "12px",
            }}
          >
            <span style={{ fontSize: "32px", lineHeight: "1", marginRight: "12px" }}>{weatherEmoji(weather.label)}</span>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#ffffff" }}>
                {weather.temperature}°
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", textTransform: "capitalize" }}>
                {weather.city} · {weather.label}
              </div>
            </div>
          </div>
        )}

        {/* Relógio */}
        {showClock && (
          <div
            style={{
              flexShrink: 0,
              minWidth: "190px",
              backgroundColor: "#1d1d1d",
              borderRadius: "14px",
              padding: "10px 18px",
              textAlign: "right",
            }}
          >
            <div
              style={{
                fontSize: "34px",
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                color: "#ffffff",
              }}
            >
              {formatTime(currentTime)}
            </div>
            <div
              style={{
                marginTop: "4px",
                fontSize: "12px",
                color: "rgba(255,255,255,0.6)",
                textTransform: "capitalize",
              }}
            >
              {formatDate(currentTime)}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
