"use client"

import type { Announcement } from "@/lib/types"
import type { OverlayBox } from "@/lib/tv-overlay"
import { overlayStyle } from "@/lib/tv-overlay"

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

  return (
    <footer style={overlayStyle(overlay, { height: "6%" })} className="relative overflow-hidden bg-[#003B71]">
      <div className="absolute inset-0 flex items-center">
        <div className="animate-ticker whitespace-nowrap">
          <span className="px-4 text-2xl font-medium text-white">{active.join("     •     ")}</span>
        </div>
      </div>
    </footer>
  )
}
