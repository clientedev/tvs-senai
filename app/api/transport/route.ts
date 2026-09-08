import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Dados estáticos de fallback com todas as linhas reais de SP
// Usado quando a API da ARTESP estiver indisponível ou exigir autenticação
const FALLBACK_DATA = {
  empresas: [
    {
      nome: "Metrô SP",
      linhas: [
        { codigo: "1", nome: "Linha 1 - Azul", status: { situacao: "Operação Normal" } },
        { codigo: "2", nome: "Linha 2 - Verde", status: { situacao: "Operação Normal" } },
        { codigo: "3", nome: "Linha 3 - Vermelha", status: { situacao: "Operação Normal" } },
        { codigo: "4", nome: "Linha 4 - Amarela", status: { situacao: "Operação Normal" } },
        { codigo: "5", nome: "Linha 5 - Lilás", status: { situacao: "Operação Normal" } },
        { codigo: "15", nome: "Linha 15 - Prata", status: { situacao: "Operação Normal" } },
      ],
    },
    {
      nome: "CPTM",
      linhas: [
        { codigo: "7", nome: "Linha 7 - Rubi", status: { situacao: "Operação Normal" } },
        { codigo: "8", nome: "Linha 8 - Diamante", status: { situacao: "Operação Normal" } },
        { codigo: "9", nome: "Linha 9 - Esmeralda", status: { situacao: "Operação Normal" } },
        { codigo: "10", nome: "Linha 10 - Turquesa", status: { situacao: "Operação Normal" } },
        { codigo: "11", nome: "Linha 11 - Coral", status: { situacao: "Operação Normal" } },
        { codigo: "12", nome: "Linha 12 - Safira", status: { situacao: "Operação Normal" } },
        { codigo: "13", nome: "Linha 13 - Jade", status: { situacao: "Operação Normal" } },
      ],
    },
  ],
}

export async function GET() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 segundos de timeout

    const res = await fetch("https://ccm.artesp.sp.gov.br/metroferroviario/api/status/", {
      cache: 'no-store',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      console.warn(`API ARTESP retornou ${res.status} — usando dados de fallback`)
      return NextResponse.json(FALLBACK_DATA)
    }

    const data = await res.json()

    // Se a resposta não tiver o formato esperado, usa fallback
    if (!data?.empresas) {
      return NextResponse.json(FALLBACK_DATA)
    }

    return NextResponse.json(data)
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      console.warn("Transport proxy: timeout — usando dados de fallback")
    } else {
      console.error("Transport proxy error:", error)
    }
    // Em qualquer erro, retorna fallback para não deixar o ticker vazio
    return NextResponse.json(FALLBACK_DATA)
  }
}
