"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Snowflake,
  Sun,
} from "lucide-react"
import type { InstitutionSettings } from "@/lib/types"
import type { OverlayBox, TVOverlayLayout } from "@/lib/tv-overlay"
import { overlayStyle } from "@/lib/tv-overlay"
import { ensureHttpsUrl } from "@/lib/url"

interface TVHeaderProps {
  institution: InstitutionSettings
  overlay: TVOverlayLayout
}

type WeatherIconName =
  | "sun"
  | "cloud-sun"
  | "cloud"
  | "cloud-fog"
  | "cloud-drizzle"
  | "cloud-rain"
  | "snowflake"
  | "cloud-lightning"

interface WeatherState {
  city: string
  temperature: number
  humidity: number | null
  label: string
  icon: WeatherIconName
}

const WEATHER_ICONS = {
  sun: Sun,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  "cloud-fog": CloudFog,
  "cloud-drizzle": CloudDrizzle,
  "cloud-rain": CloudRain,
  snowflake: Snowflake,
  "cloud-lightning": CloudLightning,
}

function OverlayPanel({
  box,
  children,
  className = "",
}: {
  box: OverlayBox
  children: ReactNode
  className?: string
}) {
  if (!box.visible) return null
  return (
    <div style={overlayStyle(box)} className={`pointer-events-none ${className}`}>
      {children}
    </div>
  )
}

export function TVHeader({ institution, overlay }: TVHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [weather, setWeather] = useState<WeatherState | null>(null)
  const logoSrc = institution.logo_url ? ensureHttpsUrl(institution.logo_url) : null

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadWeather = async () => {
      try {
        const res = await fetch("/api/weather")
        if (!res.ok) return
        const data = await res.json()
        if (cancelled || data.error) return
        setWeather({
          city: data.city,
          temperature: data.temperature,
          humidity: data.humidity,
          label: data.label,
          icon: data.icon,
        })
      } catch {
        // Keep last known weather if the refresh fails
      }
    }

    loadWeather()
    const weatherTimer = setInterval(loadWeather, 10 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(weatherTimer)
    }
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

  const WeatherIcon = weather ? WEATHER_ICONS[weather.icon] : Cloud

  return (
    <>
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <filter id="tv-logo-knockout-white" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    -1 -1 -1 3 0"
          />
        </filter>
      </svg>

      <OverlayPanel box={overlay.logo}>
        <div className="flex items-center gap-3 bg-transparent">
          {logoSrc && (
            <img
              src={logoSrc}
              alt=""
              className="h-14 w-auto max-w-full bg-transparent object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]"
              style={{ filter: "url(#tv-logo-knockout-white)", background: "transparent" }}
            />
          )}
          <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]">
            {institution.name}
          </h1>
        </div>
      </OverlayPanel>

      <OverlayPanel box={overlay.weather}>
        {weather && (
          <div className="flex items-center gap-3 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]">
            <WeatherIcon className="h-10 w-10 shrink-0" aria-hidden="true" />
            <div className="leading-tight">
              <div className="text-3xl font-bold tabular-nums">{weather.temperature}°</div>
              <div className="text-sm capitalize opacity-90">
                {weather.city} · {weather.label}
              </div>
            </div>
          </div>
        )}
      </OverlayPanel>

      <OverlayPanel box={overlay.clock}>
        <div className="text-right text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]">
          <div className="text-3xl font-bold tabular-nums">{formatTime(currentTime)}</div>
          <div className="text-base capitalize opacity-90">{formatDate(currentTime)}</div>
        </div>
      </OverlayPanel>
    </>
  )
}
