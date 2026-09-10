import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getPool } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300
export const maxRequestBodySize = "600mb"

const MAX_BYTES = 500 * 1024 * 1024 // 500 MB

/**
 * Upload using PostgreSQL Large Objects so the entire file is never
 * loaded into Node.js memory at once.  Each lo_write call sends a
 * small chunk to the database.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ message: "Nao autenticado" }, { status: 401 })

  const client = await getPool().connect()
  try {
    const form = await request.formData()
    const file = form.get("file")
    const requestedPath = String(form.get("path") || "")

    if (!(file instanceof File) || !requestedPath) {
      return NextResponse.json({ message: "Arquivo invalido" }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ message: "Arquivo maior que 500 MB" }, { status: 413 })
    }

    const safeName = requestedPath
      .split(/[/\\]/)
      .pop()
      ?.replace(/[^a-zA-Z0-9._-]/g, "_")
    if (!safeName) {
      return NextResponse.json({ message: "Nome de arquivo invalido" }, { status: 400 })
    }

    // Large Object: needs a transaction on a dedicated connection
    await client.query("BEGIN")

    // Create a new large object and get its OID
    const createRes = await client.query<{ oid: number }>("SELECT lo_creat(-1) AS oid")
    const oid = createRes.rows[0].oid

    // Open the large object for writing (131072 = INV_WRITE)
    const openRes = await client.query<{ fd: number }>("SELECT lo_open($1, 131072) AS fd", [oid])
    const fd = openRes.rows[0].fd

    // Write in 2 MB chunks to avoid allocating the whole file at once
    const CHUNK = 2 * 1024 * 1024
    const arrayBuf = await file.arrayBuffer()
    const buf = Buffer.from(arrayBuf)

    for (let offset = 0; offset < buf.length; offset += CHUNK) {
      const chunk = buf.subarray(offset, Math.min(offset + CHUNK, buf.length))
      await client.query("SELECT lowrite($1, $2)", [fd, chunk])
    }

    await client.query("SELECT lo_close($1)", [fd])

    // Store metadata + oid; keep data column null for large-object rows
    await client.query(
      `INSERT INTO uploaded_files (id, mime_type, original_name, lo_oid, data)
       VALUES ($1, $2, $3, $4, ''::bytea)
       ON CONFLICT (id) DO UPDATE
         SET mime_type = EXCLUDED.mime_type,
             original_name = EXCLUDED.original_name,
             lo_oid = EXCLUDED.lo_oid`,
      [safeName, file.type || "application/octet-stream", file.name, oid],
    )

    await client.query("COMMIT")

    const publicUrl = `/api/files/${encodeURIComponent(safeName)}`
    return NextResponse.json({ path: safeName, publicUrl })
  } catch (error: any) {
    await client.query("ROLLBACK").catch(() => {})
    console.error("Upload error:", error)
    return NextResponse.json({ message: error?.message || "Erro ao salvar arquivo" }, { status: 500 })
  } finally {
    client.release()
  }
}
