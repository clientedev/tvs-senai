"use client"

import type { Announcement } from "@/lib/types"
import { contrastingText, type OverlayBox } from "@/lib/tv-overlay"
import { useEffect, useRef } from "react"

interface AnnouncementTickerProps {
  announcements: Announcement[]
  overlay: OverlayBox
}

export function AnnouncementTicker({ announcements, overlay }: AnnouncementTickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const active = announcements
    .filter((a) => a.is_active)
    .sort((a, b) => a.priority - b.priority)
    .map((a) => a.content)

  const text = active.join("     •     ")

  useEffect(() => {
    const el = containerRef.current
    if (!el || active.length === 0) return

    const interval = setInterval(() => {
      if (!el) return
      const maxScroll = el.scrollWidth / 2
      if (maxScroll <= 0) return
      if (el.scrollLeft >= maxScroll) {
        el.scrollLeft = 0
      } else {
        el.scrollLeft += 1
      }
    }, 30)

    return () => clearInterval(interval)
  }, [text, active.length])

  if (!overlay.visible) return null
  if (active.length === 0) return null

  const background = overlay.color
  const color = contrastingText(background)

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "52px",
        minHeight: "52px",
        maxHeight: "52px",
        flexShrink: 0,
        overflow: "hidden",
        backgroundColor: background,
        color,
        boxSizing: "border-box",
        display: "block",
        visibility: "visible",
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ display: "inline-block", whiteSpace: "nowrap", flexShrink: 0 }}>
          <span style={{ paddingLeft: "24px", paddingRight: "24px", fontSize: "20px", fontWeight: 600 }}>
            {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </span>
        </div>
        <div style={{ display: "inline-block", whiteSpace: "nowrap", flexShrink: 0 }}>
          <span style={{ paddingLeft: "24px", paddingRight: "24px", fontSize: "20px", fontWeight: 600 }}>
            {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </span>
        </div>
      </div>
    </div>
  )
}
