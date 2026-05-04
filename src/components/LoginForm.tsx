import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, Loader2, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface LoginFormProps {
  onLogin: () => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modo, setModo] = useState<'login' | 'cadastro' | 'recuperar'>('login');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setCarregando(true);

    try {
      if (modo === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin();
      } else if (modo === 'cadastro') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        onLogin();
      } else if (modo === 'recuperar') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'https://2yx7ec5msx23q.kimi.page/',
        });
        if (error) throw error;
        setSucesso('Email de recuperação enviado! Verifique sua caixa de entrada.');
        setEmail('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setErro(msg);
    } finally {
      setCarregando(false);
    }
  }

  function mudarModo(novo: 'login' | 'cadastro' | 'recuperar') {
    setModo(novo);
    setErro('');
    setSucesso('');
  }

  const titulo = modo === 'login' ? 'Bem-vindo' : modo === 'cadastro' ? 'Criar conta' : 'Recuperar senha';
  const subtitulo = modo === 'login' ? 'Entre para registrar seu ponto' : modo === 'cadastro' ? 'Cadastre-se para começar' : 'Informe seu email para redefinir a senha';
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="min-h-screen flex items-center justify-center p-4">
      <motion.div whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 300 }} className="w-full max-w-sm ios-card rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            {modo === 'recuperar' ? <KeyRound className="w-8 h-8 text-white" /> : <LogIn className="w-8 h-8 text-white" />}
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{titulo}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitulo}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white placeholder:text-slate-400"
              placeholder="seu@email.com"
            />
          </div>

          {modo !== 'recuperar' && (
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white placeholder:text-slate-400"
                placeholder="••••••••"
              />
            </div>
          )}

          {erro && (
            <div className="text-sm text-red-500 bg-red-100 dark:bg-red-950 rounded-lg p-3">
              {erro}
            </div>
          )}

          {sucesso && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {sucesso}
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.96 }}
            type="submit"
            disabled={carregando}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {carregando ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : modo === 'login' ? (
              <><LogIn className="w-5 h-5" /> Entrar</>
            ) : modo === 'cadastro' ? (
              <><UserPlus className="w-5 h-5" /> Cadastrar</>
            ) : (
              <><KeyRound className="w-5 h-5" /> Enviar email de recuperação</>
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {modo === 'recuperar' ? (
            <button
              onClick={() => mudarModo('login')}
              className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o login
            </button>
          ) : (
            <>
              <button
                onClick={() => mudarModo(modo === 'login' ? 'cadastro' : 'login')}
                className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline block mx-auto"
              >
                {modo === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
              </button>
              {modo === 'login' && (
                <button
                  onClick={() => mudarModo('recuperar')}
                  className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors block mx-auto"
                >
                  Esqueceu a senha?
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
