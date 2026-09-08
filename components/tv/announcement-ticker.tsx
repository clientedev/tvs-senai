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

  return (
    <footer
      className="relative h-[6.5vh] min-h-[52px] w-full shrink-0 overflow-hidden"
      style={{ backgroundColor: background, color }}
    >
      <div className="absolute inset-0 flex items-center">
        <div className="animate-ticker whitespace-nowrap">
          <span className="px-4 text-2xl font-medium">{active.join("     •     ")}</span>
        </div>
      </div>
    </footer>
  )
}
