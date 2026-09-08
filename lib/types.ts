export type InstitutionSettings = {
  id: string
  name: string
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
  updated_at: string
}

export type MediaContent = {
  id: string
  type: "image" | "video" | "youtube" | "live"
  title: string
  file_url: string
  duration_seconds: number
  is_active: boolean
  scheduled_start: string | null
  scheduled_end: string | null
  display_order: number
  created_at: string
}

import type { TVOverlayLayout } from "@/lib/tv-overlay"

export type TVDevice = {
  id: string
  name: string
  location: string | null
  token: string
  last_seen: string | null
  is_active: boolean
  overlay_layout?: TVOverlayLayout | null
  created_at: string
}

export type TVContentAssignment = {
  id: string
  tv_id: string
  content_id: string
  order_index: number
  created_at: string
}

export type Announcement = {
  id: string
  content: string
  priority: number
  is_active: boolean
  created_at: string
}
