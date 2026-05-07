-- ============================================
-- Saldo Acumulado (Total Geral)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_saldo_geral(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_saldo_inicial INTEGER;
    v_jornada_minutos INTEGER;
    v_dias_trabalho INTEGER[];
    v_total_trabalhado INTEGER;
    v_total_esperado INTEGER;
    v_primeiro_ponto DATE;
BEGIN
    -- 1. Busca configs do perfil
    SELECT 
        COALESCE(saldo_inicial, 0),
        (split_part(jornada, ':', 1)::INTEGER * 60) + split_part(jornada, ':', 2)::INTEGER,
        dias_trabalho
    INTO v_saldo_inicial, v_jornada_minutos, v_dias_trabalho
    FROM public.profiles
    WHERE id = p_user_id;

    -- 2. Busca data do primeiro registro para começar a contar o esperado
    SELECT MIN(data) INTO v_primeiro_ponto
    FROM public.registros
    WHERE user_id = p_user_id;

    IF v_primeiro_ponto IS NULL THEN
        RETURN v_saldo_inicial;
    END IF;

    -- 3. Soma minutos trabalhados de todo o histórico
    -- Nota: Usando a mesma lógica de calcular_saldo_mes para consistência
    SELECT 
        SUM(
            (COALESCE(EXTRACT(EPOCH FROM (intervalo - entrada))/60, 0)::INTEGER +
             COALESCE(EXTRACT(EPOCH FROM (saida - retorno))/60, 0)::INTEGER)
        )
    INTO v_total_trabalhado
    FROM public.registros
    WHERE user_id = p_user_id;

    -- 4. Calcula total esperado desde o primeiro ponto até hoje
    -- Não conta dias futuros, apenas até a data atual
    WITH dias_esperados AS (
        SELECT dia::DATE as dia
        FROM generate_series(v_primeiro_ponto, CURRENT_DATE, '1 day'::interval) dia
        WHERE EXTRACT(DOW FROM dia) = ANY(v_dias_trabalho)
          AND NOT EXISTS (
              SELECT 1 FROM public.calendario c 
              WHERE c.user_id = p_user_id 
                AND c.data = dia::DATE
          )
    )
    SELECT COUNT(*)::INTEGER * v_jornada_minutos INTO v_total_esperado
    FROM dias_esperados;

    RETURN v_saldo_inicial + (COALESCE(v_total_trabalhado, 0) - COALESCE(v_total_esperado, 0));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
