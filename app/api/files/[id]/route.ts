import { NextRequest, NextResponse } from "next/server"
import { getPool, query } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 300

const CHUNK = 2 * 1024 * 1024 // 2 MB per lo_read call

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const fileId = decodeURIComponent(id)
    if (!/^[a-zA-Z0-9._-]+$/.test(fileId)) {
      return NextResponse.json({ message: "Arquivo invalido" }, { status: 400 })
    }

    // Fetch metadata only (no blob data transferred yet)
    const meta = await query<{ mime_type: string; lo_oid: number | null; size: number | null }>(
      `SELECT mime_type, lo_oid,
        CASE WHEN lo_oid IS NOT NULL THEN octet_length(lo_get(lo_oid))
             ELSE octet_length(data) END AS size
       FROM uploaded_files WHERE id = $1 LIMIT 1`,
      [fileId],
    )
    const file = meta.rows[0]
    if (!file) return NextResponse.json({ message: "Arquivo nao encontrado" }, { status: 404 })

    const mimeType = file.mime_type || "application/octet-stream"
    const totalSize = Number(file.size ?? 0)

    // Parse Range header (browsers use this for video seeking/playback)
    const rangeHeader = request.headers.get("range")
    let start = 0
    let end = totalSize - 1

    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d*)-(\d*)/)
      if (match) {
        start = match[1] ? parseInt(match[1], 10) : 0
        end = match[2] ? parseInt(match[2], 10) : totalSize - 1
      }
      end = Math.min(end, totalSize - 1)
      if (start >= totalSize || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: { "content-range": `bytes */${totalSize}` },
        })
      }
    }

    const contentLength = end - start + 1
    const isPartial = rangeHeader !== null
    const headers: Record<string, string> = {
      "content-type": mimeType,
      "content-length": String(contentLength),
      "accept-ranges": "bytes",
      "cache-control": "public, max-age=31536000, immutable",
    }
    if (isPartial) {
      headers["content-range"] = `bytes ${start}-${end}/${totalSize}`
    }

    // ── Large Object path (new uploads) ──────────────────────────────────
    if (file.lo_oid) {
      const oid = file.lo_oid
      const stream = new ReadableStream({
        async start(controller) {
          const client = await getPool().connect()
          try {
            await client.query("BEGIN")
            const openRes = await client.query<{ fd: number }>(
              "SELECT lo_open($1, 262144) AS fd", [oid],
            )
            const fd = openRes.rows[0].fd

            if (start > 0) {
              await client.query("SELECT lo_lseek64($1, $2, 0)", [fd, start])
            }

            let remaining = contentLength
            while (remaining > 0) {
              const toRead = Math.min(CHUNK, remaining)
              const readRes = await client.query<{ data: Buffer }>(
                "SELECT loread($1, $2) AS data", [fd, toRead],
              )
              const chunk = readRes.rows[0]?.data
              if (!chunk || chunk.length === 0) break
              controller.enqueue(new Uint8Array(chunk))
              remaining -= chunk.length
            }

            await client.query("SELECT lo_close($1)", [fd])
            await client.query("COMMIT")
          } catch (err) {
            await client.query("ROLLBACK").catch(() => {})
            controller.error(err)
          } finally {
            client.release()
            controller.close()
          }
        },
      })
      return new NextResponse(stream, { status: isPartial ? 206 : 200, headers })
    }

    // ── Legacy bytea path (old small files) ──────────────────────────────
    const legacyRes = await query<{ data: Buffer }>(
      "SELECT data FROM uploaded_files WHERE id = $1 LIMIT 1", [fileId],
    )
    const data = legacyRes.rows[0]?.data
    if (!data) return NextResponse.json({ message: "Arquivo sem dados" }, { status: 404 })

    const slice = data.subarray(start, end + 1)
    return new NextResponse(new Uint8Array(slice), { status: isPartial ? 206 : 200, headers })
  } catch (error: any) {
    console.error("File serve error:", error)
    return NextResponse.json({ message: error?.message || "Erro ao ler arquivo" }, { status: 500 })
  }
}