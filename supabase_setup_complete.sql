-- SCRIPT COMPLETO DE CONFIGURAÇÃO DO BANCO DE DADOS (SUPABASE)
-- Execute este script no SQL Editor do seu projeto Supabase (https://supabase.com/dashboard/project/_/sql)

-- ==============================================================================
-- 1. CRIAÇÃO DAS TABELAS
-- ==============================================================================

-- Tabela: institution_settings (Configurações da Instituição)
CREATE TABLE IF NOT EXISTS institution_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  logo_url text,
  primary_color text,
  secondary_color text,
  updated_at timestamptz DEFAULT now()
);

-- Tabela: media_contents (Conteúdos de Mídia - Imagens, Vídeos e YouTube)
CREATE TABLE IF NOT EXISTS media_contents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('image', 'video', 'youtube', 'live')),
  title text NOT NULL,
  file_url text NOT NULL,
  duration_seconds integer DEFAULT 10,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabela: announcements (Avisos/Rodapé)
CREATE TABLE IF NOT EXISTS announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  priority integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabela: tv_devices (Dispositivos de TV)
CREATE TABLE IF NOT EXISTS tv_devices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  location text,
  token text NOT NULL UNIQUE, -- Token curto para URL (ex: "ABC123")
  last_seen timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabela: tv_content_assignments (Associação TV <-> Conteúdo, opcional para controle futuro)
CREATE TABLE IF NOT EXISTS tv_content_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tv_id uuid REFERENCES tv_devices(id) ON DELETE CASCADE,
  content_id uuid REFERENCES media_contents(id) ON DELETE CASCADE,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ==============================================================================
-- 2. HABILITAÇÃO DE SEGURANÇA (RLS)
-- ==============================================================================

ALTER TABLE institution_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_content_assignments ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. POLÍTICAS DE ACESSO (POLICIES)
-- ==============================================================================

-- --- POLÍTICAS PÚBLICAS (Para as TVs e Visualização Geral) ---

-- Permitir leitura pública de configurações da instituição
CREATE POLICY "Public read institution_settings" ON institution_settings FOR SELECT USING (true);

-- Permitir leitura pública de conteúdos ativos
CREATE POLICY "Public read active media_contents" ON media_contents FOR SELECT USING (is_active = true);

-- Permitir leitura pública de avisos ativos
CREATE POLICY "Public read active announcements" ON announcements FOR SELECT USING (is_active = true);

-- Permitir leitura pública de TVs (necessário para validar o token na URL)
CREATE POLICY "Public read tv_devices" ON tv_devices FOR SELECT USING (true);

-- Permitir que TVs atualizem seu próprio status 'last_seen'
CREATE POLICY "Public update tv_devices" ON tv_devices FOR UPDATE USING (true) WITH CHECK (true);


-- --- POLÍTICAS DE ADMINISTRAÇÃO (Para Usuários Logados) ---
-- 'authenticated' significa qualquer usuário que fez login no painel administrativo

-- Acesso total a configurações da instituição
CREATE POLICY "Admin all institution_settings" ON institution_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Acesso total a conteúdos
CREATE POLICY "Admin all media_contents" ON media_contents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Acesso total a avisos
CREATE POLICY "Admin all announcements" ON announcements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Acesso total a dispositivos de TV
CREATE POLICY "Admin all tv_devices" ON tv_devices FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Acesso total a associações de conteúdo
CREATE POLICY "Admin all tv_content_assignments" ON tv_content_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 4. BUCKETS DE ARMAZENAMENTO (STORAGE)
-- ==============================================================================
-- Buckets de Storage idealmente são criados via interface, mas insira estas linhas 
-- em "Storage" > "Policies" se necessário, para torná-los públicos.

-- Bucket 'corporate-media': Público para leitura
-- Bucket 'app-assets': Público para leitura

-- ==============================================================================
-- 5. DADOS INICIAIS (SEED)
-- ==============================================================================
INSERT INTO institution_settings (name) VALUES ('Minha Instituição SENAI') ON CONFLICT DO NOTHING;
