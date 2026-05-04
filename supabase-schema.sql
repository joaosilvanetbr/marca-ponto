sql
-- ============================================
-- PontoGO — Schema Supabase (idempotente)
-- Pode rodar múltiplas vezes sem erro
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABELA: profiles
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    jornada TEXT NOT NULL DEFAULT '08:00',
    tolerancia INTEGER NOT NULL DEFAULT 10,
    saldo_inicial INTEGER NOT NULL DEFAULT 0,
    dark_mode BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. TABELA: registros
-- ============================================
CREATE TABLE IF NOT EXISTS public.registros (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    entrada TIME,
    intervalo TIME,
    retorno TIME,
    saida TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, data)
);

CREATE INDEX IF NOT EXISTS idx_registros_user_data ON public.registros(user_id, data);

-- ============================================
-- 3. TABELA: calendario
-- ============================================
CREATE TABLE IF NOT EXISTS public.calendario (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('feriado', 'folga', 'licenca', 'atestado')),
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, data)
);

CREATE INDEX IF NOT EXISTS idx_calendario_user_data ON public.calendario(user_id, data);

-- ============================================
-- 4. FUNÇÕES E TRIGGERS (idempotentes)
-- ============================================

-- Função: atualiza updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: profiles_updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: registros_updated_at
DROP TRIGGER IF EXISTS registros_updated_at ON public.registros;
CREATE TRIGGER registros_updated_at
    BEFORE UPDATE ON public.registros
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Função: cria profile no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, jornada, tolerancia, saldo_inicial, dark_mode)
    VALUES (NEW.id, '08:00', 10, 0, false)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: cria profile automaticamente (idempotente)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendario ENABLE ROW LEVEL SECURITY;

-- profiles
DO $$ BEGIN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- registros
DO $$ BEGIN
    CREATE POLICY "Users can view own registros" ON public.registros FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own registros" ON public.registros FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own registros" ON public.registros FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete own registros" ON public.registros FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- calendario
DO $$ BEGIN
    CREATE POLICY "Users can view own calendario" ON public.calendario FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own calendario" ON public.calendario FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own calendario" ON public.calendario FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete own calendario" ON public.calendario FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 6. TABELA: audit_log (rastreamento de alteracoes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tabela TEXT NOT NULL,
    registro_id TEXT,
    acao TEXT NOT NULL CHECK (acao IN ('INSERT', 'UPDATE', 'DELETE')),
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_registro ON public.audit_log(tabela, registro_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own audit logs" ON public.audit_log FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Funcao: registra alteracoes na tabela registros
-- Usa COALESCE(auth.uid(), NEW/OLD.user_id) para funcionar tambem via API/service_role
CREATE OR REPLACE FUNCTION public.handle_audit_registros()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_log (user_id, tabela, registro_id, acao, dados_novos)
        VALUES (COALESCE(auth.uid(), NEW.user_id), 'registros', NEW.id::TEXT, 'INSERT', row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_log (user_id, tabela, registro_id, acao, dados_anteriores, dados_novos)
        VALUES (COALESCE(auth.uid(), NEW.user_id), 'registros', NEW.id::TEXT, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_log (user_id, tabela, registro_id, acao, dados_anteriores)
        VALUES (COALESCE(auth.uid(), OLD.user_id), 'registros', OLD.id::TEXT, 'DELETE', row_to_json(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: audit_registros
DROP TRIGGER IF EXISTS audit_registros ON public.registros;
CREATE TRIGGER audit_registros
    AFTER INSERT OR UPDATE OR DELETE ON public.registros
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_audit_registros();

-- ============================================
-- 7. REGRAS DE AUTH (redirecionamento)
-- ============================================

-- Configura o site URL para o domínio correto
-- Substitua pelo seu domínio real:
-- UPDATE auth.config SET site_url = 'https://pontoteste.js.net.br';

-- ============================================
-- 8. NOTAS DE MIGRACAO
-- ============================================

-- RECOMENDACAO: Migrar IDs de registros e calendario de SERIAL para UUID
-- para mitigar ataques de IDOR (Insecure Direct Object Reference).
-- 
-- Passos para migracao (requer backup):
-- 1. ALTER TABLE public.registros ALTER COLUMN id TYPE UUID USING uuid_generate_v4();
-- 2. ALTER TABLE public.calendario ALTER COLUMN id TYPE UUID USING uuid_generate_v4();
-- 3. Atualizar tipos TypeScript: Registro.id e DiaCalendario.id para string

-- ============================================
-- FIM
-- ============================================
