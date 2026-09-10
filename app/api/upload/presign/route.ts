import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createPresignedPutUrl, getPublicUrl } from "@/lib/r2"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ message: "Nao autenticado" }, { status: 401 })

  try {
    const { filename, contentType, size } = await request.json()

    if (!filename || !contentType) {
      return NextResponse.json({ message: "filename e contentType sao obrigatorios" }, { status: 400 })
    }

    // 2 GB limit
    const MAX = 2 * 1024 * 1024 * 1024
    if (size && size > MAX) {
      return NextResponse.json({ message: "Arquivo maior que 2 GB" }, { status: 413 })
    }

    const ext = filename.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "bin"
    const key = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`

    const uploadUrl = await createPresignedPutUrl(key, contentType)
    const publicUrl = getPublicUrl(key)

    return NextResponse.json({ uploadUrl, publicUrl, key })
  } catch (error: any) {
    console.error("Presign error:", error)
    return NextResponse.json({ message: error?.message || "Erro ao gerar URL" }, { status: 500 })
  }
}
