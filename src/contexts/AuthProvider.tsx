import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [isRecovery, setIsRecovery] = useState(() => {
    const hash = window.location.hash;
    return !!(hash && (hash.includes('type=recovery') || hash.includes('access_token')));
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user.id);
        setUserEmail(data.session.user.email || '');
      }
      setCarregando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user.id);
        setUserEmail(session.user.email || '');
      } else {
        setUser(null);
        setUserEmail('');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const setIsRecoveryWrapped = useCallback((v: boolean) => {
    setIsRecovery(v);
    if (!v) window.location.hash = '';
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userEmail,
        carregando,
        isRecovery,
        setIsRecovery: setIsRecoveryWrapped,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
