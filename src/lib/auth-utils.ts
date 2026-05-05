/**
 * Utilitários de autenticação compartilhados.
 */

/**
 * Valida a força da senha.
 * Retorna uma mensagem de erro ou null se a senha for válida.
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
  if (!/[a-z]/.test(password)) return 'A senha deve conter pelo menos uma letra minúscula.';
  if (!/[A-Z]/.test(password)) return 'A senha deve conter pelo menos uma letra maiúscula.';
  if (!/[0-9]/.test(password)) return 'A senha deve conter pelo menos um número.';
  return null;
}
