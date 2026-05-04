import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, KeyRound, ArrowLeft } from 'lucide-react';

interface ResetPasswordProps {
  onVoltar: () => void;
}

export default function ResetPassword({ onVoltar }: ResetPasswordProps) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [verificando, setVerificando] = useState(true);

  // Verifica se tem token de recuperação na URL
  useEffect(() => {
    // O Supabase envia o token no hash da URL: #access_token=xxx&refresh_token=yyy&type=recovery
    const hash = window.location.hash;
    if (hash && (hash.includes('type=recovery') || hash.includes('access_token'))) {
      // Troca o token de recuperação por uma sessão temporária
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setVerificando(false);
        } else {
          // Tenta processar o hash manualmente
          supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
              setVerificando(false);
            }
          });
          // Fallback: tenta setar a sessão do hash
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken) {
            supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            }).then(() => {
              setVerificando(false);
            });
          } else {
            setVerificando(false);
            setErro('Link de recuperação inválido ou expirado.');
          }
        }
      });
    } else {
      setVerificando(false);
      setErro('Link de recuperação não encontrado.');
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }
    if (novaSenha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setCarregando(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;
      setSucesso('Senha redefinida com sucesso! Você já pode fazer login.');
      setNovaSenha('');
      setConfirmarSenha('');
      // Limpa o hash da URL
      window.history.replaceState(null, '', window.location.pathname);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao redefinir senha';
      setErro(msg);
    } finally {
      setCarregando(false);
    }
  }

  if (verificando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7] dark:bg-black">
        <div className="w-10 h-10 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="min-h-screen flex items-center justify-center p-4">
      <motion.div whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 300 }} className="w-full max-w-sm ios-card rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Nova senha</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Digite sua nova senha abaixo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Nova senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white placeholder:text-slate-400"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Confirmar senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white placeholder:text-slate-400"
              placeholder="••••••••"
            />
          </div>

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
            {carregando ? <Loader2 className="w-5 h-5 animate-spin" /> : <><KeyRound className="w-5 h-5" /> Redefinir senha</>}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onVoltar}
            className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline flex items-center justify-center gap-1 mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o login
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
