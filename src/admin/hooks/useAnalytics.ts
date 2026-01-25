import { useState, useEffect } from 'react';
import { adminApi, type AnalyticsData } from '../../lib/adminApi';

export type { AnalyticsData };

export const useAnalytics = (days: number = 7) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const analyticsData = await adminApi.analytics.getAnalytics(days);
        setData(analyticsData);
        setError(null);
      } catch (err: any) {
        console.error('Analytics error:', err);
        setError(err.message || 'Erreur lors du chargement des analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [days]);

  return { data, loading, error };
};
