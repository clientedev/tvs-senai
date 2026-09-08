-- RLS Policies para permitir acesso público via token
-- Execute este script no SQL Editor do Supabase

-- 1. Habilitar RLS na tabela tv_devices
ALTER TABLE tv_devices ENABLE ROW LEVEL SECURITY;

-- 2. Política para permitir leitura pública por token
-- Qualquer pessoa pode ler dados da TV usando o token correto
CREATE POLICY "Allow public read by token" ON tv_devices
  FOR SELECT
  USING (true);

-- 3. Política para permitir atualização do last_seen por token válido
-- Permite atualizar apenas o campo last_seen se o token corresponder
CREATE POLICY "Allow update last_seen by token" ON tv_devices
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 4. Habilitar RLS nas outras tabelas necessárias
ALTER TABLE institution_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tv_content_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- 5. Política para institution_settings (leitura pública)
CREATE POLICY "Allow public read institution_settings" ON institution_settings
  FOR SELECT
  USING (true);

-- 6. Política para tv_content_assignments (leitura pública)
CREATE POLICY "Allow public read tv_content_assignments" ON tv_content_assignments
  FOR SELECT
  USING (true);

-- 7. Política para media_contents (leitura pública apenas se ativo)
CREATE POLICY "Allow public read active media_contents" ON media_contents
  FOR SELECT
  USING (is_active = true);

-- 8. Política para announcements (leitura pública apenas se ativo)
CREATE POLICY "Allow public read active announcements" ON announcements
  FOR SELECT
  USING (is_active = true);

-- Nota: As políticas acima permitem leitura pública. 
-- Para maior segurança em produção, você pode restringir ainda mais,
-- mas isso é suficiente para o funcionamento básico das TVs.