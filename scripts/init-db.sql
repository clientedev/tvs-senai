CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS institution_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  logo_url text,
  primary_color text,
  secondary_color text,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media_contents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('image', 'video', 'youtube')),
  title text NOT NULL,
  file_url text NOT NULL,
  duration_seconds integer DEFAULT 10,
  is_active boolean DEFAULT true,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  priority integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tv_devices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  location text,
  token text NOT NULL UNIQUE,
  last_seen timestamptz,
  is_active boolean DEFAULT true,
  overlay_layout jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tv_content_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tv_id uuid REFERENCES tv_devices(id) ON DELETE CASCADE,
  content_id uuid REFERENCES media_contents(id) ON DELETE CASCADE,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

INSERT INTO institution_settings (name)
VALUES ('Minha Instituição SENAI')
ON CONFLICT DO NOTHING;

INSERT INTO app_users (email, password_hash)
VALUES (
  'admin@sp.senai.br',
  '716a534dd21fdfb86182c4c051c2d924:19c8130a9e078bef546ff96958033d07d75b7e56f5d4666b62f4a10397f140e7'
)
ON CONFLICT (email) DO NOTHING;
