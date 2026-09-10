"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import type { MediaContent } from "@/lib/types"
import { detectMediaType, getEmbedUrl } from "@/lib/video-utils"
import { ensureHttpsUrl } from "@/lib/url"
import { Plus, Trash2, GripVertical, ImageIcon, Video, AlertCircle, Youtube, Loader2, Pencil, Calendar, Radio } from "lucide-react"
import { LIVE_CHANNELS } from "@/lib/live-channels"

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { format } from "date-fns"

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500 MB

// Sortable Item Component
function SortableContentItem({
  content,
  index,
  onEdit,
  onToggleActive,
  onDelete,
  getTypeIcon,
  getTypeLabel
}: {
  content: MediaContent
  index: number
  onEdit: (content: MediaContent) => void
  onToggleActive: (id: string, active: boolean) => void
  onDelete: (id: string) => void
  getTypeIcon: (type: string) => React.ReactNode
  getTypeLabel: (type: string) => string
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: content.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${content.is_active ? "bg-card" : "bg-muted/50 opacity-60"
        }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab hover:text-primary">
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="w-6 h-6 rounded-full bg-[#003B71] text-white flex items-center justify-center text-xs font-bold">
        {index + 1}
      </div>

      <div className="w-20 h-14 bg-muted rounded overflow-hidden flex-shrink-0 relative">
        {content.type === "image" ? (
          <img
            src={ensureHttpsUrl(content.file_url) || "/placeholder.svg"}
            alt={content.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={`w-full h-full flex items-center justify-center ${content.type === "youtube" ? "bg-[#E30613]" : content.type === "live" ? "bg-[#0F7B3A]" : "bg-[#003B71]"}`}
          >
            {getTypeIcon(content.type)}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{content.title}</p>
        <div className="text-xs text-muted-foreground flex flex-col gap-0.5">
          <span>{getTypeLabel(content.type)} • {content.duration_seconds}s</span>
          {(content.scheduled_start || content.scheduled_end) && (
            <span className="flex items-center gap-1 text-amber-600">
              <Calendar className="w-3 h-3" />
              {content.scheduled_start ? format(new Date(content.scheduled_start), "dd/MM/yy HH:mm") : "Inicio"}
              {" -> "}
              {content.scheduled_end ? format(new Date(content.scheduled_end), "dd/MM/yy HH:mm") : "Fim"}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={content.is_active}
          onCheckedChange={(checked) => onToggleActive(content.id, checked)}
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(content)}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <Pencil className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(content.id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export default function ContentPage() {
  const [contents, setContents] = useState<MediaContent[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContent, setEditingContent] = useState<MediaContent | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    type: "image" as "image" | "video" | "youtube" | "live",
    duration: 10,
    loop_video: false,
    scheduled_start: "",
    scheduled_end: ""
  })

  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchContents = async () => {
    const { data, error } = await supabase
      .from("media_contents")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching contents:", error)
      return
    }

    setContents(data || [])
  }

  useEffect(() => {
    fetchContents()
  }, [])

  const handleSave = async () => {
    if (!formData.name || !formData.url) return

    setIsUploading(true)
    try {
      const payload = {
        title: formData.name,
        file_url: formData.url,
        type: formData.type,
        duration_seconds: formData.duration,
        loop_video: formData.loop_video,
        scheduled_start: formData.scheduled_start || null,
        scheduled_end: formData.scheduled_end || null,
        is_active: true,
      }

      if (editingContent) {
        const { error } = await supabase
          .from("media_contents")
          .update(payload)
          .eq("id", editingContent.id)
        if (error) throw error
      } else {
        // Get max order to append at end
        const maxOrder = contents.length > 0 ? Math.max(...contents.map(c => c.display_order)) : 0

        const { error } = await supabase.from("media_contents").insert({
          ...payload,
          display_order: maxOrder + 1
        })
        if (error) throw error
      }

      fetchContents()
      closeDialog()
    } catch (error) {
      console.error("Error saving content:", error)
      const err = error as Error
      setUploadError(`Erro ao salvar: ${err.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setContents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)

        const newItems = arrayMove(items, oldIndex, newIndex)

        // Update order in Supabase seamlessly
        // We update ALL items to have their new index as display_order
        // This is efficient enough for small lists (<100 items)
        const updates = newItems.map((item, index) => ({
          id: item.id,
          display_order: index,
        }))

        // Fire and forget update (optimistic UI)
        updates.forEach(update => {
          supabase.from("media_contents").update({ display_order: update.display_order }).eq("id", update.id).then()
        })

        return newItems
      })
    }
  }

  const handleEdit = (content: MediaContent) => {
    setEditingContent(content)
    setFormData({
      name: content.title,
      url: content.file_url,
      type: content.type,
      duration: content.duration_seconds,
      loop_video: content.loop_video ?? false,
      scheduled_start: content.scheduled_start ? new Date(content.scheduled_start).toISOString().slice(0, 16) : "",
      scheduled_end: content.scheduled_end ? new Date(content.scheduled_end).toISOString().slice(0, 16) : ""
    })
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingContent(null)
    setUploadError(null)
    setFormData({ name: "", url: "", type: "image", duration: 10, loop_video: false, scheduled_start: "", scheduled_end: "" })
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    // Optimistic update
    setContents(contents.map(c => c.id === id ? { ...c, is_active: active } : c))
    await supabase.from("media_contents").update({ is_active: active }).eq("id", id)
    fetchContents() // Sync to be sure
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este conteúdo?")) return
    setContents(contents.filter(c => c.id !== id)) // Optimistic
    await supabase.from("media_contents").delete().eq("id", id)
    fetchContents()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setIsUploading(true)

    try {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("Arquivo maior que 500 MB")
      }

      let fileToUpload = file

      if (file.type.startsWith("image/")) {
        try {
          const compressedBlob = await new Promise<Blob>((resolve, reject) => {
            compressImage(file, 1920, 0.8)
              .then(dataUrl => {
                fetch(dataUrl).then(res => res.blob()).then(resolve).catch(reject)
              })
              .catch(reject)
          })
          fileToUpload = new File([compressedBlob], file.name, { type: file.type })
        } catch (err) {
          console.warn("Compression failed, using original file", err)
        }
      }

      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadErr } = await supabase.storage
        .from("corporate-media")
        .upload(filePath, fileToUpload)

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage.from("corporate-media").getPublicUrl(filePath)

      setFormData((prev) => ({
        ...prev,
        url: publicUrl,
        type: file.type.startsWith("video/") ? "video" : "image",
        name: prev.name || file.name.replace(/\.[^/.]+$/, ""),
      }))

    } catch (err: any) {
      console.error("Upload error:", err)
      setUploadError(`Erro no upload: ${err.message}`)
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "youtube": return <Youtube className="w-6 h-6 text-white" />
      case "live": return <Radio className="w-6 h-6 text-white" />
      case "video": return <Video className="w-6 h-6 text-white" />
      default: return <ImageIcon className="w-6 h-6 text-white" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "youtube": return "YouTube/Vimeo"
      case "live": return "TV ao vivo"
      case "video": return "Vídeo"
      default: return "Imagem"
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Conteúdos</h1>
          <p className="text-muted-foreground mt-1">Gerencie imagens e vídeos exibidos na TV</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-[#E30613] hover:bg-[#B8050F]">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Conteúdo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingContent ? "Editar Conteúdo" : "Novo Conteúdo"}</DialogTitle>
              <DialogDescription>Adicione ou edite conteúdos da playlist. Você pode agendar a exibição.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {uploadError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Arquivo de Mídia (máx. 500 MB)</Label>
                <div className="flex gap-2">
                  <Input type="file" accept="image/*,video/*" onChange={handleFileUpload} disabled={isUploading} className="flex-1" />
                </div>
                {isUploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando arquivo... Vídeos grandes podem levar alguns minutos.</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>TV ao vivo (canais públicos)</Label>
                <div className="flex flex-wrap gap-2">
                  {LIVE_CHANNELS.map((channel) => (
                    <Button
                      key={channel.id}
                      type="button"
                      variant={formData.url === channel.url ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          url: channel.url,
                          type: "live",
                          name: prev.name || channel.name,
                          duration: prev.duration < 60 ? 300 : prev.duration,
                        }))
                      }
                      className={formData.url === channel.url ? "bg-[#0F7B3A]" : ""}
                    >
                      {channel.name}
                    </Button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Streams oficiais da EBC e da Câmara. Emissoras comerciais não têm API aberta para embedding.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Ou cole uma URL (YouTube, Vimeo, HLS .m3u8 ou link direto)</Label>
                <Input
                  value={formData.url.startsWith("data:") ? "" : formData.url}
                  onChange={(e) => {
                    const rawUrl = e.target.value
                    const url = ensureHttpsUrl(rawUrl)
                    const detected = detectMediaType(url)
                    setFormData(prev => ({
                      ...prev,
                      url,
                      type: detected,
                      duration: detected === "youtube" ? 60 : detected === "live" ? 300 : prev.duration,
                    }))
                  }}
                  placeholder="https://youtube.com/watch?v=... ou https://exemplo.com/stream.m3u8"
                />
              </div>

              {formData.url && (
                <div className="space-y-2">
                  <Label>Pré-visualização</Label>
                  <div className="w-full h-48 bg-muted rounded overflow-hidden relative border">
                    {formData.type === "image" ? (
                      <img
                        src={ensureHttpsUrl(formData.url) || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : formData.type === "live" ? (
                      <div className="flex h-full w-full items-center justify-center bg-[#0F7B3A] text-sm font-medium text-white">
                        TV ao vivo · stream HLS
                      </div>
                    ) : formData.type === "youtube" ? (
                      (() => {
                        const embedUrl = getEmbedUrl(ensureHttpsUrl(formData.url))
                        if (!embedUrl) {
                          return (
                            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                              URL de vídeo inválida
                            </div>
                          )
                        }
                        return (
                          <iframe
                            src={embedUrl}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        )
                      })()
                    ) : (
                      <video src={ensureHttpsUrl(formData.url)} className="w-full h-full object-contain" muted controls />
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Nome do Conteúdo</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Banner Matrículas 2025"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant={formData.type === "image" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, type: "image" }))}
                      className={formData.type === "image" ? "bg-[#003B71]" : ""}
                    >
                      <ImageIcon className="w-4 h-4 mr-1" />
                      Imagem
                    </Button>
                    <Button
                      type="button"
                      variant={formData.type === "video" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, type: "video" }))}
                      className={formData.type === "video" ? "bg-[#003B71]" : ""}
                    >
                      <Video className="w-4 h-4 mr-1" />
                      Vídeo
                    </Button>
                    <Button
                      type="button"
                      variant={formData.type === "youtube" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, type: "youtube" }))}
                      className={formData.type === "youtube" ? "bg-[#E30613]" : ""}
                    >
                      <Youtube className="w-4 h-4 mr-1" />
                      YouTube
                    </Button>
                    <Button
                      type="button"
                      variant={formData.type === "live" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, type: "live", duration: prev.duration < 60 ? 300 : prev.duration }))}
                      className={formData.type === "live" ? "bg-[#0F7B3A]" : ""}
                    >
                      <Radio className="w-4 h-4 mr-1" />
                      TV ao vivo
                    </Button>
                  </div>
                </div>

                {(formData.type === "image" || formData.type === "youtube" || formData.type === "live") && (
                  <div className="space-y-2">
                    <Label>Duração (segundos)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, duration: Number.parseInt(e.target.value) || 10 }))
                      }
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Agendar Ínicio (Opcional)</Label>
                  <Input
                    id="start-date"
                    type="datetime-local"
                    value={formData.scheduled_start}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_start: e.target.value }))}
                  />
                  <p className="text-[10px] text-muted-foreground">Deixe em branco para exibir imediatamente.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Agendar Fim (Opcional)</Label>
                  <Input
                    id="end-date"
                    type="datetime-local"
                    value={formData.scheduled_end}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_end: e.target.value }))}
                  />
                  <p className="text-[10px] text-muted-foreground">Deixe em branco para exibir indefinidamente.</p>
                </div>
              </div>

              {formData.type === "video" && (
                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Repetir vídeo</p>
                    <p className="text-xs text-muted-foreground">O vídeo fica em loop ao invés de avançar para o próximo</p>
                  </div>
                  <Switch
                    checked={formData.loop_video}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, loop_video: v }))}
                  />
                </div>
              )}

              <Button
                onClick={handleSave}
                className="w-full bg-[#E30613] hover:bg-[#B8050F] mt-4"
                disabled={!formData.name || !formData.url || isUploading}
              >
                {editingContent ? "Salvar Alterações" : "Adicionar Conteúdo"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Playlist de Conteúdos</CardTitle>
          <CardDescription>Arraste para reordenar a sequência de exibição.</CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={contents.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {contents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum conteúdo adicionado</p>
                    <p className="text-sm">Clique em "Adicionar Conteúdo" para começar</p>
                  </div>
                ) : (
                  contents.map((content, index) => (
                    <SortableContentItem
                      key={content.id}
                      content={content}
                      index={index}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleActive={handleToggleActive}
                      getTypeIcon={getTypeIcon}
                      getTypeLabel={getTypeLabel}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  )
}
