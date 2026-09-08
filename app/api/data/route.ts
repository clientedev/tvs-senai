import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

const TABLES = new Set([
  "institution_settings",
  "media_contents",
  "announcements",
  "tv_devices",
  "tv_content_assignments",
])
const COLUMN = /^[a-z_][a-z0-9_]*$/

function validateTable(table: string) {
  if (!TABLES.has(table)) throw new Error("Tabela inválida")
}

function buildWhere(filters: Array<{ column: string; value: unknown }> = [], start = 1) {
  const values: unknown[] = []
  const clauses = filters.map((filter, index) => {
    if (!COLUMN.test(filter.column)) throw new Error("Coluna inválida")
    values.push(filter.value)
    return `"${filter.column}" = $${start + index}`
  })
  return { sql: clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "", values }
}

function safeColumns(select: string) {
  const columns = select === "*" ? ["*"] : select.split(",").map((column) => column.trim())
  if (columns.some((column) => column !== "*" && !COLUMN.test(column))) {
    throw new Error("Coluna inválida")
  }
  return columns.join(", ")
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const table = params.get("table") || ""
    validateTable(table)
    const columns = safeColumns(params.get("select") || "*")
    const filters = JSON.parse(params.get("filters") || "[]")
    const orders = JSON.parse(params.get("orders") || "[]")
    const { sql: whereSql, values } = buildWhere(filters)
    const orderSql = Array.isArray(orders) && orders.length
      ? ` ORDER BY ${orders.map((order: { column: string; ascending: boolean }) => {
          if (!COLUMN.test(order.column)) throw new Error("Coluna inválida")
          return `"${order.column}" ${order.ascending === false ? "DESC" : "ASC"}`
        }).join(", ")}`
      : ""
    const single = params.get("single") === "true"
    const result = await query(`SELECT ${columns} FROM "${table}"${whereSql}${orderSql}${single ? " LIMIT 1" : ""}`, values)
    if (single) {
      if (!result.rows[0]) return NextResponse.json({ data: null, error: { message: "Registro não encontrado" } })
      return NextResponse.json({ data: result.rows[0], error: null })
    }
    return NextResponse.json({ data: result.rows, error: null })
  } catch (error: any) {
    return NextResponse.json({ data: null, error: { message: error?.message || "Erro ao consultar dados" } }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { table, operation, payload, filters = [] } = body
    validateTable(table)
    const user = await getCurrentUser()
    const isPublicHeartbeat = table === "tv_devices" &&
      operation === "update" &&
      filters.length === 1 &&
      filters[0].column === "id" &&
      payload && Object.keys(payload).every((key) => key === "last_seen")
    if (!user && !isPublicHeartbeat) {
      return NextResponse.json({ data: null, error: { message: "Não autenticado" } }, { status: 401 })
    }

    const where = buildWhere(filters)
    if (operation === "insert") {
      const rows = Array.isArray(payload) ? payload : [payload]
      if (!rows.length) return NextResponse.json({ data: [], error: null })
      const keys = Object.keys(rows[0])
      if (!keys.length || keys.some((key) => !COLUMN.test(key))) throw new Error("Dados inválidos")
      const values: unknown[] = []
      const tuples = rows.map((row) => {
        const placeholders = keys.map((key) => {
          values.push(row[key])
          return `$${values.length}`
        })
        return `(${placeholders.join(", ")})`
      })
      const result = await query(
        `INSERT INTO "${table}" (${keys.map((key) => `"${key}"`).join(", ")}) VALUES ${tuples.join(", ")} RETURNING *`,
        values,
      )
      return NextResponse.json({ data: Array.isArray(payload) ? result.rows : result.rows[0], error: null })
    }

    if (operation === "update") {
      const keys = Object.keys(payload || {})
      if (!keys.length || keys.some((key) => !COLUMN.test(key))) throw new Error("Dados inválidos")
      const values = keys.map((key) => payload[key])
      const setSql = keys.map((key, index) => `"${key}" = $${index + 1}`).join(", ")
      const result = await query(
        `UPDATE "${table}" SET ${setSql}${where.sql.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + keys.length}`)} RETURNING *`,
        [...values, ...where.values],
      )
      return NextResponse.json({ data: result.rows, error: null })
    }

    if (operation === "delete") {
      const result = await query(`DELETE FROM "${table}"${where.sql} RETURNING *`, where.values)
      return NextResponse.json({ data: result.rows, error: null })
    }

    throw new Error("Operação inválida")
  } catch (error: any) {
    return NextResponse.json({ data: null, error: { message: error?.message || "Erro ao salvar dados" } }, { status: 400 })
  }
}