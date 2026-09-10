"use client"

import { useEffect, useState } from "react"
import type { InstitutionSettings } from "@/lib/types"
import type { TVOverlayLayout } from "@/lib/tv-overlay"
import { ensureHttpsUrl } from "@/lib/url"

interface TVHeaderProps {
  institution: InstitutionSettings
  overlay: TVOverlayLayout
}

export function TVHeader({ institution, overlay }: TVHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const logoSrc = institution.logo_url ? ensureHttpsUrl(institution.logo_url) : null
  const showLogo = overlay.logo.visible
  const showClock = overlay.clock.visible

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!showLogo && !showClock) return null

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
        height: "12%",
        minHeight: "88px",
        maxHeight: "120px",
        flexShrink: 0,
        backgroundColor: "#111111",
        borderBottom: "4px solid #E30613",
        color: "#ffffff",
        padding: "0 32px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Logo + Nome */}
      {showLogo && (
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
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#E30613",
              }}
            >
              SENAI Cast
            </p>
            <h1
              style={{
                margin: 0,
                fontSize: "28px",
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
      )}

      {!showLogo && <div style={{ flex: 1 }} />}

      {/* Relógio */}
      {showClock && (
        <div
          style={{
            flexShrink: 0,
            minWidth: "200px",
            backgroundColor: "#1d1d1d",
            borderRadius: "16px",
            padding: "10px 20px",
            textAlign: "right",
          }}
        >
          <div
            style={{
              fontSize: "36px",
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatTime(currentTime)}
          </div>
          <div
            style={{
              marginTop: "4px",
              fontSize: "13px",
              color: "rgba(255,255,255,0.65)",
              textTransform: "capitalize",
            }}
          >
            {formatDate(currentTime)}
          </div>
        </div>
      )}
    </header>
  )
}
