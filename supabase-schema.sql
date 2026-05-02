-- ============================================================
-- SCHEMA COMPLETO - Meu Ponto (atualizado)
-- Execute no Supabase SQL Editor (New Query)
-- ============================================================

-- --------------------------------------------------------
-- 1. Tabela de registros de ponto
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS registros (
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

CREATE INDEX IF NOT EXISTS idx_registros_user_data ON registros(user_id, data);
CREATE INDEX IF NOT EXISTS idx_registros_data ON registros(data);

-- --------------------------------------------------------
-- 2. Tabela de configurações do usuário (profiles)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  jornada TEXT DEFAULT '08:00',
  tolerancia INTEGER DEFAULT 10,
  saldo_inicial INTEGER DEFAULT 0,
  dark_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 3. Row Level Security (RLS)
-- --------------------------------------------------------
ALTER TABLE registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politicas para registros
CREATE POLICY "Users can only see their own records" ON registros
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own records" ON registros
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own records" ON registros
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own records" ON registros
  FOR DELETE USING (auth.uid() = user_id);

-- Politicas para profiles
CREATE POLICY "Users can only see their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can only insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can only update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- --------------------------------------------------------
-- 4. Trigger: cria profile automaticamente no cadastro
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------
-- 5. Funcao para atualizar updated_at automaticamente
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_registros_updated_at ON registros;
CREATE TRIGGER update_registros_updated_at
  BEFORE UPDATE ON registros
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
