"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import type { TVDevice } from "@/lib/types"
import { Plus, Trash2, Monitor, ExternalLink, Copy, Check, Loader2 } from "lucide-react"
import { TVContentManager } from "@/components/admin/tv-content-manager"
import { getPublicBaseUrl } from "@/lib/url"

export default function TVsPage() {
  const [tvs, setTVs] = useState<TVDevice[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTVName, setNewTVName] = useState("")
  const [newTVLocation, setNewTVLocation] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchTVs = async () => {
    setLoading(true)
    const { data } = await supabase.from("tv_devices").select("*").order("name")
    setTVs(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchTVs()
  }, [])

  const generateTVCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Removed confusing chars like I, 1, O, 0
    let code = ""
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const handleAdd = async () => {
    if (!newTVName) return

    // Generate a friendly 6-char code instead of UUID
    const token = generateTVCode()

    const { error } = await supabase.from("tv_devices").insert({
      name: newTVName,
      location: newTVLocation,
      token: token,
      is_active: true,
    })

    if (!error) {
      fetchTVs()
      setNewTVName("")
      setNewTVLocation("")
      setIsDialogOpen(false)
    } else {
      alert("Erro ao criar TV (se o erro for sobre UUID, o banco precisa ser ajustado): " + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta TV?")) return
    await supabase.from("tv_devices").delete().eq("id", id)
    fetchTVs()
  }

  // No need for explicit toggle status in admin usually, but we can keep 'is_active'
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    await supabase.from("tv_devices").update({ is_active: !currentActive }).eq("id", id)
    fetchTVs()
  }

  const getTVUrl = (token: string) => {
    const base = getPublicBaseUrl()
    if (base) return `${base}/tv?token=${token}`
    return `/tv?token=${token}`
  }

  const copyToClipboard = (tvId: string) => {
    navigator.clipboard.writeText(getTVUrl(tvId))
    setCopiedId(tvId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">TVs</h1>
          <p className="text-muted-foreground mt-1">Gerencie os dispositivos de TV conectados</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#E30613] hover:bg-[#B8050F]">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar TV
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova TV</DialogTitle>
              <DialogDescription>Adicione um novo dispositivo de TV ao sistema</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome da TV</Label>
                <Input
                  value={newTVName}
                  onChange={(e) => setNewTVName(e.target.value)}
                  placeholder="Ex: TV Recepção"
                />
              </div>
              <div className="space-y-2">
                <Label>Localização</Label>
                <Input
                  value={newTVLocation}
                  onChange={(e) => setNewTVLocation(e.target.value)}
                  placeholder="Ex: Térreo, Corredor B"
                />
              </div>

              <Button onClick={handleAdd} className="w-full bg-[#E30613] hover:bg-[#B8050F]">
                Adicionar TV
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tvs.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma TV cadastrada</p>
                <p className="text-sm">Clique em "Adicionar TV" para começar</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          tvs.map((tv) => (
            <Card key={tv.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${tv.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}
                    >
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tv.name}</CardTitle>
                      <CardDescription>{tv.location || "Sem local"}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={tv.is_active ? "default" : "secondary"}
                    className={tv.is_active ? "bg-green-600" : ""}
                  >
                    {tv.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Link da TV</Label>
                  <div className="flex gap-2">
                    <Input value={getTVUrl(tv.token)} readOnly className="text-sm bg-muted" />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(tv.token)}>
                      {copiedId === tv.token ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <a href={getTVUrl(tv.token)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="col-span-2">
                  <Label className="text-muted-foreground">Última Atividade (Online)</Label>
                  <p className="font-medium">{tv.last_seen ? formatLastSeen(tv.last_seen) : "Nunca"}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <TVContentManager tvId={tv.id} tvName={tv.name} />

                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => handleToggleActive(tv.id, tv.is_active)}
                  >
                    {tv.is_active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(tv.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Como Configurar uma TV</CardTitle>
          <CardDescription>Instruções para conectar uma TV ao sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-[#E30613] text-white flex items-center justify-center font-bold mb-3">
                1
              </div>
              <h4 className="font-semibold mb-1">Adicione a TV</h4>
              <p className="text-sm text-muted-foreground">
                Clique em "Adicionar TV" e dê um nome identificador para o dispositivo.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-[#E30613] text-white flex items-center justify-center font-bold mb-3">
                2
              </div>
              <h4 className="font-semibold mb-1">Copie o Link</h4>
              <p className="text-sm text-muted-foreground">
                Copie o link único gerado para a TV e configure o navegador para abrir nessa URL.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
