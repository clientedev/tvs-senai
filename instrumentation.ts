export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  if (process.env.NEXT_PHASE === "phase-production-build") return
  if (!process.env.DATABASE_URL && !process.env.PGHOST && !process.env.DATABASE_PRIVATE_URL) {
    console.warn("Skipping schema bootstrap: DATABASE_URL is not set")
    return
  }

  const { ensureSchema } = await import("./lib/migrate")
  await ensureSchema()
  console.log("PostgreSQL schema is ready")
}
