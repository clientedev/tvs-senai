"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import type { Announcement } from "@/lib/types"
import { Plus, Trash2, MessageSquare, Loader2, AlertCircle } from "lucide-react"

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({
    text: "",
    priority: 1,
  })
  const supabase = createClient()

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from("announcements").select("*").order("priority")
    setAnnouncements(data || [])
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const handleAdd = async () => {
    if (!newAnnouncement.text) return

    setIsSubmitting(true)

    const { error } = await supabase.from("announcements").insert({
      content: newAnnouncement.text,
      priority: newAnnouncement.priority,
      is_active: true
    })

    if (!error) {
      fetchAnnouncements()
      setNewAnnouncement({ text: "", priority: 1 })
      setIsDialogOpen(false)
    } else {
      alert("Erro ao criar aviso: " + error.message)
    }
    setIsSubmitting(false)
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    await supabase.from("announcements").update({ is_active: active }).eq("id", id)
    fetchAnnouncements()
  }

  const handleDelete = async (id: string) => {
    await supabase.from("announcements").delete().eq("id", id)
    fetchAnnouncements()
  }

  const handleUpdatePriority = async (id: string, priority: number) => {
    await supabase.from("announcements").update({ priority }).eq("id", id)
    fetchAnnouncements()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Avisos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os avisos exibidos no rodapé da TV</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#E30613] hover:bg-[#B8050F]">
              <Plus className="w-4 h-4 mr-2" />
              Novo Aviso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Aviso</DialogTitle>
              <DialogDescription>Adicione uma mensagem para o rodapé da TV</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  value={newAnnouncement.text}
                  onChange={(e) => setNewAnnouncement((prev) => ({ ...prev, text: e.target.value }))}
                  placeholder="Ex: Matrículas abertas para o segundo semestre de 2025!"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Prioridade (1 = maior prioridade)</Label>
                <Input
                  type="number"
                  min={1}
                  value={newAnnouncement.priority}
                  onChange={(e) =>
                    setNewAnnouncement((prev) => ({ ...prev, priority: Number.parseInt(e.target.value) || 1 }))
                  }
                />
              </div>

              <Button onClick={handleAdd} className="w-full bg-[#E30613] hover:bg-[#B8050F]" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Adicionar Aviso"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Avisos</CardTitle>
          <CardDescription>Os avisos são exibidos em sequência no rodapé da TV</CardDescription>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum aviso cadastrado</p>
              <p className="text-sm">Clique em "Novo Aviso" para começar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${announcement.is_active ? "bg-card" : "bg-muted/50 opacity-60"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={announcement.priority}
                      onChange={(e) => handleUpdatePriority(announcement.id, Number.parseInt(e.target.value) || 1)}
                      className="w-16 text-center"
                    />
                  </div>

                  <div className="flex-1">
                    <p className="text-foreground">{announcement.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Criado em {new Date(announcement.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={announcement.is_active}
                        onCheckedChange={(checked) => handleToggleActive(announcement.id, checked)}
                      />
                      <span className="text-sm text-muted-foreground">{announcement.is_active ? "Ativo" : "Inativo"}</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(announcement.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pré-visualização</CardTitle>
          <CardDescription>Como os avisos aparecem no rodapé</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg overflow-hidden">
            <div className="h-12 bg-[#003B71] flex items-center overflow-hidden">
              <div className="whitespace-nowrap animate-ticker">
                <span className="text-white text-lg px-4">
                  {announcements
                    .filter((a) => a.is_active)
                    .map((a) => a.content)
                    .join("     •     ") || "Nenhum aviso ativo"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
