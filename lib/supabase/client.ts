"use client"

import type {
  Announcement,
  InstitutionSettings,
  MediaContent,
  TVContentAssignment,
  TVDevice,
} from "@/lib/types"

type Filter = { column: string; value: unknown }
type Order = { column: string; ascending: boolean }
type TableRows = {
  institution_settings: InstitutionSettings[]
  media_contents: MediaContent[]
  announcements: Announcement[]
  tv_devices: TVDevice[]
  tv_content_assignments: TVContentAssignment[]
}
type ChannelPayload = { eventType: string; new: any; old: any }

class QueryBuilder<T = Record<string, any>> implements PromiseLike<{ data: T; error: any }> {
  private operation: "select" | "insert" | "update" | "delete" = "select"
  private payload: unknown
  private filters: Filter[] = []
  private orders: Order[] = []
  private columns = "*"
  private wantsSingle = false

  constructor(private readonly table: string) {}

  select(columns = "*") {
    this.columns = columns
    if (!this.payload) this.operation = "select"
    return this
  }

  insert(payload: unknown) {
    this.operation = "insert"
    this.payload = payload
    return this
  }

  update(payload: unknown) {
    this.operation = "update"
    this.payload = payload
    return this
  }

  delete() {
    this.operation = "delete"
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orders.push({ column, ascending: options?.ascending !== false })
    return this
  }

  single(): QueryBuilder<T extends any[] ? T[number] : T> {
    this.wantsSingle = true
    return this as unknown as QueryBuilder<T extends any[] ? T[number] : T>
  }

  then<TResult1 = { data: T; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: T; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }

  private async execute(): Promise<{ data: T; error: any }> {
    try {
      const isSelect = this.operation === "select"
      const url = `/api/data?table=${encodeURIComponent(this.table)}&select=${encodeURIComponent(this.columns)}&filters=${encodeURIComponent(JSON.stringify(this.filters))}&orders=${encodeURIComponent(JSON.stringify(this.orders))}&single=${this.wantsSingle}`
      const response = await fetch(isSelect ? url : "/api/data", {
        method: isSelect ? "GET" : "POST",
        headers: isSelect ? undefined : { "content-type": "application/json" },
        body: isSelect ? undefined : JSON.stringify({
          table: this.table,
          operation: this.operation,
          payload: this.payload,
          filters: this.filters,
        }),
        cache: "no-store",
      })
      return await response.json()
    } catch (error: any) {
      return { data: null as T, error: { message: error?.message || "Erro de conexão" } }
    }
  }
}

function apiError(message: string) {
  return { data: null, error: { message } }
}

export function createClient() {
  return {
    from: <K extends keyof TableRows>(table: K) => new QueryBuilder<TableRows[K]>(table),
    auth: {
      async signInWithPassword(credentials: { email: string; password: string }) {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(credentials),
        })
        const result = await response.json()
        return response.ok ? { data: result, error: null } : { data: null, error: result }
      },
      async signOut() {
        const response = await fetch("/api/auth/logout", { method: "POST" })
        return response.ok ? { error: null } : apiError("Não foi possível sair")
      },
    },
    storage: {
      from(bucket: string) {
        return {
          async upload(path: string, file: File) {
            const form = new FormData()
            form.append("file", file)
            form.append("path", path)
            form.append("bucket", bucket)
            const response = await fetch("/api/upload", { method: "POST", body: form })
            const result = await response.json()
            return response.ok ? { data: result, error: null } : { data: null, error: result }
          },
          getPublicUrl(path: string) {
            const fileId = path.split(/[/\\]/).pop() || path
            return { data: { publicUrl: `/api/files/${encodeURIComponent(fileId)}` } }
          },
        }
      },
    },
    channel(_name?: string) {
      const channel = {
        on(_event: string, _filter: unknown, _callback: (payload: ChannelPayload) => void) {
          return channel
        },
        subscribe(callback?: (status: string) => void) {
          callback?.("SUBSCRIBED")
          return channel
        },
      }
      return channel
    },
    removeChannel(_channel: unknown) {
      // The app refreshes data on demand instead of requiring a realtime service.
    },
  }
}