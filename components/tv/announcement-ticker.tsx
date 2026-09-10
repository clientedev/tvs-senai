"use client"

import type { Announcement } from "@/lib/types"
import { contrastingText, type OverlayBox } from "@/lib/tv-overlay"

interface AnnouncementTickerProps {
  announcements: Announcement[]
  overlay: OverlayBox
}

export function AnnouncementTicker({ announcements, overlay }: AnnouncementTickerProps) {
  if (!overlay.visible) return null

  const active = announcements
    .filter((a) => a.is_active)
    .sort((a, b) => a.priority - b.priority)
    .map((a) => a.content)

  if (active.length === 0) return null

  const background = overlay.color
  const color = contrastingText(background)
  const text = active.join("     •     ")

  return (
    <footer
      style={{
        position: "relative",
        width: "100%",
        height: "52px",
        flexShrink: 0,
        overflow: "hidden",
        backgroundColor: background,
        color,
        boxSizing: "border-box",
      }}
    >
      {/* Duplicate the text so the loop looks seamless */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <div
          className="animate-ticker"
          style={{
            display: "inline-block",
            whiteSpace: "nowrap",
            willChange: "transform",
          }}
        >
          <span style={{ paddingLeft: "16px", paddingRight: "16px", fontSize: "22px", fontWeight: 500 }}>
            {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
          </span>
        </div>
      </div>
    </footer>
  )
}
