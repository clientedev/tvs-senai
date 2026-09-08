import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const fileId = decodeURIComponent(id)
    if (!/^[a-zA-Z0-9._-]+$/.test(fileId)) {
      return NextResponse.json({ message: "Arquivo inválido" }, { status: 400 })
    }

    const result = await query<{ mime_type: string; data: Buffer }>(
      "SELECT mime_type, data FROM uploaded_files WHERE id = $1 LIMIT 1",
      [fileId],
    )
    const file = result.rows[0]
    if (!file) return NextResponse.json({ message: "Arquivo não encontrado" }, { status: 404 })

    return new NextResponse(new Uint8Array(file.data), {
      headers: {
        "content-type": file.mime_type || "application/octet-stream",
        "cache-control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || "Erro ao ler arquivo" }, { status: 500 })
  }
}
