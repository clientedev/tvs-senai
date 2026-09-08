/**
 * URL helpers
 *
 * Muitos navegadores (especialmente de Smart TVs) bloqueiam "mixed content"
 * quando o site está em HTTPS mas algum recurso (imagem/vídeo) vem de HTTP.
 * Também é comum o painel gerar links em HTTP se o admin foi acessado via HTTP.
 */

export function ensureHttpsUrl(input: string): string {
  const url = (input || "").trim()
  if (!url) return url

  // Keep relative paths and non-http schemes intact
  if (url.startsWith("/") || url.startsWith("data:") || url.startsWith("blob:")) return url

  // Protocol-relative URLs: //example.com/x
  if (url.startsWith("//")) return `https:${url}`

  if (url.toLowerCase().startsWith("http://")) {
    return `https://${url.slice("http://".length)}`
  }

  return url
}

export function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url
}

/**
 * Base URL canônica para gerar links (ex: link da TV).
 * Preferência: NEXT_PUBLIC_SITE_URL (ex: https://suaempresa.com)
 */
export function getPublicBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL
  if (env) return stripTrailingSlash(env.trim())

  if (typeof window !== "undefined") {
    const host = window.location.host
    const protocol = window.location.protocol

    // Em produção, se alguém abriu o admin via http, forçamos https para o link gerado.
    const isLocalhost =
      host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]")

    if (!isLocalhost && protocol === "http:") {
      return `https://${host}`
    }

    return window.location.origin
  }

  return ""
}

