"use client"

import type { Announcement } from "@/lib/types"

interface AnnouncementTickerProps {
  announcements: Announcement[]
}

export function AnnouncementTicker({ announcements }: AnnouncementTickerProps) {
  if (announcements.length === 0) {
    return (
      <footer className="h-16 bg-[#003B71] flex items-center justify-center">
        <span className="text-white text-lg opacity-70">Nenhum aviso no momento</span>
      </footer>
    )
  }


  return (
    <footer className="h-16 bg-[#003B71] overflow-hidden relative">
      <div className="absolute inset-0 flex items-center">
        <div className="whitespace-nowrap animate-ticker">
          <span className="text-white text-2xl font-medium px-4">
            {announcements
              .filter((a) => a.is_active)
              .sort((a, b) => a.priority - b.priority) // Lower number = Higher priority usually, but user wanted "1 = maior prioridade". My sort here is ascending.
              // Wait, storage logic had "priority: number".
              // Let's assume ascending priority (1, 2, 3...)
              .map((a) => a.content)
              .join("     •     ")}
          </span>
        </div>
      </div>
    </footer>
  )
}
