import { useState, useEffect } from 'react';

/**
 * Hook para gerenciar o tema visual único (Aurora).
 * Mantido por compatibilidade de interface, mas simplificado para uma identidade única.
 */
export function useAppTheme() {
  const [theme, setTheme] = useState<'aurora'>(() => {
    return 'aurora';
  });

  useEffect(() => {
    localStorage.setItem('pontogo-theme', 'aurora');
    document.documentElement.setAttribute('data-theme', 'aurora');
  }, []);

  return { theme, setTheme };
}
