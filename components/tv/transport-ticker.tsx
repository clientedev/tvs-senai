"use client"

import { useEffect, useState } from "react"

interface LineStatus {
  nome: string
  codigo: string
  status: {
    situacao: string
  }
}

const LINE_COLORS: Record<string, { bg: string; text: string }> = {
  "1": { bg: "#00539F", text: "#FFFFFF" }, // Azul
  "2": { bg: "#008061", text: "#FFFFFF" }, // Verde
  "3": { bg: "#EE3E34", text: "#FFFFFF" }, // Vermelha
  "4": { bg: "#FED304", text: "#000000" }, // Amarela
  "5": { bg: "#853092", text: "#FFFFFF" }, // Lilás
  "7": { bg: "#A1195B", text: "#FFFFFF" }, // Rubi
  "8": { bg: "#9E9D9D", text: "#FFFFFF" }, // Diamante
  "9": { bg: "#00A88E", text: "#FFFFFF" }, // Esmeralda
  "10": { bg: "#007C8F", text: "#FFFFFF" }, // Turquesa
  "11": { bg: "#F04E22", text: "#FFFFFF" }, // Coral
  "12": { bg: "#033F88", text: "#FFFFFF" }, // Safira
  "13": { bg: "#00AC5A", text: "#FFFFFF" }, // Jade
  "15": { bg: "#8F9194", text: "#FFFFFF" }, // Prata
}

export function TransportTicker() {
  const [lines, setLines] = useState<LineStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
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
    const interval = setInterval(fetchStatus, 5 * 60 * 1000) // 5 minutos
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <footer className="h-16 bg-[#000000] flex items-center justify-center border-t border-white/10">
        <span className="text-white text-lg opacity-70">Carregando status do transporte...</span>
      </footer>
    )
  }

  if (error || lines.length === 0) {
    return (
      <footer className="h-16 bg-[#000000] flex items-center justify-center border-t border-white/10">
        <span className="text-white text-sm opacity-50">
          ⚠️ Status do transporte indisponível no momento
        </span>
      </footer>
    )
  }

  // Duplicate items for continuous scrolling effect
  const tickerItems = [...lines, ...lines]

  return (
    <footer className="h-16 bg-[#111111] overflow-hidden relative border-t-2 border-white/10 flex items-center">
      <div className="absolute inset-0 flex items-center">
        <div className="flex animate-ticker whitespace-nowrap h-full items-center">
          {tickerItems.map((l, i) => {
            const colors = LINE_COLORS[l.codigo] || { bg: "#333333", text: "#FFFFFF" }
            const isNormal = l.status.situacao === "Operação Normal"
            
            return (
              <div 
                key={`${l.codigo}-${i}`}
                className="flex h-full items-center px-6 border-r border-white/20"
                style={{ backgroundColor: colors.bg, color: colors.text }}
              >
                <div className="flex flex-col justify-center">
                  <span className="font-bold text-lg leading-tight shadow-sm drop-shadow-md">
                    {l.nome}
                  </span>
                  <span className={`text-sm font-medium ${isNormal ? 'opacity-90' : 'animate-pulse'}`}>
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

