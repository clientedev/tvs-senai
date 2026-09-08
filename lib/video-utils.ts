// Utility functions for video URL handling

export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/i.test(url)
}

export function isVimeoUrl(url: string): boolean {
  return /vimeo\.com/i.test(url)
}

export function getYouTubeVideoId(url: string): string | null {
  // First, handle youtu.be format (short URL)
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/i)
  if (shortMatch) return shortMatch[1]

  // Handle youtube.com/watch?v= format
  const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/i)
  if (watchMatch) return watchMatch[1]

  // Handle youtube.com/embed/ format
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/i)
  if (embedMatch) return embedMatch[1]

  // Handle youtube.com/shorts/ format
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/i)
  if (shortsMatch) return shortsMatch[1]

  return null
}

export function getVimeoVideoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/i)
  return match ? match[1] : null
}

export function getEmbedUrl(url: string): string | null {
  const youtubeId = getYouTubeVideoId(url)
  if (youtubeId) {
    // autoplay=1, mute=1 para exibição em TV. SEM loop=1 para avançar para o próximo conteúdo.
    // enablejsapi=1 permite que o player emita eventos (mas não funciona em cross-origin)
    // O timer de duration_seconds no MediaPlayer garante o avanço automático
    return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=0&controls=0&showinfo=0&rel=0&enablejsapi=1`
  }

  const vimeoId = getVimeoVideoId(url)
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1&background=1`
  }

  return null
}

export function detectMediaType(url: string): "image" | "video" | "youtube" {
  if (isYouTubeUrl(url)) {
    console.log("[v0] Detected YouTube URL:", url)
    return "youtube"
  }

  if (isVimeoUrl(url)) {
    console.log("[v0] Detected Vimeo URL:", url)
    return "youtube"
  }

  // Check for video file extensions
  if (/\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i.test(url)) {
    return "video"
  }

  // Check for data URL video
  if (url.startsWith("data:video/")) {
    return "video"
  }

  return "image"
}
