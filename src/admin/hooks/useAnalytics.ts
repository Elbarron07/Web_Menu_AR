import { useState, useEffect } from 'react';
import { adminApi, type AnalyticsData } from '../../lib/adminApi';
import { useAuth } from './useAuth';

export type { AnalyticsData };

export const useAnalytics = (days: number = 7) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    // Attendre que l'authentification soit vérifiée et que l'utilisateur soit admin
    if (authLoading || !isAdmin) {
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const analyticsData = await adminApi.analytics.getAnalytics(days);
        setData(analyticsData);
      } catch (err: any) {
        console.error('Analytics error:', err);
        setError(err.message || 'Erreur lors du chargement des analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [days, isAdmin, authLoading]);

  return { data, loading: loading || authLoading, error };
};
