export type LiveChannel = {
  id: string
  name: string
  url: string
}

/** Streams oficiais de TV pública (EBC e Câmara). Não inclui emissoras comerciais. */
export const LIVE_CHANNELS: LiveChannel[] = [
  { id: "tv-brasil", name: "TV Brasil", url: "https://tvbrasil-stream.ebc.com.br/index.m3u8" },
  { id: "canal-educacao", name: "Canal Educação", url: "https://canaleducacao-stream.ebc.com.br/index.m3u8" },
  { id: "canal-gov", name: "Canal Gov", url: "https://canalgov-stream.ebc.com.br/index.m3u8" },
  { id: "canal-libras", name: "Canal Libras", url: "https://canallibras-stream.ebc.com.br/mux_video_ts/index-1.m3u8" },
  { id: "tv-camara", name: "TV Câmara", url: "https://stream3.camara.gov.br/tv1/manifest.m3u8" },
  { id: "tv-camara-2", name: "TV Câmara 2", url: "https://stream3.camara.gov.br/tv2/manifest.m3u8" },
]

export function isHlsUrl(url: string) {
  return /\.m3u8(\?.*)?$/i.test(url) || /\/manifest\.m3u8(\?.*)?$/i.test(url) || /\/index\.m3u8(\?.*)?$/i.test(url)
}
