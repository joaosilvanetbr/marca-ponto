-- ============================================
-- Otimização de Backend - Fase 2
-- ============================================

-- 1. Correção de Esquema: Adicionar coluna dias_trabalho se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'dias_trabalho') THEN
        ALTER TABLE public.profiles ADD COLUMN dias_trabalho INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}';
    END IF;
END $$;

-- 2. Índice de Cobertura para Performance de Histórico
-- Acelera buscas por intervalo de data incluindo os campos de tempo para evitar 'heap fetch'
CREATE INDEX IF NOT EXISTS idx_registros_performance 
ON public.registros (user_id, data) 
INCLUDE (entrada, intervalo, retorno, saida);

-- 3. RPC: calcular_saldo_mes
-- Calcula o saldo de horas de um mês diretamente no Postgres
CREATE OR REPLACE FUNCTION public.calcular_saldo_mes(p_user_id UUID, p_mes DATE)
RETURNS TABLE (
    total_trabalhado_minutos INTEGER,
    total_esperado_minutos INTEGER,
    saldo_minutos INTEGER,
    dias_trabalhados INTEGER
) AS $$
DECLARE
    v_jornada_minutos INTEGER;
    v_inicio_mes DATE := date_trunc('month', p_mes)::DATE;
    v_fim_mes DATE := (date_trunc('month', p_mes) + interval '1 month - 1 day')::DATE;
BEGIN
    -- Busca jornada diária do perfil (ex: '08:00' -> 480 minutos)
    SELECT 
        (split_part(jornada, ':', 1)::INTEGER * 60) + split_part(jornada, ':', 2)::INTEGER
    INTO v_jornada_minutos
    FROM public.profiles
    WHERE id = p_user_id;

    RETURN QUERY
    WITH registros_do_mes AS (
        SELECT 
            data,
            -- Cálculo de minutos trabalhados (Manhã + Tarde)
            COALESCE(EXTRACT(EPOCH FROM (intervalo - entrada))/60, 0)::INTEGER +
            COALESCE(EXTRACT(EPOCH FROM (saida - retorno))/60, 0)::INTEGER as minutos
        FROM public.registros
        WHERE user_id = p_user_id 
          AND data >= v_inicio_mes 
          AND data <= v_fim_mes
    ),
    dias_do_mes AS (
        -- Gera todos os dias do mês para calcular o esperado
        SELECT generate_series(v_inicio_mes, v_fim_mes, '1 day'::interval)::DATE as dia
    ),
    calendario_eventos AS (
        SELECT data, tipo FROM public.calendario WHERE user_id = p_user_id AND data >= v_inicio_mes AND data <= v_fim_mes
    )
    SELECT 
        COALESCE(SUM(r.minutos), 0)::INTEGER as total_trabalhado_minutos,
        (
            SELECT COUNT(*)::INTEGER * v_jornada_minutos
            FROM dias_do_mes d
            LEFT JOIN calendario_eventos c ON d.dia = c.data
            WHERE c.tipo IS NULL -- Não espera horas em feriados/folgas marcadas no calendário
              AND EXTRACT(DOW FROM d.dia) IN (SELECT unnest(dias_trabalho) FROM public.profiles WHERE id = p_user_id)
        ) as total_esperado_minutos,
        0 as saldo_minutos, -- Calculado no final
        COUNT(r.data)::INTEGER as dias_trabalhados
    FROM registros_do_mes r;

    -- O saldo_minutos final é preenchido na query acima (precisamos ajustar o retorno do saldo)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajuste na função para retornar o saldo calculado corretamente
CREATE OR REPLACE FUNCTION public.calcular_saldo_mes(p_user_id UUID, p_mes DATE)
RETURNS TABLE (
    total_trabalhado_minutos INTEGER,
    total_esperado_minutos INTEGER,
    saldo_minutos INTEGER,
    dias_trabalhados INTEGER
) AS $$
DECLARE
    v_jornada_minutos INTEGER;
    v_inicio_mes DATE := date_trunc('month', p_mes)::DATE;
    v_fim_mes DATE := (date_trunc('month', p_mes) + interval '1 month - 1 day')::DATE;
    v_dias_trabalho INTEGER[];
BEGIN
    SELECT 
        (split_part(jornada, ':', 1)::INTEGER * 60) + split_part(jornada, ':', 2)::INTEGER,
        dias_trabalho
    INTO v_jornada_minutos, v_dias_trabalho
    FROM public.profiles
    WHERE id = p_user_id;

    RETURN QUERY
    WITH registros_do_mes AS (
        SELECT 
            data,
            (COALESCE(EXTRACT(EPOCH FROM (intervalo - entrada))/60, 0)::INTEGER +
             COALESCE(EXTRACT(EPOCH FROM (saida - retorno))/60, 0)::INTEGER) as minutos
        FROM public.registros
        WHERE user_id = p_user_id 
          AND data >= v_inicio_mes 
          AND data <= v_fim_mes
    ),
    dias_esperados AS (
        SELECT dia
        FROM generate_series(v_inicio_mes, v_fim_mes, '1 day'::interval) dia
        WHERE EXTRACT(DOW FROM dia) = ANY(v_dias_trabalho)
          AND NOT EXISTS (
              SELECT 1 FROM public.calendario c 
              WHERE c.user_id = p_user_id 
                AND c.data = dia::DATE
          )
    ),
    resumo AS (
        SELECT 
            COALESCE(SUM(r.minutos), 0)::INTEGER as trabalhado,
            (SELECT COUNT(*)::INTEGER FROM dias_esperados) * v_jornada_minutos as esperado,
            COALESCE(COUNT(r.data), 0)::INTEGER as dias
        FROM registros_do_mes r
    )
    SELECT 
        trabalhado,
        esperado,
        (trabalhado - esperado) as saldo,
        dias
    FROM resumo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
