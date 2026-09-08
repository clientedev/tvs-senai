"use client"

import { useEffect, useState } from "react"
import type { OverlayBox } from "@/lib/tv-overlay"
import { overlayStyle } from "@/lib/tv-overlay"

interface LineStatus {
  nome: string
  codigo: string
  status: {
    situacao: string
  }
}

const LINE_COLORS: Record<string, { bg: string; text: string }> = {
  "1": { bg: "#00539F", text: "#FFFFFF" },
  "2": { bg: "#008061", text: "#FFFFFF" },
  "3": { bg: "#EE3E34", text: "#FFFFFF" },
  "4": { bg: "#FED304", text: "#000000" },
  "5": { bg: "#853092", text: "#FFFFFF" },
  "7": { bg: "#A1195B", text: "#FFFFFF" },
  "8": { bg: "#9E9D9D", text: "#FFFFFF" },
  "9": { bg: "#00A88E", text: "#FFFFFF" },
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
  const [lines, setLines] = useState<LineStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!overlay.visible) return

    const fetchStatus = async () => {
      try {
        setError(false)
        const res = await fetch("/api/transport")
        if (!res.ok) {
          setError(true)
          return
        }
        const data = await res.json()
        if (data.error) {
          setError(true)
          return
        }
        const allLines = data.empresas?.flatMap((e: any) => e.linhas) ?? []
        setLines(allLines)
        if (allLines.length > 0) setError(false)
      } catch (err) {
        console.error("Error fetching transport status:", err)
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

  const style = overlayStyle(overlay, { height: "6.5%" })

  if (loading) {
    return (
      <footer style={style} className="flex items-center justify-center overflow-hidden bg-black/80">
        <span className="text-lg text-white opacity-70">Carregando status do transporte...</span>
      </footer>
    )
  }

  if (error || lines.length === 0) {
    return (
      <footer style={style} className="flex items-center justify-center overflow-hidden bg-black/80">
        <span className="text-sm text-white opacity-50">Status do transporte indisponível no momento</span>
      </footer>
    )
  }

  const tickerItems = [...lines, ...lines]

  return (
    <footer style={style} className="relative flex items-center overflow-hidden bg-[#111111]">
      <div className="absolute inset-0 flex items-center">
        <div className="flex h-full animate-ticker items-center whitespace-nowrap">
          {tickerItems.map((l, i) => {
            const colors = LINE_COLORS[l.codigo] || { bg: "#333333", text: "#FFFFFF" }
            const isNormal = l.status.situacao === "Operação Normal"

            return (
              <div
                key={`${l.codigo}-${i}`}
                className="flex h-full items-center border-r border-white/20 px-6"
                style={{ backgroundColor: colors.bg, color: colors.text }}
              >
                <div className="flex flex-col justify-center">
                  <span className="text-lg font-bold leading-tight drop-shadow-md">{l.nome}</span>
                  <span className={`text-sm font-medium ${isNormal ? "opacity-90" : "animate-pulse"}`}>
                    {l.status.situacao}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </footer>
  )
}
