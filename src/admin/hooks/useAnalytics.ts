import { useState, useEffect, useCallback, useRef } from 'react';
import { adminApi, type AnalyticsData } from '../../lib/adminApi';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import { useAuth } from './useAuth';
import { computeTrend } from '../utils/exportUtils';

export type { AnalyticsData };

export interface AnalyticsTrends {
  views: { value: string; direction: 'up' | 'down' | 'neutral' };
  carts: { value: string; direction: 'up' | 'down' | 'neutral' };
  sessions: { value: string; direction: 'up' | 'down' | 'neutral' };
}

/**
 * useAnalytics — Real-time analytics hook
 *
 * 1. Initial fetch via adminApi (bulk query)
 * 2. Subscribe to `analytics_events` INSERT via Supabase Realtime
 * 3. On each new event → incrementally update state (no refetch)
 * 4. Recompute trends on each update
 */
export const useAnalytics = (days: number = 7) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [trends, setTrends] = useState<AnalyticsTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtime, setIsRealtime] = useState(false);
  const { isAdmin, loading: authLoading } = useAuth();

  // Menu item name cache for real-time event resolution
  const menuItemsMapRef = useRef<Map<string, string>>(new Map());

  // ── Initial fetch ──
  useEffect(() => {
    if (authLoading || !isAdmin) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const [analyticsData, trendsData, itemsMap] = await Promise.all([
          adminApi.analytics.getAnalytics(days),
          adminApi.analytics.getTrends(days),
          adminApi.analytics.getMenuItemsMap(),
        ]);

        menuItemsMapRef.current = itemsMap;
        setData(analyticsData);
        setTrends({
          views: computeTrend(trendsData.views.current, trendsData.views.previous),
          carts: computeTrend(trendsData.carts.current, trendsData.carts.previous),
          sessions: computeTrend(trendsData.sessions.current, trendsData.sessions.previous),
        });
      } catch (err: unknown) {
        logger.error('[useAnalytics] Erreur');
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [days, isAdmin, authLoading]);

  // ── Incremental update from a new event ──
  const handleNewEvent = useCallback((payload: any) => {
    const newEvent = payload.new;
    if (!newEvent) return;

    setData(prev => {
      if (!prev) return prev;

      const itemName = newEvent.menu_item_id
        ? menuItemsMapRef.current.get(newEvent.menu_item_id) || null
        : null;

      const eventType: string = newEvent.event_type;

      // 1. Update totals
      const totalViews = prev.totalViews + (eventType === 'view_3d' ? 1 : 0);
      const totalCarts = prev.totalCarts + (eventType === 'add_to_cart' ? 1 : 0);

      // 2. Update avgEngagement
      let avgEngagement = prev.avgEngagement;
      if (eventType === 'ar_session_end' && newEvent.duration) {
        const sessCount = prev.eventsByType.find(e => e.event_type === 'ar_session_end')?.count || 0;
        const totalDur = prev.avgEngagement * sessCount;
        avgEngagement = Math.round((totalDur + newEvent.duration) / (sessCount + 1));
      }

      // 3. Update eventsByType
      const eventsByType = prev.eventsByType.map(e =>
        e.event_type === eventType ? { ...e, count: e.count + 1 } : e
      );

      // 4. Update topItems
      const topItems = [...prev.topItems];
      if (newEvent.menu_item_id && (eventType === 'view_3d' || eventType === 'add_to_cart')) {
        const existing = topItems.find(i => i.menu_item_id === newEvent.menu_item_id);
        if (existing) {
          if (eventType === 'view_3d') existing.views++;
          if (eventType === 'add_to_cart') existing.carts++;
          existing.conversionRate = existing.views > 0 ? (existing.carts / existing.views) * 100 : 0;
        } else {
          topItems.push({
            menu_item_id: newEvent.menu_item_id,
            name: itemName || 'Inconnu',
            views: eventType === 'view_3d' ? 1 : 0,
            carts: eventType === 'add_to_cart' ? 1 : 0,
            conversionRate: 0,
          });
        }
        topItems.sort((a, b) => b.views - a.views);
      }

      // 5. Update eventsByDay
      const eventDate = new Date(newEvent.created_at).toISOString().split('T')[0];
      const eventsByDay = [...prev.eventsByDay];
      const dayEntry = eventsByDay.find(d => d.date === eventDate);
      if (dayEntry) {
        if (eventType === 'view_3d') dayEntry.views++;
        if (eventType === 'add_to_cart') dayEntry.carts++;
        if (eventType === 'hotspot_click') dayEntry.hotspots++;
        if (eventType === 'ar_session_start') dayEntry.arStarts++;
        if (eventType === 'ar_session_end') dayEntry.arEnds++;
      } else {
        eventsByDay.push({
          date: eventDate,
          views: eventType === 'view_3d' ? 1 : 0,
          carts: eventType === 'add_to_cart' ? 1 : 0,
          hotspots: eventType === 'hotspot_click' ? 1 : 0,
          arStarts: eventType === 'ar_session_start' ? 1 : 0,
          arEnds: eventType === 'ar_session_end' ? 1 : 0,
        });
        eventsByDay.sort((a, b) => a.date.localeCompare(b.date));
      }

      // 6. Prepend to recentActivities (newest first)
      const newActivity = {
        id: newEvent.id,
        type: eventType,
        menu_item_id: newEvent.menu_item_id || null,
        menu_item_name: itemName,
        created_at: newEvent.created_at,
        session_id: newEvent.session_id || null,
        metadata: (newEvent.metadata as Record<string, unknown>) || null,
      };
      const recentActivities = [newActivity, ...prev.recentActivities];

      return {
        totalViews,
        totalCarts,
        avgEngagement,
        topItems,
        eventsByType,
        eventsByDay,
        recentActivities,
      };
    });

    // Recompute trends after update (simple: refetch is fine here since it's lightweight)
    adminApi.analytics.getTrends(days).then(trendsData => {
      setTrends({
        views: computeTrend(trendsData.views.current, trendsData.views.previous),
        carts: computeTrend(trendsData.carts.current, trendsData.carts.previous),
        sessions: computeTrend(trendsData.sessions.current, trendsData.sessions.previous),
      });
    }).catch(() => { /* trends update is best-effort */ });
  }, [days]);

  // ── Supabase Realtime subscription ──
  useEffect(() => {
    if (authLoading || !isAdmin || loading) return;

    const channel = supabase
      .channel('analytics-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'analytics_events' },
        handleNewEvent
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtime(true);
          logger.info('[useAnalytics] Realtime connecté');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsRealtime(false);
          logger.error('[useAnalytics] Realtime déconnecté:', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setIsRealtime(false);
    };
  }, [isAdmin, authLoading, loading, handleNewEvent]);

  return { data, trends, loading: loading || authLoading, error, isRealtime };
};
