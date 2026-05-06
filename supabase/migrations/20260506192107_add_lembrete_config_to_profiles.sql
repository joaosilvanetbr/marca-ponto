-- Adiciona coluna para salvar preferências de lembrete no banco
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS lembrete_config JSONB NOT NULL DEFAULT '{"entrada": true, "intervalo": true, "retorno": true, "saida": true}';

COMMENT ON COLUMN public.profiles.lembrete_config IS 'Configurações de lembrete do usuário (quais pontos ele quer ser avisado).';
