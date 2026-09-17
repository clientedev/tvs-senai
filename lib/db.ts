import { Pool, type PoolConfig, type QueryResultRow } from "pg"

declare global {
  // eslint-disable-next-line no-var
  var postgresPool: Pool | undefined
}

function connectionString() {
  return process.env.DATABASE_URL || process.env.DATABASE_PRIVATE_URL || process.env.POSTGRES_URL || ""
}

function poolConfig(): PoolConfig {
  const url = connectionString()
  const local = /localhost|127\.0\.0\.1/.test(url)
  const sslDisabled = process.env.PGSSLMODE === "disable" || local
  const config: PoolConfig = {
    max: Number(process.env.PGPOOL_MAX || 5),
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 30_000,
  }

  if (url) {
    config.connectionString = url
    config.ssl = sslDisabled ? false : { rejectUnauthorized: false }
    return config
  }

  if (process.env.PGHOST) {
    config.host = process.env.PGHOST
    config.port = Number(process.env.PGPORT || 5432)
    config.user = process.env.PGUSER
    config.password = process.env.PGPASSWORD
    config.database = process.env.PGDATABASE || process.env.POSTGRES_DB
    config.ssl = sslDisabled ? false : { rejectUnauthorized: false }
    return config
  }

  // Fallback seguro para a fase de build estático (ex: Vercel)
  config.connectionString = "postgres://postgres:postgres@127.0.0.1:5432/postgres"
  config.ssl = false
  return config
}

export function getPool() {
  if (!global.postgresPool) {
    global.postgresPool = new Pool(poolConfig())
    global.postgresPool.on("error", (error) => {
      console.error("PostgreSQL pool error:", error)
    })
  }
  return global.postgresPool
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  return getPool().query<T>(text, values)
}
