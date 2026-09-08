"use client"

import { useRef, useState } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { DEFAULT_OVERLAY_LAYOUT, type OverlayBox, type TVOverlayLayout } from "@/lib/tv-overlay"
import { Button } from "@/components/ui/button"

const ITEMS: Array<{ key: keyof TVOverlayLayout; label: string; hint: string }> = [
  { key: "logo", label: "Logo da instituição", hint: "Cabeçalho com o nome e o brasão" },
  { key: "clock", label: "Horário", hint: "Relógio e data atuais" },
  { key: "weather", label: "Clima (São Paulo)", hint: "Temperatura ao lado do horário" },
  { key: "announcements", label: "Faixa de avisos", hint: "Tarja de mensagens nos intervalos" },
  { key: "transport", label: "Tarja de transporte", hint: "Status do metrô e CPTM" },
]

interface OverlayLayoutEditorProps {
  value: TVOverlayLayout
  onChange: (next: TVOverlayLayout) => void
}

export function OverlayLayoutEditor({ value, onChange }: OverlayLayoutEditorProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<keyof TVOverlayLayout | null>(null)

  const updateBox = (key: keyof TVOverlayLayout, patch: Partial<OverlayBox>) => {
    onChange({
      ...value,
      [key]: { ...value[key], ...patch },
    })
  }

  const moveItem = (key: keyof TVOverlayLayout, clientX: number, clientY: number) => {
    const rect = previewRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100
    updateBox(key, {
      x: Math.min(92, Math.max(0, Math.round(x * 10) / 10)),
      y: Math.min(94, Math.max(0, Math.round(y * 10) / 10)),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase text-muted-foreground">Intervalos na tela</h3>
          <p className="text-xs text-muted-foreground">
            Escolha o que aparece sobre a mídia e arraste no preview para posicionar.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(DEFAULT_OVERLAY_LAYOUT)}
        >
          Restaurar padrão
        </Button>
      </div>

      <div className="grid gap-3">
        {ITEMS.map((item) => {
          const box = value[item.key]
          return (
            <div key={item.key} className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label htmlFor={`overlay-${item.key}`} className="font-medium">{item.label}</Label>
                  <p className="text-xs text-muted-foreground">{item.hint}</p>
                </div>
                <Switch
                  id={`overlay-${item.key}`}
                  checked={box.visible}
                  onCheckedChange={(checked) => updateBox(item.key, { visible: checked })}
                />
              </div>
              {box.visible && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Horizontal {Math.round(box.x)}%</Label>
                    <Slider
                      min={0}
                      max={92}
                      step={1}
                      value={[box.x]}
                      onValueChange={([x]) => updateBox(item.key, { x })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Vertical {Math.round(box.y)}%</Label>
                    <Slider
                      min={0}
                      max={94}
                      step={1}
                      value={[box.y]}
                      onValueChange={([y]) => updateBox(item.key, { y })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Largura {Math.round(box.width)}%</Label>
                    <Slider
                      min={8}
                      max={100}
                      step={1}
                      value={[box.width]}
                      onValueChange={([width]) => updateBox(item.key, { width })}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div
        ref={previewRef}
        className="relative aspect-video w-full overflow-hidden rounded-lg bg-[#111] text-white select-none"
        onPointerMove={(event) => {
          if (!dragging) return
          moveItem(dragging, event.clientX, event.clientY)
        }}
        onPointerUp={() => setDragging(null)}
        onPointerLeave={() => setDragging(null)}
      >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#003B71_0%,#001d38_100%)] opacity-80" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-white/50">
          Preview 16:9 — arraste os blocos
        </span>
        {(Object.keys(value) as Array<keyof TVOverlayLayout>).map((key) => {
          const box = value[key]
          if (!box.visible) return null
          const label = ITEMS.find((item) => item.key === key)?.label || key
          return (
            <button
              key={key}
              type="button"
              className="absolute cursor-grab rounded bg-[#E30613]/90 px-2 py-1 text-left text-[10px] font-semibold leading-tight active:cursor-grabbing"
              style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.width}%` }}
              onPointerDown={(event) => {
                event.preventDefault()
                event.currentTarget.setPointerCapture(event.pointerId)
                setDragging(key)
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
