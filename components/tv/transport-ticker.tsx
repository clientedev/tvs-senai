"use client"

import { useEffect, useState } from "react"
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

const BAR_STYLE: React.CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  width: "100%",
  height: "56px",
  flexShrink: 0,
  overflow: "hidden",
  backgroundColor: "#111111",
  boxSizing: "border-box",
}

interface TransportTickerProps {
  overlay: OverlayBox
}

export function TransportTicker({ overlay }: TransportTickerProps) {
  const [lines, setLines] = useState<LineStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!overlay.visible) return

    const fetchStatus = async () => {
      try {
        setError(false)
        const res = await fetch("/api/transport")
        if (!res.ok) { setError(true); return }
        const data = await res.json()
        if (data.error) { setError(true); return }
        const allLines = data.empresas?.flatMap((e: any) => e.linhas) ?? []
        setLines(allLines)
        if (allLines.length > 0) setError(false)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [overlay.visible])

  if (!overlay.visible) return null

  if (loading) {
    return (
      <footer style={BAR_STYLE}>
        <span style={{ width: "100%", textAlign: "center", fontSize: "16px", color: "rgba(255,255,255,0.6)" }}>
          Carregando status do transporte...
        </span>
      </footer>
    )
  }

  if (error || lines.length === 0) {
    return (
      <footer style={BAR_STYLE}>
        <span style={{ width: "100%", textAlign: "center", fontSize: "13px", color: "rgba(255,255,255,0.45)" }}>
          Status do transporte indisponível no momento
        </span>
      </footer>
    )
  }

  // Duplicate for seamless loop
  const tickerItems = [...lines, ...lines]

  return (
    <footer style={BAR_STYLE}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <div
          className="animate-ticker"
          style={{
            display: "inline-flex",
            flexDirection: "row",
            alignItems: "stretch",
            height: "100%",
            whiteSpace: "nowrap",
            willChange: "transform",
          }}
        >
          {tickerItems.map((l, i) => {
            const colors = LINE_COLORS[l.codigo] || { bg: "#333333", text: "#FFFFFF" }
            const isNormal = l.status.situacao === "Operação Normal"
            return (
              <div
                key={`${l.codigo}-${i}`}
                style={{
                  display: "inline-flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  height: "100%",
                  padding: "0 24px",
                  borderRight: "1px solid rgba(255,255,255,0.15)",
                  backgroundColor: colors.bg,
                  color: colors.text,
                  boxSizing: "border-box",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: "15px", fontWeight: 700, lineHeight: 1.2 }}>{l.nome}</span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    opacity: isNormal ? 0.9 : 1,
                    color: isNormal ? colors.text : "#FFE066",
                  }}
                >
                  {l.status.situacao}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </footer>
  )
}
