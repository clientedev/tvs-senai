"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { TVHeader } from "./tv-header"
import { MediaPlayer } from "./media-player"
import { TransportTicker } from "./transport-ticker"
import { AnnouncementTicker } from "./announcement-ticker"
import { createClient } from "@/lib/supabase/client"
import type { InstitutionSettings, MediaContent, Announcement } from "@/lib/types"
import { parseOverlayLayout, type TVOverlayLayout } from "@/lib/tv-overlay"

interface TVDisplayProps {
  tvId?: string
}

export function TVDisplay({ tvId: routeTvId }: TVDisplayProps) {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || routeTvId

  const [institution, setInstitution] = useState<InstitutionSettings | null>(null)
  const [contents, setContents] = useState<MediaContent[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [overlay, setOverlay] = useState<TVOverlayLayout>(() => parseOverlayLayout(null))
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])
  const tvIdRef = useRef<string | null>(null)
  const isLoadingRef = useRef(false)
  const channelRef = useRef<any>(null)
  const isLoadedRef = useRef(false)

  // Safe LocalStorage Helper
  const safeStorage = {
    getItem: (key: string) => {
      try {
        return localStorage.getItem(key)
      } catch (e) {
        return null
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value)
      } catch (e) {
        // Ignore storage errors
      }
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(key)
      } catch (e) { }
    },
    clear: () => {
      try {
        localStorage.clear()
      } catch (e) { }
    }
  }

  // Effect to load cache immediately (Stale-while-revalidate)
  useEffect(() => {
    const cachedInst = safeStorage.getItem('tv_cache_institution')
    const cachedContents = safeStorage.getItem('tv_cache_contents')
    const cachedAnn = safeStorage.getItem('tv_cache_announcements')
    // We also need the TV ID from cache to subscribe effectively if offline, 
    // but prioritized fresh fetch for logic.
    const cachedTV = safeStorage.getItem('tv_cache_tv')

    if (cachedInst && cachedContents) {
      try {
        setInstitution(JSON.parse(cachedInst))
        setContents(JSON.parse(cachedContents))
        if (cachedAnn) setAnnouncements(JSON.parse(cachedAnn))
        if (cachedTV) {
          const parsedTV = JSON.parse(cachedTV)
          tvIdRef.current = parsedTV.id
          if (parsedTV.overlay_layout) setOverlay(parseOverlayLayout(parsedTV.overlay_layout))
        }

        // If we have cache, we are "loaded" enough to show something
        setIsLoaded(true)
        isLoadedRef.current = true
      } catch (e) {
        console.error("Error parsing cache:", e)
        // If cache is bad, we ignore it and wait for network
      }
    }
  }, [])

  // Setup subscription helper
  const setupSubscription = useCallback((tvId: string, currentToken: string) => {
    // Cleanup previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const debounceTimerRef = { current: null as NodeJS.Timeout | null }

    const channel = supabase
      .channel(`tv-updates-${tvId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          filter: `tv_id=eq.${tvId}`
        },
        () => {
          // Debounce to prevent multiple rapid calls
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
          }
          debounceTimerRef.current = setTimeout(() => {
            if (loadDataRef.current) {
              loadDataRef.current(currentToken, true)
            }
            debounceTimerRef.current = null
          }, 1000)
        }
      )
      .subscribe()

    channelRef.current = channel
  }, [supabase])

  // Ref to hold loadData function for subscription callbacks
  const loadDataRef = useRef<((token: string, skip?: boolean) => Promise<void>) | null>(null)

  // Memoized loadData function to prevent recreation
  const loadData = useCallback(async (currentToken: string, skipLoadingCheck = false) => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current && !skipLoadingCheck) {
      return
    }

    isLoadingRef.current = true

    try {
      // 1. Validate Token & Get TV ID
      const { data: tv, error: tvError } = await supabase
        .from("tv_devices")
        .select("id, name, location, overlay_layout")
        .eq("token", currentToken)
        .single()

      if (tvError) {
        console.error("TV Error:", tvError)
        // Check if it's an RLS/policy error
        if (tvError.code === 'PGRST301' || tvError.message?.includes('permission') || tvError.message?.includes('policy')) {
          if (!isLoadedRef.current) {
            throw new Error("Erro de permissão ao ler o dispositivo. Verifique o token da TV.")
          } else {
            console.warn("RLS/Permission error in background fetch")
            isLoadingRef.current = false
            return
          }
        }
        if (!isLoadedRef.current) {
          throw new Error(`TV não encontrada ou token inválido: ${tvError.message}`)
        } else {
          console.warn("Background fetch failed:", tvError.message)
          isLoadingRef.current = false
          return
        }
      }

      if (!tv) {
        if (!isLoadedRef.current) {
          throw new Error("TV não encontrada ou token inválido.")
        } else {
          console.warn("Background fetch failed: TV not found")
          isLoadingRef.current = false
          return
        }
      }

      const currentTvId = tv.id
      tvIdRef.current = currentTvId
      // Non-blocking heartbeat update
      supabase.from("tv_devices").update({ last_seen: new Date().toISOString() }).eq("id", currentTvId).then()

      safeStorage.setItem('tv_cache_tv', JSON.stringify(tv))
      setOverlay(parseOverlayLayout(tv.overlay_layout))

      // Setup subscription after we have the TV ID (only if not already setup)
      if (!channelRef.current || tvIdRef.current !== currentTvId) {
        setupSubscription(currentTvId, currentToken)
      }

      // 2. Parallel Fetching for Speed
      const [instResult, assignmentsResult, annResult, allMediaResult] = await Promise.allSettled([
        supabase.from("institution_settings").select("*").single(),
        supabase.from("tv_content_assignments").select("content_id, order_index").eq("tv_id", currentTvId).order("order_index"),
        supabase.from("announcements").select("*").eq("is_active", true).order("priority"),
        supabase.from("media_contents").select("*").eq("is_active", true).order("display_order", { ascending: true }).order("created_at", { ascending: false })
      ])

      // Process Institution
      if (instResult.status === 'fulfilled' && instResult.value.data) {
        setInstitution(instResult.value.data)
        safeStorage.setItem('tv_cache_institution', JSON.stringify(instResult.value.data))
      }

      // Process Announcements
      if (annResult.status === 'fulfilled' && annResult.value.data) {
        setAnnouncements(annResult.value.data)
        safeStorage.setItem('tv_cache_announcements', JSON.stringify(annResult.value.data))
      }

      // Process Content
      // Logic: If assignments exist, use them. If NOT, use global list.
      // ALWAYS apply schedule filtering.
      let finalContents: MediaContent[] = []
      const allMedia = (allMediaResult.status === 'fulfilled' && allMediaResult.value.data) ? allMediaResult.value.data : []
      const assignments = (assignmentsResult.status === 'fulfilled' && assignmentsResult.value.data) ? assignmentsResult.value.data : []

      if (assignments.length > 0) {
        // Map assignments to media objects
        finalContents = assignments
          .map(a => allMedia.find(m => m.id === a.content_id))
          .filter((m): m is MediaContent => !!m)
      } else {
        // Use Global Playlist (already sorted by display_order)
        finalContents = allMedia
      }

      // Apply Scheduling Filter
      const now = new Date()
      finalContents = finalContents.filter(c => {
        if (c.scheduled_start && new Date(c.scheduled_start) > now) return false
        if (c.scheduled_end && new Date(c.scheduled_end) < now) return false
        return true
      })

      setContents(finalContents)
      safeStorage.setItem('tv_cache_contents', JSON.stringify(finalContents))

      setIsLoaded(true)
      isLoadedRef.current = true

    } catch (err: any) {
      console.error("Error loading TV:", err)
      // If we haven't loaded from cache yet, show error.
      // If we HAVE loaded from cache, we just log the error and keep showing cached content.
      if (!isLoadedRef.current) {
        setError(err.message || "Erro de conexão ao carregar TV.")
      }
    } finally {
      isLoadingRef.current = false
    }
  }, [supabase, setupSubscription])

  // Update refs when state changes
  useEffect(() => {
    loadDataRef.current = loadData
    isLoadedRef.current = isLoaded
  }, [loadData, isLoaded])

  // Effect to load data when token changes
  useEffect(() => {
    if (!token) {
      if (!isLoadedRef.current) setError("Token não fornecido.")
      return
    }

    // Cleanup previous subscription only if token changed
    const currentToken = token
    const cleanup = () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }

    // Timeout Race logic only makes sense if we are NOT loaded.
    // If we are loaded from cache, we can just run loadData in background.
    if (!isLoadedRef.current) {
      cleanup() // Cleanup before loading
      const loadWithTimeout = async () => {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Tempo limite excedido. Verifique a internet.")), 15000)
        )
        try {
          await Promise.race([loadData(currentToken), timeoutPromise])
        } catch (e: any) {
          if (!isLoadedRef.current) setError(e.message)
        }
      }
      loadWithTimeout()
    } else {
      // If we have cached TV ID and no subscription, setup subscription immediately
      if (tvIdRef.current && !channelRef.current) {
        setupSubscription(tvIdRef.current, currentToken)
      }
      // Background update - subscription will be setup inside loadData if needed
      loadData(currentToken, true)
    }

    const refreshTimer = setInterval(() => {
      loadData(currentToken, true)
    }, 5000) // Atualiza a cada 5s para refletir mudancas sem precisar de refresh manual

    return () => {
      clearInterval(refreshTimer)
      cleanup()
    }
  }, [token, loadData, supabase, setupSubscription])

  // Keep-alive heartbeat para SmartTVs (LG WebOS, etc.) evitando sleep / throttling de tela
  useEffect(() => {
    const keepAlive = setInterval(() => {
      try {
        window.dispatchEvent(new Event("resize"))
      } catch (e) {}
    }, 15000)

    return () => clearInterval(keepAlive)
  }, [])

  const handleContentChange = async (content: MediaContent) => {
    // Optional logging
  }

  const handleRetry = () => {
    setError(null)
    setIsLoaded(false)
    window.location.reload()
  }

  const handleClearCache = () => {
    safeStorage.clear()
    window.location.reload()
  }

  if (error) {
    return (
      <div style={{ height: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#003B71", color: "#ffffff" }}>
        <div style={{ textAlign: "center", padding: "32px", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: "16px" }}>
          <h1 style={{ fontSize: "48px", fontWeight: 700, marginBottom: "16px" }}>:(</h1>
          <p style={{ fontSize: "20px", marginBottom: "16px" }}>{error}</p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <button onClick={handleRetry} style={{ padding: "8px 24px", backgroundColor: "#ffffff", color: "#003B71", borderRadius: "999px", fontWeight: 700, border: "none", cursor: "pointer", fontSize: "16px" }}>
              Tentar Novamente
            </button>
            <button onClick={handleClearCache} style={{ padding: "8px 24px", backgroundColor: "#dc2626", color: "#ffffff", borderRadius: "999px", fontWeight: 700, border: "none", cursor: "pointer", fontSize: "16px" }}>
              Limpar Cache
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!isLoaded || !institution) {
    return (
      <div style={{ height: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#003B71" }}>
        <div style={{ textAlign: "center", color: "#ffffff" }}>
          <div className="animate-spin" style={{ width: "64px", height: "64px", border: "4px solid rgba(255,255,255,0.3)", borderTopColor: "#ffffff", borderRadius: "50%", margin: "0 auto 16px" }} />
          <p style={{ fontSize: "20px" }}>Carregando...</p>
        </div>
      </div>
    )
  }

  const hasAnnouncements = Boolean(overlay.announcements?.visible && announcements.some((a) => a.is_active))
  const hasTransport = Boolean(overlay.transport?.visible)
  const bottomHeight = (hasAnnouncements ? 52 : 0) + (hasTransport ? 56 : 0)

  return (
    <div
      style={{
        display: "block",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        cursor: "none",
        userSelect: "none",
        backgroundColor: "#000000",
      }}
    >
      {/* Header fixo no topo: 90px */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "90px",
          zIndex: 50,
          display: "block",
          visibility: "visible",
        }}
      >
        <TVHeader institution={institution} overlay={overlay} />
      </div>

      {/* Media Player preenche exatamente o espaço entre o header fixo e as faixas fixas */}
      <div
        style={{
          position: "fixed",
          top: "90px",
          bottom: `${bottomHeight}px`,
          left: 0,
          right: 0,
          zIndex: 10,
          overflow: "hidden",
          backgroundColor: "#000000",
        }}
      >
        <MediaPlayer contents={contents} onContentChange={handleContentChange} />
      </div>

      {/* Faixas inferiores fixas na base: NUNCA somem ou são empurradas para fora */}
      {bottomHeight > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: `${bottomHeight}px`,
            zIndex: 50,
            display: "block",
            visibility: "visible",
            backgroundColor: "#111111",
            boxSizing: "border-box",
          }}
        >
          {hasAnnouncements && (
            <AnnouncementTicker announcements={announcements} overlay={overlay.announcements} />
          )}
          {hasTransport && (
            <TransportTicker overlay={overlay.transport} />
          )}
        </div>
      )}
    </div>
  )
}
