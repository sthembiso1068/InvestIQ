import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import * as api from '../services/api';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);
  const loadedFor = useRef(null);
  const refresh = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    if (!user) {
      setData(null);
      setLoading(false);
      loadedFor.current = null;
      return undefined;
    }
    let cancel = false;
    if (loadedFor.current !== user.id) setLoading(true);
    const request = user.role === 'admin' ? api.adminOverview() : api.getDashboard();
    request
      .then((next) => {
        if (cancel) return;
        loadedFor.current = user.id;
        setData(next);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (cancel) return;
        setError(err);
        setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [user, tick, pathname]);

  return (
    <WorkspaceContext.Provider value={{ data, loading, error, refresh }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
}
