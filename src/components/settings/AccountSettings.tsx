import { User, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface AccountSettingsProps {
  nome: string;
  userEmail: string;
  novoEmail: string;
  novaSenha: string;
  confirmarSenha: string;
  secaoConta: 'perfil' | 'email' | 'senha' | null;
  status: string | null;
  setNome: (v: string) => void;
  setNovoEmail: (v: string) => void;
  setNovaSenha: (v: string) => void;
  setConfirmarSenha: (v: string) => void;
  setSecaoConta: (v: 'perfil' | 'email' | 'senha' | null) => void;
  onSalvarNome: () => Promise<void>;
  onSalvarEmail: () => Promise<void>;
  onSalvarSenha: () => Promise<void>;
}

export function AccountSettings({
  nome,
  userEmail,
  novoEmail,
  novaSenha,
  confirmarSenha,
  secaoConta,
  status,
  setNome,
  setNovoEmail,
  setNovaSenha,
  setConfirmarSenha,
  setSecaoConta,
  onSalvarNome,
  onSalvarEmail,
  onSalvarSenha
}: AccountSettingsProps) {
  const nomeExibido = nome || userEmail.split('@')[0];

  return (
    <div className="space-y-4">
      {/* Perfil Summary */}
      <div className="ios-card rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
            <span className="text-xl font-bold text-white">{nomeExibido.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-white">{nomeExibido}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{userEmail}</div>
          </div>
        </div>
      </div>

      {/* Seção Conta */}
      <div className="ios-card rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <User className="w-3 h-3" /> Minha Conta
        </h3>

        {secaoConta === null && (
          <div className="space-y-2">
            <button onClick={() => setSecaoConta('perfil')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 dark:bg-secondary/20 hover:bg-secondary dark:hover:bg-secondary/40 transition-colors text-left border border-border/50">
              <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
                <User className="w-5 h-5 text-info" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">Nome</div>
                <div className="text-xs text-muted-foreground">{nome || 'Adicionar nome'}</div>
              </div>
            </button>

            <button onClick={() => setSecaoConta('email')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 dark:bg-secondary/20 hover:bg-secondary dark:hover:bg-secondary/40 transition-colors text-left border border-border/50">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">Email</div>
                <div className="text-xs text-muted-foreground">{userEmail}</div>
              </div>
            </button>

            <button onClick={() => setSecaoConta('senha')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 dark:bg-secondary/20 hover:bg-secondary dark:hover:bg-secondary/40 transition-colors text-left border border-border/50">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                <Lock className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">Senha</div>
                <div className="text-xs text-muted-foreground">••••••••</div>
              </div>
            </button>
          </div>
        )}

        {secaoConta === 'perfil' && (
          <div className="space-y-4">
            <button onClick={() => setSecaoConta(null)} className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </button>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Nome exibido</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white placeholder:text-slate-400"
              />
            </div>
            <motion.button whileTap={{ scale: 0.96 }} onClick={onSalvarNome} disabled={status === 'saving'} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold shadow-lg flex items-center justify-center gap-2 disabled:opacity-60">
              {status === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar nome'}
            </motion.button>
          </div>
        )}

        {secaoConta === 'email' && (
          <div className="space-y-4">
            <button onClick={() => setSecaoConta(null)} className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </button>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Novo email</label>
              <input
                type="email"
                value={novoEmail}
                onChange={(e) => setNovoEmail(e.target.value)}
                placeholder="novo@email.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white placeholder:text-slate-400"
              />
              <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">Um email de confirmacao sera enviado para o novo endereco.</div>
            </div>
            <motion.button whileTap={{ scale: 0.96 }} onClick={onSalvarEmail} disabled={status === 'saving'} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold shadow-lg flex items-center justify-center gap-2 disabled:opacity-60">
              {status === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atualizar email'}
            </motion.button>
          </div>
        )}

        {secaoConta === 'senha' && (
          <div className="space-y-4">
            <button onClick={() => setSecaoConta(null)} className="text-sm text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar
            </button>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Nova senha</label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Minimo 6 caracteres"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Confirmar senha</label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a senha"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-800 dark:text-white placeholder:text-slate-400"
              />
            </div>
            <motion.button whileTap={{ scale: 0.96 }} onClick={onSalvarSenha} disabled={status === 'saving'} className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold shadow-lg flex items-center justify-center gap-2 disabled:opacity-60">
              {status === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atualizar senha'}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
