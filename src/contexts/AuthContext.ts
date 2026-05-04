import { createContext } from 'react';

export interface AuthState {
  user: string | null;
  userEmail: string;
  carregando: boolean;
  isRecovery: boolean;
  setIsRecovery: (v: boolean) => void;
}

export const AuthContext = createContext<AuthState | null>(null);
