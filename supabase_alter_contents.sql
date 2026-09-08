-- Adicionar colunas para agendamento e ordenação na tabela media_contents

ALTER TABLE media_contents 
ADD COLUMN IF NOT EXISTS scheduled_start timestamptz,
ADD COLUMN IF NOT EXISTS scheduled_end timestamptz,
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Atualizar display_order para itens existentes para evitar nulos ou ordem bagunçada
UPDATE media_contents 
SET display_order = EXTRACT(EPOCH FROM created_at)::integer 
WHERE display_order IS NULL OR display_order = 0;
