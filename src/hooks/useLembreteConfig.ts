import { useState, useCallback } from 'react';

export interface LembreteConfig {
  entrada: boolean;
  intervalo: boolean;
  retorno: boolean;
  saida: boolean;
}

const DEFAULT: LembreteConfig = {
  entrada: true,
  intervalo: true,
  retorno: true,
  saida: true,
};

const KEY = 'pontogo-lembretes';

function loadConfig(): LembreteConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return DEFAULT;
}

export function useLembreteConfig() {
  const [config, setConfig] = useState<LembreteConfig>(loadConfig);

  const save = useCallback((updates: Partial<LembreteConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { config, save };
}
