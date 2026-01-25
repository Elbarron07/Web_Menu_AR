// Edge Function: Admin Analytics
// Provides aggregated analytics data for admin dashboard

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyAdmin, corsHeaders, handleCors } from '../_shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('origin');

  try {
    // Verify admin
    const auth = await verifyAdmin(req, supabaseUrl, supabaseServiceKey);
    if (!auth.isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        }
      );
    }

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get days parameter (default: 7)
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '7', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch events
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('analytics_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (eventsError) throw eventsError;

    // Fetch menu items for names
    const { data: menuItems } = await supabaseAdmin
      .from('menu_items')
      .select('id, name, category');

    const itemsMap = new Map(
      (menuItems || []).map((item) => [item.id, { name: item.name, category: item.category }])
    );

    // Calculate metrics
    const totalViews = events?.filter((e) => e.event_type === 'view_3d').length || 0;
    const totalCarts = events?.filter((e) => e.event_type === 'add_to_cart').length || 0;

    const sessions = events?.filter((e) => e.event_type === 'ar_session_end') || [];
    const avgEngagement =
      sessions.length > 0
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
        name: itemsMap.get(menu_item_id)?.name || 'Inconnu',
        views: stats.views,
        carts: stats.carts,
        conversionRate: stats.views > 0 ? (stats.carts / stats.views) * 100 : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Events by type
    const eventsByType = [
      { event_type: 'view_3d', count: totalViews },
      { event_type: 'add_to_cart', count: totalCarts },
      {
        event_type: 'hotspot_click',
        count: events?.filter((e) => e.event_type === 'hotspot_click').length || 0,
      },
    ];

    // Events by day
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

    // Recent activities (last 10 events)
    const recentActivities = (events || [])
      .slice(0, 10)
      .map((event) => {
        const item = event.menu_item_id ? itemsMap.get(event.menu_item_id) : null;
        return {
          id: event.id,
          type: event.event_type,
          menu_item_id: event.menu_item_id,
          menu_item_name: item?.name || null,
          created_at: event.created_at,
          session_id: event.session_id,
        };
      });

    const response = {
      totalViews,
      totalCarts,
      avgEngagement: Math.round(avgEngagement),
      topItems,
      eventsByType,
      eventsByDay,
      recentActivities,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-analytics:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      }
    );
  }
});
