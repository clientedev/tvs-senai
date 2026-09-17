"use client"

import { useEffect, useRef, useState } from "react"
import type { OverlayBox } from "@/lib/tv-overlay"

interface LineStatus {
  nome: string
  codigo: string
  status: { situacao: string }
}

const LINE_COLORS: Record<string, { bg: string; text: string }> = {
  "1":  { bg: "#00539F", text: "#FFFFFF" },
  "2":  { bg: "#008061", text: "#FFFFFF" },
  "3":  { bg: "#EE3E34", text: "#FFFFFF" },
  "4":  { bg: "#FED304", text: "#000000" },
  "5":  { bg: "#853092", text: "#FFFFFF" },
  "7":  { bg: "#A1195B", text: "#FFFFFF" },
  "8":  { bg: "#9E9D9D", text: "#FFFFFF" },
  "9":  { bg: "#00A88E", text: "#FFFFFF" },
  "10": { bg: "#007C8F", text: "#FFFFFF" },
  "11": { bg: "#F04E22", text: "#FFFFFF" },
  "12": { bg: "#033F88", text: "#FFFFFF" },
  "13": { bg: "#00AC5A", text: "#FFFFFF" },
  "15": { bg: "#8F9194", text: "#FFFFFF" },
}

interface TransportTickerProps {
  overlay: OverlayBox
}

export function TransportTicker({ overlay }: TransportTickerProps) {
  const [lines, setLines]     = useState<LineStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)

  // Fetch transport status
  useEffect(() => {
    if (!overlay.visible) return

    // Carrega transporte salvo em cache imediatamente
    try {
      const cached = localStorage.getItem("tv_cache_transport")
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLines(parsed)
          setLoading(false)
        }
      }
    } catch {}

    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/transport")
        if (!res.ok) {
          setLines((prev) => {
            if (prev.length === 0) setError(true)
            return prev
          })
          return
        }
        const data = await res.json()
        if (data.error) {
          setLines((prev) => {
            if (prev.length === 0) setError(true)
            return prev
          })
          return
        }
        const allLines = data.empresas?.flatMap((e: any) => e.linhas) ?? []
        if (allLines.length > 0) {
          setLines(allLines)
          setError(false)
          try {
            localStorage.setItem("tv_cache_transport", JSON.stringify(allLines))
          } catch {}
        }
      } catch {
        setLines((prev) => {
          if (prev.length === 0) setError(true)
          return prev
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [overlay.visible])

  // DOM scrollLeft via setInterval — continuous, never frozen by TV idle power-save
  useEffect(() => {
    const el = containerRef.current
    if (!el || lines.length === 0) return

    const interval = setInterval(() => {
      if (!el) return
      const maxScroll = el.scrollWidth / 2
      if (maxScroll <= 0) return
      if (el.scrollLeft >= maxScroll) {
        el.scrollLeft = 0
      } else {
        el.scrollLeft += 1
      }
    }, 30)

    return () => clearInterval(interval)
  }, [lines.length])

  if (!overlay.visible) return null

  const BAR: React.CSSProperties = {
    position: "relative",
    display: "block",
    visibility: "visible",
    width: "100%",
    height: "56px",
    minHeight: "56px",
    maxHeight: "56px",
    flexShrink: 0,
    overflow: "hidden",
    backgroundColor: "#111111",
    boxSizing: "border-box",
  }

  if (loading) {
    return (
      <footer style={BAR}>
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "15px", color: "rgba(255,255,255,0.55)" }}>
            Carregando status do transporte...
          </span>
        </div>
      </footer>
    )
  }

  if (error || lines.length === 0) {
    return (
      <footer style={BAR}>
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
            Status do transporte indisponível
          </span>
        </div>
      </footer>
    )
  }

  const renderCard = (l: LineStatus, i: number, prefix: string) => {
    const colors = LINE_COLORS[l.codigo] || { bg: "#333333", text: "#FFFFFF" }
    const isNormal = l.status.situacao === "Operação Normal"
    return (
      <div
        key={`${prefix}-${l.codigo}-${i}`}
        style={{
          display: "inline-flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "100%",
          padding: "0 24px",
          borderRight: "1px solid rgba(255,255,255,0.12)",
          backgroundColor: colors.bg,
          color: colors.text,
          boxSizing: "border-box",
          flexShrink: 0,
          minWidth: "130px",
        }}
      >
        <span style={{ fontSize: "14px", fontWeight: 700, lineHeight: "1.2" }}>{l.nome}</span>
        <span style={{ fontSize: "11px", fontWeight: 500, color: isNormal ? colors.text : "#FFE066", opacity: isNormal ? 0.85 : 1 }}>
          {l.status.situacao}
        </span>
      </div>
    )
  }

  return (
    <footer style={BAR}>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "stretch",
        }}
      >
        <div style={{ display: "inline-flex", flexDirection: "row", height: "100%", flexShrink: 0 }}>
          {lines.map((l, i) => renderCard(l, i, "a"))}
        </div>
        <div style={{ display: "inline-flex", flexDirection: "row", height: "100%", flexShrink: 0 }}>
          {lines.map((l, i) => renderCard(l, i, "b"))}
        </div>
      </div>
    </footer>
  )
}
