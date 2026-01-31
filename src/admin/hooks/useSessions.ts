import { useState, useEffect } from 'react';
import { adminApi, type SessionsData } from '../../lib/adminApi';
import { logger } from '../../lib/logger';
import { useAuth } from './useAuth';

export type { SessionsData, Session } from '../../lib/adminApi';

export const useSessions = (days: number = 30, search?: string) => {
  const [data, setData] = useState<SessionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading || !isAdmin) {
      return;
    }

    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError(null);
        const sessionsData = await adminApi.sessions.getSessions(days, search);
        setData(sessionsData);
      } catch (err: unknown) {
        logger.error('[useSessions] Erreur');
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des sessions');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [days, search, isAdmin, authLoading]);

  return { data, loading: loading || authLoading, error };
};
