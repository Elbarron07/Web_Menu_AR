// Hook for fetching customer sessions data
import { useState, useEffect } from 'react';
import { adminApi, type SessionsData } from '../../lib/adminApi';
import { useAuth } from './useAuth';

export type { SessionsData, Session } from '../../lib/adminApi';

export const useSessions = (days: number = 30, search?: string) => {
  const [data, setData] = useState<SessionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    // Attendre que l'authentification soit vérifiée et que l'utilisateur soit admin
    if (authLoading || !isAdmin) {
      return;
    }

    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError(null);
        const sessionsData = await adminApi.sessions.getSessions(days, search);
        setData(sessionsData);
      } catch (err: any) {
        console.error('Sessions error:', err);
        setError(err.message || 'Erreur lors du chargement des sessions');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [days, search, isAdmin, authLoading]);

  return { data, loading: loading || authLoading, error };
};
