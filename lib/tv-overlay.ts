import type { CSSProperties } from "react"

export type OverlayBox = {
  visible: boolean
  x: number
  y: number
  width: number
}

export type TVOverlayLayout = {
  logo: OverlayBox
  clock: OverlayBox
  weather: OverlayBox
  transport: OverlayBox
  announcements: OverlayBox
}

export const DEFAULT_OVERLAY_LAYOUT: TVOverlayLayout = {
  logo: { visible: true, x: 1.5, y: 2, width: 22 },
  clock: { visible: true, x: 82, y: 2, width: 16 },
  weather: { visible: true, x: 66, y: 2, width: 15 },
  announcements: { visible: true, x: 0, y: 86, width: 100 },
  transport: { visible: true, x: 0, y: 93, width: 100 },
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function parseBox(value: unknown, fallback: OverlayBox): OverlayBox {
  if (!value || typeof value !== "object") return { ...fallback }
  const box = value as Partial<OverlayBox>
  return {
    visible: typeof box.visible === "boolean" ? box.visible : fallback.visible,
    x: clamp(typeof box.x === "number" ? box.x : fallback.x, 0, 100),
    y: clamp(typeof box.y === "number" ? box.y : fallback.y, 0, 100),
    width: clamp(typeof box.width === "number" ? box.width : fallback.width, 8, 100),
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

export function overlayStyle(box: OverlayBox, extra?: CSSProperties): CSSProperties {
  return {
    position: "absolute",
    left: `${box.x}%`,
    top: `${box.y}%`,
    width: `${box.width}%`,
    zIndex: 30,
    ...extra,
  }
}
