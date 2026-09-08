export type OverlayBox = {
  visible: boolean
  x: number
  y: number
  width: number
  color: string
}

export type TVOverlayLayout = {
  logo: OverlayBox
  clock: OverlayBox
  weather: OverlayBox
  transport: OverlayBox
  announcements: OverlayBox
}

export const DEFAULT_ANNOUNCEMENT_COLOR = "#003B71"
export const DEFAULT_TRANSPORT_COLOR = "#111111"

export const DEFAULT_OVERLAY_LAYOUT: TVOverlayLayout = {
  logo: { visible: true, x: 0, y: 0, width: 100, color: "#111111" },
  clock: { visible: true, x: 0, y: 0, width: 100, color: "#111111" },
  weather: { visible: true, x: 0, y: 0, width: 100, color: "#111111" },
  announcements: { visible: true, x: 0, y: 86, width: 100, color: DEFAULT_ANNOUNCEMENT_COLOR },
  transport: { visible: true, x: 0, y: 93, width: 100, color: DEFAULT_TRANSPORT_COLOR },
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function parseColor(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim())) return value.trim()
  return fallback
}

export function contrastingText(hex: string) {
  const raw = hex.replace("#", "")
  const full = raw.length === 3 ? raw.split("").map((part) => part + part).join("") : raw
  const r = Number.parseInt(full.slice(0, 2), 16)
  const g = Number.parseInt(full.slice(2, 4), 16)
  const b = Number.parseInt(full.slice(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 160 ? "#111111" : "#ffffff"
}

function parseBox(value: unknown, fallback: OverlayBox): OverlayBox {
  if (!value || typeof value !== "object") return { ...fallback }
  const box = value as Partial<OverlayBox>
  return {
    visible: typeof box.visible === "boolean" ? box.visible : fallback.visible,
    x: clamp(typeof box.x === "number" ? box.x : fallback.x, 0, 100),
    y: clamp(typeof box.y === "number" ? box.y : fallback.y, 0, 100),
    width: clamp(typeof box.width === "number" ? box.width : fallback.width, 8, 100),
    color: parseColor(box.color, fallback.color),
  }
}

export function parseOverlayLayout(value: unknown): TVOverlayLayout {
  const source = typeof value === "string" ? safeParse(value) : value
  const data = source && typeof source === "object" ? (source as Partial<TVOverlayLayout>) : {}
  return {
    logo: parseBox(data.logo, DEFAULT_OVERLAY_LAYOUT.logo),
    clock: parseBox(data.clock, DEFAULT_OVERLAY_LAYOUT.clock),
    weather: parseBox(data.weather, DEFAULT_OVERLAY_LAYOUT.weather),
    transport: parseBox(data.transport, DEFAULT_OVERLAY_LAYOUT.transport),
    announcements: parseBox(data.announcements, DEFAULT_OVERLAY_LAYOUT.announcements),
  }
}

function safeParse(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
