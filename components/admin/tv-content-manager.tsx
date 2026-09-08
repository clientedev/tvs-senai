"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Loader2, GripVertical, Eye } from "lucide-react"
import { OverlayLayoutEditor } from "@/components/admin/overlay-layout-editor"
import { parseOverlayLayout, type TVOverlayLayout } from "@/lib/tv-overlay"
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

interface TVContentManagerProps {
    tvId: string
    tvName: string
}

interface ContentItem {
    id: string
    title: string
    type: string
    assigned: boolean
    orderIndex?: number | null
}

function SortableAssignedItem({
    content,
    index,
    onToggle,
}: {
    content: ContentItem
    index: number
    onToggle: (id: string) => void
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
            className="flex items-center gap-3 p-3 rounded border bg-muted/30"
        >
            <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
                <GripVertical className="w-4 h-4" />
            </div>
            <div className="w-6 h-6 rounded-full bg-[#003B71] text-white flex items-center justify-center text-xs font-bold">
                {index + 1}
            </div>
            <Checkbox
                id={`content-${content.id}`}
                checked={content.assigned}
                onCheckedChange={() => onToggle(content.id)}
            />
            <Label htmlFor={`content-${content.id}`} className="flex-1 cursor-pointer flex items-center justify-between">
                <span className="font-medium">{content.title}</span>
                <span className="flex items-center gap-2">
                    <span className="text-[10px] uppercase px-2 py-1 bg-[#003B71]/10 text-[#003B71] rounded">
                        Em exibição #{index + 1}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase px-2 py-1 bg-muted rounded">{content.type}</span>
                </span>
            </Label>
        </div>
    )
}

export function TVContentManager({ tvId, tvName }: TVContentManagerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [contents, setContents] = useState<ContentItem[]>([])
    const [assignedOrder, setAssignedOrder] = useState<string[]>([])
    const [overlay, setOverlay] = useState<TVOverlayLayout>(() => parseOverlayLayout(null))
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const supabase = createClient()

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const assignedContents = useMemo(
        () => assignedOrder.map((id) => contents.find((c) => c.id === id)).filter(Boolean) as ContentItem[],
        [assignedOrder, contents]
    )
    const sortedContents = useMemo(() => {
        const assignedIds = new Set(assignedOrder)
        const unassigned = contents.filter((c) => !assignedIds.has(c.id))
        return [...assignedContents, ...unassigned]
    }, [assignedContents, assignedOrder, contents])
    const fetchData = async () => {
        setLoading(true)
        try {
            // 1. Get all active media
            const { data: allMedia, error: mediaError } = await supabase
                .from("media_contents")
                .select("id, title, type")
                .eq("is_active", true)
                .order("created_at", { ascending: false })

            if (mediaError) throw mediaError

            // 2. Get assignments and overlay layout for this TV
            const { data: assignments, error: assignError } = await supabase
                .from("tv_content_assignments")
                .select("content_id, order_index")
                .eq("tv_id", tvId)

            if (assignError) throw assignError

            const { data: tv } = await supabase
                .from("tv_devices")
                .select("overlay_layout")
                .eq("id", tvId)
                .single()

            setOverlay(parseOverlayLayout(tv?.overlay_layout))

            const orderedAssignments = (assignments || [])
                .slice()
                .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                .map((a) => a.content_id)
            const availableIds = new Set((allMedia || []).map((m) => m.id))
            const filteredOrder = orderedAssignments.filter((id) => availableIds.has(id))
            const assignedIds = new Set(filteredOrder)

            // 3. Merge
            const merged = (allMedia || []).map((m) => ({
                id: m.id,
                title: m.title,
                type: m.type,
                assigned: assignedIds.has(m.id),
                orderIndex: assignments?.find((a) => a.content_id === m.id)?.order_index ?? null,
            }))

            setContents(merged)
            setAssignedOrder(filteredOrder)
        } catch (err) {
            console.error("Error fetching assignments:", err)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            // 1. Delete all existing assignments for this TV
            await supabase.from("tv_content_assignments").delete().eq("tv_id", tvId)

            // 2. Insert new assignments
            const newAssignments = assignedOrder.map((contentId, index) => ({
                tv_id: tvId,
                content_id: contentId,
                order_index: index,
            }))

            if (newAssignments.length > 0) {
                const { error } = await supabase
                    .from("tv_content_assignments")
                    .insert(newAssignments)
                if (error) throw error
            }

            const { error: overlayError } = await supabase
                .from("tv_devices")
                .update({ overlay_layout: overlay })
                .eq("id", tvId)
            if (overlayError) throw overlayError

            setIsOpen(false)
        } catch (err) {
            console.error("Error saving assignments:", err)
            alert("Erro ao salvar atribuições")
        } finally {
            setSaving(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchData()
        }
    }, [isOpen, tvId])

    const toggleAssignment = (contentId: string) => {
        setContents((prev) => {
            const target = prev.find((c) => c.id === contentId)
            const willAssign = !target?.assigned
            setAssignedOrder((order) => {
                if (willAssign) {
                    return order.includes(contentId) ? order : [...order, contentId]
                }
                return order.filter((id) => id !== contentId)
            })
            return prev.map((c) => (c.id === contentId ? { ...c, assigned: !c.assigned } : c))
        })
    }

    const handleAssignedDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return
        setAssignedOrder((order) => {
            const oldIndex = order.indexOf(active.id as string)
            const newIndex = order.indexOf(over.id as string)
            return arrayMove(order, oldIndex, newIndex)
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    Gerenciar Conteúdo
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Conteúdo para: {tvName}</DialogTitle>
                    <DialogDescription>
                        Escolha as mídias, a ordem e o que aparece nos intervalos da tela.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin w-8 h-8 opacity-50" /></div>
                    ) : contents.length === 0 ? (
                        <p className="text-center text-muted-foreground">Nenhum conteúdo disponível na biblioteca.</p>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold uppercase text-muted-foreground">Ordem de exibição</h3>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {assignedContents.length} em exibição
                                </span>
                            </div>
                            {sortedContents.length === 0 ? (
                                <div className="text-sm text-muted-foreground border rounded p-3">
                                    Nenhum conteúdo disponível.
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleAssignedDragEnd}
                                >
                                    <SortableContext
                                        items={assignedOrder}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="grid gap-2">
                                            {sortedContents.map((content) => {
                                                const assignedIndex = assignedOrder.indexOf(content.id)
                                                if (content.assigned && assignedIndex >= 0) {
                                                    return (
                                                        <SortableAssignedItem
                                                            key={content.id}
                                                            content={content}
                                                            index={assignedIndex}
                                                            onToggle={toggleAssignment}
                                                        />
                                                    )
                                                }
                                                return (
                                                    <div key={content.id} className="flex items-center space-x-3 p-3 rounded hover:bg-muted/50 border">
                                                        <div className="w-4 h-4" />
                                                        <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold">
                                                            -
                                                        </div>
                                                        <Checkbox
                                                            id={`content-${content.id}`}
                                                            checked={content.assigned}
                                                            onCheckedChange={() => toggleAssignment(content.id)}
                                                        />
                                                        <Label htmlFor={`content-${content.id}`} className="flex-1 cursor-pointer flex items-center justify-between">
                                                            <span className="font-medium">{content.title}</span>
                                                            <span className="flex items-center gap-2">
                                                                <span className="text-xs text-muted-foreground uppercase px-2 py-1 bg-muted rounded">{content.type}</span>
                                                            </span>
                                                        </Label>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>
                    )}

                    {!loading && <OverlayLayoutEditor value={overlay} onChange={setOverlay} />}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={saving || loading}>
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Salvar Alterações
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
