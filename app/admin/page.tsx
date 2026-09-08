"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageIcon, MessageSquare, Monitor, Activity, Youtube, Video } from "lucide-react"
import type { MediaContent, Announcement, TVDevice, InstitutionSettings } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"

export default function AdminDashboard() {
  const [contents, setContents] = useState<MediaContent[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [tvs, setTVs] = useState<TVDevice[]>([])
  const [institution, setInstitution] = useState<InstitutionSettings | null>(null)
  const [connected, setConnected] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      const [contentsRes, announcementsRes, tvsRes, institutionRes] = await Promise.all([
        supabase.from("media_contents").select("*").order("created_at", { ascending: false }),
        supabase.from("announcements").select("*").order("priority"),
        supabase.from("tv_devices").select("*").order("name"),
        supabase.from("institution_settings").select("*").single(),
      ])

      if (contentsRes.data) setContents(contentsRes.data)
      if (announcementsRes.data) setAnnouncements(announcementsRes.data)
      if (tvsRes.data) setTVs(tvsRes.data)
      if (institutionRes.data) setInstitution(institutionRes.data)
    }

    fetchData()

    // Real-time subscriptions
    const channels = supabase
      .channel("admin-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "media_contents" },
         (payload: { eventType: string; new: any; old: any }) => {
          if (payload.eventType === "INSERT") {
            setContents((prev) => [payload.new as MediaContent, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setContents((prev) =>
              prev.map((item) => (item.id === payload.new.id ? (payload.new as MediaContent) : item))
            )
          } else if (payload.eventType === "DELETE") {
            setContents((prev) => prev.filter((item) => item.id !== payload.old.id))
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
         (payload: { eventType: string; new: any; old: any }) => {
          if (payload.eventType === "INSERT") {
            setAnnouncements((prev) => [...prev, payload.new as Announcement].sort((a, b) => a.priority - b.priority))
          } else if (payload.eventType === "UPDATE") {
            setAnnouncements((prev) =>
              prev
                .map((item) => (item.id === payload.new.id ? (payload.new as Announcement) : item))
                .sort((a, b) => a.priority - b.priority)
            )
          } else if (payload.eventType === "DELETE") {
            setAnnouncements((prev) => prev.filter((item) => item.id !== payload.old.id))
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tv_devices" },
         (payload: { eventType: string; new: any; old: any }) => {
          if (payload.eventType === "INSERT") {
            setTVs((prev) => [...prev, payload.new as TVDevice].sort((a, b) => a.name.localeCompare(b.name)))
          } else if (payload.eventType === "UPDATE") {
            setTVs((prev) =>
              prev.map((item) => (item.id === payload.new.id ? (payload.new as TVDevice) : item))
            )
          } else if (payload.eventType === "DELETE") {
            setTVs((prev) => prev.filter((item) => item.id !== payload.old.id))
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "institution_settings" },
         (payload: { eventType: string; new: any; old: any }) => {
          // Typically typically there is only one row, or we just take the new one
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            setInstitution(payload.new as InstitutionSettings)
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnected(true)
        }
      })

    return () => {
      supabase.removeChannel(channels)
    }
  }, [])

  const activeContents = contents.filter((c) => c.is_active).length
  const activeAnnouncements = announcements.filter((a) => a.is_active).length
  const activeTVs = tvs.filter((t) => t.is_active).length

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Painel Administrativo</h1>
        <p className="text-muted-foreground mt-1">
          {institution?.name || "Carregando..."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conteúdos</CardTitle>
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{contents.length}</div>
            <p className="text-sm text-muted-foreground">{activeContents} ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avisos</CardTitle>
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{announcements.length}</div>
            <p className="text-sm text-muted-foreground">{activeAnnouncements} ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">TVs</CardTitle>
            <Monitor className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{tvs.length}</div>
            <p className="text-sm text-muted-foreground">{activeTVs} online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            <Activity className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${connected ? "text-green-600" : "text-yellow-600"}`}>
              {connected ? "Online" : "Conectando..."}
            </div>
            <p className="text-sm text-muted-foreground">
              {connected ? "Sistema operando em tempo real" : "Estabelecendo conexão..."}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conteúdos Recentes</CardTitle>
            <CardDescription>Últimas mídias adicionadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contents.slice(0, 4).map((content) => (
                <div key={content.id} className="flex items-center gap-4">
                  <div className="w-16 h-12 bg-muted rounded overflow-hidden flex-shrink-0 relative">
                    {content.type === "image" && (
                      <img
                        src={content.file_url || "/placeholder.svg"}
                        alt={content.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {content.type === "video" && (
                      <div className="w-full h-full flex items-center justify-center bg-[#003B71]">
                        <Video className="w-6 h-6 text-white" />
                      </div>
                    )}
                    {content.type === "youtube" && (
                      <div className="w-full h-full flex items-center justify-center bg-[#E30613]">
                        <Youtube className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{content.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {content.type === "image" ? "Imagem" : content.type === "video" ? "Vídeo" : "YouTube"} • {content.duration_seconds}s
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${content.is_active ? "bg-green-500" : "bg-muted-foreground"}`} />
                </div>
              ))}
              {contents.length === 0 && (
                <p className="text-muted-foreground text-center py-4">Nenhum conteúdo adicionado</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avisos Ativos</CardTitle>
            <CardDescription>Mensagens exibidas no rodapé</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements
                .filter((a) => a.is_active)
                .slice(0, 4)
                .map((announcement) => (
                  <div key={announcement.id} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#E30613] text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                      {announcement.priority}
                    </div>
                    <p className="text-sm">{announcement.content}</p>
                  </div>
                ))}
              {announcements.filter((a) => a.is_active).length === 0 && (
                <p className="text-muted-foreground text-center py-4">Nenhum aviso ativo</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
