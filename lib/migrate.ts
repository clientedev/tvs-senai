import { pbkdf2Sync, randomBytes } from "node:crypto"
import { query } from "@/lib/db"

const DEFAULT_ADMIN_EMAIL = "admin@sp.senai.br"
const DEFAULT_ADMIN_HASH =
  "716a534dd21fdfb86182c4c051c2d924:19c8130a9e078bef546ff96958033d07d75b7e56f5d4666b62f4a10397f140e7"

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const hash = pbkdf2Sync(password, salt, 120_000, 32, "sha256").toString("hex")
  return `${salt}:${hash}`
}

export async function ensureSchema() {
  await query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`)

  await query(`
    CREATE TABLE IF NOT EXISTS app_users (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      created_at timestamptz DEFAULT now()
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS institution_settings (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text NOT NULL,
      logo_url text,
      primary_color text,
      secondary_color text,
      updated_at timestamptz DEFAULT now()
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS media_contents (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      type text NOT NULL CHECK (type IN ('image', 'video', 'youtube', 'live')),
      title text NOT NULL,
      file_url text NOT NULL,
      duration_seconds integer DEFAULT 10,
      is_active boolean DEFAULT true,
      scheduled_start timestamptz,
      scheduled_end timestamptz,
      display_order integer DEFAULT 0,
      created_at timestamptz DEFAULT now()
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      content text NOT NULL,
      priority integer DEFAULT 1,
      is_active boolean DEFAULT true,
      created_at timestamptz DEFAULT now()
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS tv_devices (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text NOT NULL,
      location text,
      token text NOT NULL UNIQUE,
      last_seen timestamptz,
      is_active boolean DEFAULT true,
      overlay_layout jsonb,
      created_at timestamptz DEFAULT now()
    )
  `)

  await query(`
    ALTER TABLE tv_devices
    ADD COLUMN IF NOT EXISTS overlay_layout jsonb
  `)

  await query(`
    ALTER TABLE media_contents
    DROP CONSTRAINT IF EXISTS media_contents_type_check
  `)
  await query(`
    ALTER TABLE media_contents
    ADD CONSTRAINT media_contents_type_check
    CHECK (type IN ('image', 'video', 'youtube', 'live'))
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS tv_content_assignments (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      tv_id uuid REFERENCES tv_devices(id) ON DELETE CASCADE,
      content_id uuid REFERENCES media_contents(id) ON DELETE CASCADE,
      order_index integer DEFAULT 0,
      created_at timestamptz DEFAULT now()
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS uploaded_files (
      id text PRIMARY KEY,
      mime_type text NOT NULL,
      original_name text,
      data bytea NOT NULL,
      created_at timestamptz DEFAULT now()
    )
  `)

  // Large Object support: store OID reference for large files (avoids loading blob into RAM)
  await query(`ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS lo_oid oid`)
  await query(`ALTER TABLE uploaded_files ALTER COLUMN data DROP NOT NULL`)
  await query(`ALTER TABLE uploaded_files ALTER COLUMN data SET DEFAULT ''::bytea`)

  await query(`
    INSERT INTO institution_settings (name)
    SELECT 'Minha Instituição SENAI'
    WHERE NOT EXISTS (SELECT 1 FROM institution_settings)
  `)

  const adminEmail = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase()
  const adminPassword = process.env.ADMIN_PASSWORD
  const passwordHash = adminPassword ? hashPassword(adminPassword) : DEFAULT_ADMIN_HASH

  await query(
    `INSERT INTO app_users (email, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (email) DO NOTHING`,
    [adminEmail, passwordHash],
  )
}
