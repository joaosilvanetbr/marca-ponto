import { useState, useEffect } from 'react';

export type AppTheme = 'ocean' | 'amethyst' | 'forest' | 'sunset';

export function useAppTheme() {
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('pontogo-theme') as AppTheme) || 'ocean';
  });

  useEffect(() => {
    localStorage.setItem('pontogo-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return { theme, setTheme };
}
