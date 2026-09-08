"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  DEFAULT_OVERLAY_LAYOUT,
  contrastingText,
  type OverlayBox,
  type TVOverlayLayout,
} from "@/lib/tv-overlay"
import { Button } from "@/components/ui/button"

const HEADER_ITEMS: Array<{ key: keyof TVOverlayLayout; label: string; hint: string }> = [
  { key: "logo", label: "Logo e nome", hint: "Bloco esquerdo do cabeçalho" },
  { key: "weather", label: "Clima (São Paulo)", hint: "Temperatura no cabeçalho" },
  { key: "clock", label: "Horário", hint: "Relógio e data no cabeçalho" },
]

const ANNOUNCEMENT_COLORS = [
  { label: "Azul SENAI", value: "#003B71" },
  { label: "Vermelho SENAI", value: "#E30613" },
  { label: "Preto", value: "#111111" },
  { label: "Branco", value: "#FFFFFF" },
  { label: "Verde", value: "#0F7B3A" },
  { label: "Amarelo", value: "#F4C430" },
]

interface OverlayLayoutEditorProps {
  value: TVOverlayLayout
  onChange: (next: TVOverlayLayout) => void
}

export function OverlayLayoutEditor({ value, onChange }: OverlayLayoutEditorProps) {
  const showHeader = value.logo.visible || value.weather.visible || value.clock.visible

  const updateBox = (key: keyof TVOverlayLayout, patch: Partial<OverlayBox>) => {
    onChange({
      ...value,
      [key]: { ...value[key], ...patch },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase text-muted-foreground">Intervalos na tela</h3>
          <p className="text-xs text-muted-foreground">
            Cabeçalho no topo e faixas embaixo. A mídia fica só no espaço do meio, sem corte.
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
        {HEADER_ITEMS.map((item) => {
          const box = value[item.key]
          return (
            <div key={item.key} className="flex items-center justify-between gap-3 rounded-lg border p-3">
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
          )
        })}

        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label htmlFor="overlay-announcements" className="font-medium">Faixa de avisos</Label>
              <p className="text-xs text-muted-foreground">Tarja de mensagens na parte de baixo</p>
            </div>
            <Switch
              id="overlay-announcements"
              checked={value.announcements.visible}
              onCheckedChange={(checked) => updateBox("announcements", { visible: checked })}
            />
          </div>
          {value.announcements.visible && (
            <div className="space-y-2">
              <Label className="text-[11px] text-muted-foreground">Cor da faixa</Label>
              <div className="flex flex-wrap items-center gap-2">
                {ANNOUNCEMENT_COLORS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    title={preset.label}
                    className={`h-8 w-8 rounded-full border ${
                      value.announcements.color.toLowerCase() === preset.value.toLowerCase()
                        ? "ring-2 ring-offset-2 ring-[#E30613]"
                        : "border-black/15"
                    }`}
                    style={{ backgroundColor: preset.value }}
                    onClick={() => updateBox("announcements", { color: preset.value })}
                  />
                ))}
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  Outra
                  <input
                    type="color"
                    value={value.announcements.color}
                    onChange={(event) => updateBox("announcements", { color: event.target.value })}
                    className="h-8 w-10 cursor-pointer rounded border bg-transparent"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div>
            <Label htmlFor="overlay-transport" className="font-medium">Tarja de transporte</Label>
            <p className="text-xs text-muted-foreground">Status do metrô e CPTM</p>
          </div>
          <Switch
            id="overlay-transport"
            checked={value.transport.visible}
            onCheckedChange={(checked) => updateBox("transport", { visible: checked })}
          />
        </div>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-[#111] text-white">
        <div className="absolute inset-0 flex flex-col">
          {showHeader && (
            <div className="flex h-[14%] items-center justify-between border-b-2 border-[#E30613] bg-[#111111] px-3 text-[10px] font-semibold">
              <span>{value.logo.visible ? "Logo e nome" : ""}</span>
              <div className="flex gap-2">
                {value.weather.visible && <span className="rounded bg-[#1d1d1d] px-2 py-1">Clima</span>}
                {value.clock.visible && <span className="rounded bg-[#1d1d1d] px-2 py-1">Horário</span>}
              </div>
            </div>
          )}
          <div className="flex min-h-0 flex-1 items-center justify-center bg-[linear-gradient(135deg,#003B71_0%,#001d38_100%)] text-xs text-white/70">
            Mídia no espaço do meio
          </div>
          {value.announcements.visible && (
            <div
              className="flex h-[11%] items-center px-3 text-[10px] font-semibold"
              style={{
                backgroundColor: value.announcements.color,
                color: contrastingText(value.announcements.color),
              }}
            >
              Faixa de avisos
            </div>
          )}
          {value.transport.visible && (
            <div className="flex h-[11%] items-center bg-[#111111] px-3 text-[10px] font-semibold">
              Tarja de transporte
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
