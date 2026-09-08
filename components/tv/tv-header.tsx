"use client"

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
import type { TVOverlayLayout } from "@/lib/tv-overlay"
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

export function TVHeader({ institution, overlay }: TVHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [weather, setWeather] = useState<WeatherState | null>(null)
  const logoSrc = institution.logo_url ? ensureHttpsUrl(institution.logo_url) : null
  const showLogo = overlay.logo.visible
  const showWeather = overlay.weather.visible
  const showClock = overlay.clock.visible

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!showWeather) return
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
  }, [showWeather])

  if (!showLogo && !showWeather && !showClock) return null

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
    })
  }

  const WeatherIcon = weather ? WEATHER_ICONS[weather.icon] : Cloud

  return (
    <header className="z-30 flex h-[12%] min-h-[96px] w-full shrink-0 items-center justify-between gap-6 border-b-4 border-[#E30613] bg-[#111111] px-8 text-white">
      {showLogo ? (
        <div className="flex min-w-0 flex-1 items-center gap-5">
          {logoSrc && (
            <img
              src={logoSrc}
              alt=""
              className="h-14 w-auto max-w-[220px] shrink-0 object-contain"
            />
          )}
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#E30613]">
              SENAI Cast
            </p>
            <h1 className="truncate text-3xl font-bold leading-tight tracking-tight">
              {institution.name}
            </h1>
          </div>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <div className="flex shrink-0 items-center gap-4">
        {showWeather && weather && (
          <div className="flex items-center gap-3 rounded-2xl bg-[#1d1d1d] px-5 py-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E30613]">
              <WeatherIcon className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <div className="text-3xl font-bold tabular-nums">{weather.temperature}°</div>
              <div className="text-sm capitalize text-white/70">
                {weather.city} · {weather.label}
              </div>
            </div>
          </div>
        )}

        {showClock && (
          <div className="min-w-[210px] rounded-2xl bg-[#1d1d1d] px-5 py-3 text-right">
            <div className="text-4xl font-bold leading-none tabular-nums tracking-tight">
              {formatTime(currentTime)}
            </div>
            <div className="mt-1 text-sm capitalize text-white/70">{formatDate(currentTime)}</div>
          </div>
        )}
      </div>
    </header>
  )
}
