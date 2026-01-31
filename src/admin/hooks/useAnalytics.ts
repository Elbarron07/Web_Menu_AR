import { useState, useEffect } from 'react';
import { adminApi, type AnalyticsData } from '../../lib/adminApi';
import { logger } from '../../lib/logger';
import { useAuth } from './useAuth';

export type { AnalyticsData };

export const useAnalytics = (days: number = 7) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading || !isAdmin) {
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const analyticsData = await adminApi.analytics.getAnalytics(days);
        setData(analyticsData);
      } catch (err: unknown) {
        logger.error('[useAnalytics] Erreur');
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [days, isAdmin, authLoading]);

  return { data, loading: loading || authLoading, error };
};
