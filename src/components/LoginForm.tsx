import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, Loader2, KeyRound, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import { validatePasswordStrength } from '@/lib/auth-utils';

interface LoginFormProps {
  onLogin: () => void;
}

const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minuto

function isRateLimited(attempts: number[], now: number): boolean {
  const recent = attempts.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  return recent.length >= MAX_ATTEMPTS;
}



export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modo, setModo] = useState<'login' | 'cadastro' | 'recuperar'>('login');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Rate limiting por modo
  const loginAttempts = useRef<number[]>([]);
  const signupAttempts = useRef<number[]>([]);
  const recoverAttempts = useRef<number[]>([]);

  function getAttemptsForMode(m: typeof modo): React.MutableRefObject<number[]> {
    if (m === 'login') return loginAttempts;
    if (m === 'cadastro') return signupAttempts;
    return recoverAttempts;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setCarregando(true);

    const now = Date.now();
    const attempts = getAttemptsForMode(modo);
    attempts.current = attempts.current.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

    if (isRateLimited(attempts.current, now)) {
      setErro('Muitas tentativas. Aguarde 1 minuto antes de tentar novamente.');
      setCarregando(false);
      return;
    }

    attempts.current.push(now);

    try {
      if (modo === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin();
      } else if (modo === 'cadastro') {
        const pwdError = validatePasswordStrength(password);
        if (pwdError) {
          setErro(pwdError);
          setCarregando(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        // Verifica se o email precisa de confirmacao
        const needsEmailConfirmation = data.user?.identities?.length === 0 || !data.session;
        if (needsEmailConfirmation) {
          setSucesso('Conta criada! Verifique seu email para confirmar o cadastro antes de fazer login.');
          setPassword('');
        } else {
          onLogin();
        }
      } else if (modo === 'recuperar') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/',
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

  const titulo = modo === 'login' ? 'Bem-Vindo ao PontoGO' : modo === 'cadastro' ? 'Criar conta' : 'Recuperar senha';
  const subtitulo = modo === 'login' ? 'Entre para registrar seu ponto' : modo === 'cadastro' ? 'Cadastre-se para começar' : 'Informe seu email para redefinir a senha';
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="min-h-screen flex items-center justify-center p-4">
      <motion.div whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 300 }} className="w-full max-w-sm ios-card rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
            <img src="./icon-192.png" alt="PontoGO" className="w-24 h-24 rounded-[2rem] mx-auto relative z-10 shadow-2xl" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{titulo}</h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">{subtitulo}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl bg-secondary/50 dark:bg-secondary/20 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground/50 transition-all"
              placeholder="seu@email.com"
            />
          </div>

          {modo !== 'recuperar' && (
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 rounded-2xl bg-secondary/50 dark:bg-secondary/20 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground/50 transition-all"
                placeholder="••••••••"
              />
              {modo === 'cadastro' && (
                <div className="mt-3 p-3 rounded-xl bg-secondary/30 border border-border/30 space-y-1">
                  <p className={`text-[10px] font-bold flex items-center gap-1.5 ${password.length >= 8 ? 'text-success' : 'text-muted-foreground/60'}`}>
                    <span className={`w-1 h-1 rounded-full ${password.length >= 8 ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                    MÍNIMO 8 CARACTERES
                  </p>
                  <p className={`text-[10px] font-bold flex items-center gap-1.5 ${/[a-z]/.test(password) ? 'text-success' : 'text-muted-foreground/60'}`}>
                    <span className={`w-1 h-1 rounded-full ${/[a-z]/.test(password) ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                    UMA LETRA MINÚSCULA
                  </p>
                  <p className={`text-[10px] font-bold flex items-center gap-1.5 ${/[A-Z]/.test(password) ? 'text-success' : 'text-muted-foreground/60'}`}>
                    <span className={`w-1 h-1 rounded-full ${/[A-Z]/.test(password) ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                    UMA LETRA MAIÚSCULA
                  </p>
                  <p className={`text-[10px] font-bold flex items-center gap-1.5 ${/[0-9]/.test(password) ? 'text-success' : 'text-muted-foreground/60'}`}>
                    <span className={`w-1 h-1 rounded-full ${/[0-9]/.test(password) ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                    PELO MENOS UM NÚMERO
                  </p>
                </div>
              )}
            </div>
          )}

          {erro && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-xs font-bold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              {erro}
            </motion.div>
          )}

          {sucesso && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2.5 text-xs font-bold text-success bg-success/10 border border-success/20 rounded-xl p-4">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {sucesso}
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={carregando}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary-start to-primary-end text-white font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60"
          >
            {carregando ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : modo === 'login' ? (
              <><LogIn className="w-5 h-5" /> ENTRAR</>
            ) : modo === 'cadastro' ? (
              <><UserPlus className="w-5 h-5" /> CADASTRAR</>
            ) : (
              <><KeyRound className="w-5 h-5" /> ENVIAR EMAIL</>
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center space-y-3">
          {modo === 'recuperar' ? (
            <button
              onClick={() => mudarModo('login')}
              className="text-xs font-bold text-primary hover:underline flex items-center justify-center gap-1.5 mx-auto uppercase tracking-widest"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> VOLTAR PARA O LOGIN
            </button>
          ) : (
            <>
              <button
                onClick={() => mudarModo(modo === 'login' ? 'cadastro' : 'login')}
                className="text-xs font-bold text-primary hover:underline block mx-auto uppercase tracking-widest"
              >
                {modo === 'login' ? 'NÃO TEM CONTA? CADASTRE-SE' : 'JÁ TEM CONTA? ENTRE'}
              </button>
              {modo === 'login' && (
                <button
                  onClick={() => mudarModo('recuperar')}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors block mx-auto uppercase tracking-widest"
                >
                  ESQUECEU A SENHA?
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
