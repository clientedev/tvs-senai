"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Check, Trash2, AlertTriangle, RotateCcw, Loader2 } from "lucide-react"
import { ensureHttpsUrl } from "@/lib/url"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function InstitutionPage() {
  const [name, setName] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("institution_settings").select("*").single()

      if (data) {
        setName(data.name)
        setLogoUrl(data.logo_url || "")
      } else if (!error) {
        // initializing if empty (though SQL file handles this, it's a fallback)
      }
    } catch (err) {
      console.error("Error fetching settings:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const { data: existing } = await supabase.from("institution_settings").select("id").single()

      let error
      if (existing) {
        const result = await supabase
          .from("institution_settings")
          .update({ name, logo_url: logoUrl })
          .eq("id", existing.id)
        error = result.error
      } else {
        const result = await supabase
          .from("institution_settings")
          .insert({ name, logo_url: logoUrl })
        error = result.error
      }

      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error("Error saving settings:", err)
      alert("Erro ao salvar configurações")
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `logo-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("app-assets")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("app-assets")
        .getPublicUrl(filePath)

      setLogoUrl(publicUrl)
    } catch (err) {
      console.error("Logo upload error:", err)
      alert("Erro ao fazer upload do logo")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Instituição</h1>
        <p className="text-muted-foreground mt-1">Configure as informações da instituição</p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Dados Institucionais</CardTitle>
            <CardDescription>Estas informações aparecem no cabeçalho da TV</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Instituição</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Escola SENAI Orlando Laviero Ferraiuolo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo da Instituição</Label>
              <div className="flex items-start gap-4">
                <div className="w-32 h-20 bg-muted rounded-lg overflow-hidden flex items-center justify-center border">
                  {logoUrl ? (
                    <img
                      src={ensureHttpsUrl(logoUrl) || "/placeholder.svg"}
                      alt="Logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-muted-foreground text-sm">Sem logo</span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="cursor-pointer"
                      disabled={uploading}
                    />
                  </div>
                  {uploading && <div className="text-xs flex items-center gap-1 text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Enviando...</div>}
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: PNG, JPG, SVG. Recomendado: fundo transparente.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">Ou cole a URL do logo</Label>
              <Input
                id="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(ensureHttpsUrl(e.target.value))}
                placeholder="https://exemplo.com/logo.png"
              />
            </div>

            <Button onClick={handleSave} className="w-full bg-[#E30613] hover:bg-[#B8050F]">
              {saved ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Salvo!
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Pré-visualização</CardTitle>
            <CardDescription>Como o cabeçalho aparecerá na TV</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border border-black/10">
              <div className="flex items-center justify-between gap-4 border-b-4 border-[#E30613] bg-[#111111] px-5 py-4 text-white">
                <div className="flex min-w-0 items-center gap-4">
                  {logoUrl && (
                    <div className="flex h-12 items-center rounded-lg bg-white px-2 py-1">
                      <img
                        src={ensureHttpsUrl(logoUrl) || "/placeholder.svg"}
                        alt="Logo"
                        className="h-9 w-auto object-contain"
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E30613]">
                      SENAI Cast
                    </p>
                    <span className="block truncate font-bold">{name || "Nome da Instituição"}</span>
                  </div>
                </div>
                <div className="rounded-xl bg-[#1d1d1d] px-4 py-2 text-right text-sm">
                  <div className="text-xl font-bold tabular-nums">14:30:00</div>
                  <div className="capitalize text-white/70">segunda-feira, 8 de setembro</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone Removed */}
      </div>
    </div>
  )
}
