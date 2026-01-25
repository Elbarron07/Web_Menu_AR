// Hook for fetching customer sessions data
import { useState, useEffect } from 'react';
import { adminApi, type SessionsData } from '../../lib/adminApi';

export type { SessionsData, Session } from '../../lib/adminApi';

export const useSessions = (days: number = 30, search?: string) => {
  const [data, setData] = useState<SessionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const sessionsData = await adminApi.sessions.getSessions(days, search);
        setData(sessionsData);
        setError(null);
      } catch (err: any) {
        console.error('Sessions error:', err);
        setError(err.message || 'Erreur lors du chargement des sessions');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [days, search]);

  return { data, loading, error };
};
