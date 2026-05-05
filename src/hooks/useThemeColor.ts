import { useEffect, useCallback } from 'react';

/**
 * Hook para atualizar dinamicamente a meta tag theme-color
 * baseado no tema claro/escuro.
 */
const THEME_COLORS = {
  light: '#F2F2F7',
  dark: '#000000',
};

export function useThemeColor(isDark: boolean) {
  const updateThemeColor = useCallback((dark: boolean) => {
    const metaTag = document.querySelector('meta[name="theme-color"]');
    if (metaTag) {
      metaTag.setAttribute('content', dark ? THEME_COLORS.dark : THEME_COLORS.light);
    }
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    updateThemeColor(isDark);
  }, [isDark, updateThemeColor]);

  return { updateThemeColor };
}
