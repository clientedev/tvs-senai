import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { query } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300
export const maxRequestBodySize = "500mb"

const MAX_BYTES = 500 * 1024 * 1024

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ message: "Não autenticado" }, { status: 401 })
  try {
    const form = await request.formData()
    const file = form.get("file")
    const requestedPath = String(form.get("path") || "")
    if (!(file instanceof File) || !requestedPath) {
      return NextResponse.json({ message: "Arquivo inválido" }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ message: "Arquivo maior que 500 MB" }, { status: 413 })
    }

    const safeName = requestedPath
      .split(/[/\\]/)
      .pop()
      ?.replace(/[^a-zA-Z0-9._-]/g, "_")
    if (!safeName) {
      return NextResponse.json({ message: "Nome de arquivo inválido" }, { status: 400 })
    }

    const data = Buffer.from(await file.arrayBuffer())
    await query(
      `INSERT INTO uploaded_files (id, mime_type, original_name, data)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET mime_type = EXCLUDED.mime_type, original_name = EXCLUDED.original_name, data = EXCLUDED.data`,
      [safeName, file.type || "application/octet-stream", file.name, data],
    )

    const publicUrl = `/api/files/${encodeURIComponent(safeName)}`
    return NextResponse.json({ path: safeName, publicUrl })
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || "Erro ao salvar arquivo" }, { status: 500 })
  }
}
