import { useState, useEffect } from 'react';
import { adminApi, type AdvancedAnalyticsData } from '../../lib/adminApi';
import { logger } from '../../lib/logger';
import { useAuth } from './useAuth';

export type { AdvancedAnalyticsData };

export const useAdvancedAnalytics = (days: number = 30) => {
    const [data, setData] = useState<AdvancedAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isAdmin, loading: authLoading } = useAuth();

    useEffect(() => {
        if (authLoading || !isAdmin) {
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await adminApi.advancedAnalytics.getAdvancedAnalytics(days);
                setData(result);
            } catch (err: unknown) {
                logger.error('[useAdvancedAnalytics] Erreur');
                setError(err instanceof Error ? err.message : 'Erreur lors du chargement des analytics avancées');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [days, isAdmin, authLoading]);

    return { data, loading: loading || authLoading, error };
};
