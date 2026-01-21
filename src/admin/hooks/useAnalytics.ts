import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export interface AnalyticsData {
  totalViews: number;
  totalCarts: number;
  avgEngagement: number;
  topItems: Array<{
    menu_item_id: string;
    name: string;
    views: number;
    carts: number;
    conversionRate: number;
  }>;
  eventsByType: Array<{
    event_type: string;
    count: number;
  }>;
  eventsByDay: Array<{
    date: string;
    views: number;
    carts: number;
  }>;
}

export const useAnalytics = (days: number = 7) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Récupérer tous les événements
        const { data: events, error: eventsError } = await supabase
          .from('analytics_events')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false });

        if (eventsError) throw eventsError;

        // Récupérer les noms des plats
        const { data: menuItems } = await supabase
          .from('menu_items')
          .select('id, name');

        const itemsMap = new Map((menuItems || []).map((item) => [item.id, item.name]));

        // Calculer les métriques
        const totalViews = events?.filter((e) => e.event_type === 'view_3d').length || 0;
        const totalCarts = events?.filter((e) => e.event_type === 'add_to_cart').length || 0;
        
        const sessions = events?.filter((e) => e.event_type === 'ar_session_end') || [];
        const avgEngagement = sessions.length > 0
          ? sessions.reduce((sum, e) => sum + (e.duration || 0), 0) / sessions.length
          : 0;

        // Top items
        const itemStats = new Map<string, { views: number; carts: number }>();
        events?.forEach((event) => {
          if (!event.menu_item_id) return;
          if (!itemStats.has(event.menu_item_id)) {
            itemStats.set(event.menu_item_id, { views: 0, carts: 0 });
          }
          const stats = itemStats.get(event.menu_item_id)!;
          if (event.event_type === 'view_3d') stats.views++;
          if (event.event_type === 'add_to_cart') stats.carts++;
        });

        const topItems = Array.from(itemStats.entries())
          .map(([menu_item_id, stats]) => ({
            menu_item_id,
            name: itemsMap.get(menu_item_id) || 'Inconnu',
            views: stats.views,
            carts: stats.carts,
            conversionRate: stats.views > 0 ? (stats.carts / stats.views) * 100 : 0,
          }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 10);

        // Événements par type
        const eventsByType = [
          { event_type: 'view_3d', count: totalViews },
          { event_type: 'add_to_cart', count: totalCarts },
          {
            event_type: 'hotspot_click',
            count: events?.filter((e) => e.event_type === 'hotspot_click').length || 0,
          },
        ];

        // Événements par jour
        const eventsByDayMap = new Map<string, { views: number; carts: number }>();
        events?.forEach((event) => {
          const date = new Date(event.created_at).toISOString().split('T')[0];
          if (!eventsByDayMap.has(date)) {
            eventsByDayMap.set(date, { views: 0, carts: 0 });
          }
          const dayStats = eventsByDayMap.get(date)!;
          if (event.event_type === 'view_3d') dayStats.views++;
          if (event.event_type === 'add_to_cart') dayStats.carts++;
        });

        const eventsByDay = Array.from(eventsByDayMap.entries())
          .map(([date, stats]) => ({ date, ...stats }))
          .sort((a, b) => a.date.localeCompare(b.date));

        setData({
          totalViews,
          totalCarts,
          avgEngagement: Math.round(avgEngagement),
          topItems,
          eventsByType,
          eventsByDay,
        });
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
