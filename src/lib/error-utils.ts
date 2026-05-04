/**
 * Utilitários de erro e logging seguro.
 * Evita expor detalhes sensíveis em mensagens de erro para o usuário.
 */

export function sanitizeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    // Mensagens conhecidas do Supabase que são seguras para o usuário
    const safeMessages = [
      'Invalid login credentials',
      'Email not confirmed',
      'User already registered',
      'Password should be at least',
      'Unable to validate email address',
      'Signup requires a valid password',
      'Rate limit exceeded',
    ];
    const msg = err.message;
    for (const safe of safeMessages) {
      if (msg.includes(safe)) return msg;
    }
    // Mensagens genéricas para erros desconhecidos
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    }
    if (msg.includes('timeout')) {
      return 'A operação demorou muito. Tente novamente.';
    }
    return 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
  }
  return 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
}

export function logError(context: string, err: unknown): void {
  // Em producao, isso poderia enviar para um servico de logging (Sentry, etc.)
  // Por enquanto, loga no console com contexto
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${context}]`, err);
  }
}

export function assertNonNull<T>(value: T | null | undefined, message: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}
