import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancel = false;
    api
      .restoreSession()
      .then((account) => {
        if (!cancel) setUser(account);
      })
      .catch(() => {
        if (!cancel) setUser(null);
      })
      .finally(() => {
        if (!cancel) setReady(true);
      });
    const onLost = () => setUser(null);
    window.addEventListener('svcapital:auth-lost', onLost);
    return () => {
      cancel = true;
      window.removeEventListener('svcapital:auth-lost', onLost);
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      async login(email, password, remember) {
        const account = await api.login(email, password, remember);
        setUser(account);
        return account;
      },
      async register(input) {
        const account = await api.register(input);
        setUser(account);
        return account;
      },
      async logout() {
        await api.logout();
        setUser(null);
      },
      replaceUser(account) {
        setUser(account);
      },
    }),
    [user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
