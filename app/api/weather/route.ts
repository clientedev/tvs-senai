import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

const SAO_PAULO = {
  latitude: -23.5505,
  longitude: -46.6333,
}

function describeWeather(code: number) {
  if (code === 0) return { label: "Céu limpo", icon: "sun" as const }
  if (code === 1) return { label: "Predominante limpo", icon: "sun" as const }
  if (code === 2) return { label: "Parcialmente nublado", icon: "cloud-sun" as const }
  if (code === 3) return { label: "Nublado", icon: "cloud" as const }
  if (code === 45 || code === 48) return { label: "Neblina", icon: "cloud-fog" as const }
  if ([51, 53, 55, 56, 57].includes(code)) return { label: "Garoa", icon: "cloud-drizzle" as const }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: "Chuva", icon: "cloud-rain" as const }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "Neve", icon: "snowflake" as const }
  if ([95, 96, 99].includes(code)) return { label: "Tempestade", icon: "cloud-lightning" as const }
  return { label: "São Paulo", icon: "cloud" as const }
}

export async function GET() {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast")
    url.searchParams.set("latitude", String(SAO_PAULO.latitude))
    url.searchParams.set("longitude", String(SAO_PAULO.longitude))
    url.searchParams.set("current", "temperature_2m,weather_code,relative_humidity_2m")
    url.searchParams.set("timezone", "America/Sao_Paulo")

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      return NextResponse.json({ error: "Falha ao consultar o clima" }, { status: 502 })
    }

    const data = await res.json()
    const temperature = data?.current?.temperature_2m
    const weatherCode = data?.current?.weather_code
    const humidity = data?.current?.relative_humidity_2m

    if (typeof temperature !== "number" || typeof weatherCode !== "number") {
      return NextResponse.json({ error: "Resposta de clima inválida" }, { status: 502 })
    }

    const description = describeWeather(weatherCode)

    return NextResponse.json({
      city: "São Paulo",
      temperature: Math.round(temperature),
      humidity: typeof humidity === "number" ? humidity : null,
      weatherCode,
      ...description,
    })
  } catch (error: any) {
    if (error?.name === "AbortError") {
      console.warn("Weather proxy: timeout")
    } else {
      console.error("Weather proxy error:", error)
    }
    return NextResponse.json({ error: "Não foi possível obter o clima" }, { status: 503 })
  }
}
