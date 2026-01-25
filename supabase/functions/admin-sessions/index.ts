// Edge Function: Admin Sessions (Customer Tracking)
// Provides aggregated session data for customer tracking

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

    // Get query parameters
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '30', 10);
    const searchQuery = url.searchParams.get('search') || '';

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch events
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('analytics_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (eventsError) throw eventsError;

    // Aggregate by session_id
    const sessionMap = new Map<
      string,
      {
        session_id: string;
        views: number;
        carts: number;
        interactions: number;
        first_seen: string;
        last_seen: string;
        events: any[];
      }
    >();

    events?.forEach((event) => {
      if (!event.session_id) return;

      if (!sessionMap.has(event.session_id)) {
        sessionMap.set(event.session_id, {
          session_id: event.session_id,
          views: 0,
          carts: 0,
          interactions: 0,
          first_seen: event.created_at,
          last_seen: event.created_at,
          events: [],
        });
      }

      const session = sessionMap.get(event.session_id)!;
      if (event.event_type === 'view_3d') session.views++;
      if (event.event_type === 'add_to_cart') session.carts++;
      if (event.event_type === 'hotspot_click') session.interactions++;

      if (event.created_at < session.first_seen) {
        session.first_seen = event.created_at;
      }
      if (event.created_at > session.last_seen) {
        session.last_seen = event.created_at;
      }

      session.events.push(event);
    });

    // Convert to array and calculate stats
    const sessions = Array.from(sessionMap.values()).map((session) => {
      const daysSinceLastSeen = Math.floor(
        (Date.now() - new Date(session.last_seen).getTime()) / (1000 * 60 * 60 * 24)
      );
      const isActive = daysSinceLastSeen <= 7;

      return {
        ...session,
        total_events: session.events.length,
        conversion_rate: session.views > 0 ? (session.carts / session.views) * 100 : 0,
        status: isActive ? 'active' : 'inactive',
        days_since_last_seen: daysSinceLastSeen,
      };
    });

    // Filter by search query if provided
    let filteredSessions = sessions;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredSessions = sessions.filter(
        (s) =>
          s.session_id.toLowerCase().includes(query) ||
          s.views.toString().includes(query) ||
          s.carts.toString().includes(query)
      );
    }

    // Sort by last_seen (most recent first)
    filteredSessions.sort((a, b) =>
      new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime()
    );

    // Calculate aggregate stats
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter((s) => s.status === 'active').length;
    const avgOrders = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.carts, 0) / sessions.length
      : 0;
    const retentionRate =
      sessions.length > 0
        ? (activeSessions / sessions.length) * 100
        : 0;

    // Engagement by day (for chart)
    const engagementByDayMap = new Map<string, { views: number; interactions: number }>();
    events?.forEach((event) => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      if (!engagementByDayMap.has(date)) {
        engagementByDayMap.set(date, { views: 0, interactions: 0 });
      }
      const dayStats = engagementByDayMap.get(date)!;
      if (event.event_type === 'view_3d') dayStats.views++;
      if (event.event_type === 'hotspot_click') dayStats.interactions++;
    });

    const engagementByDay = Array.from(engagementByDayMap.entries())
      .map(([day, stats]) => ({ day, ...stats }))
      .sort((a, b) => a.day.localeCompare(b.day));

    const response = {
      sessions: filteredSessions,
      stats: {
        totalSessions,
        activeSessions,
        avgOrders: Math.round(avgOrders * 10) / 10,
        retentionRate: Math.round(retentionRate * 10) / 10,
      },
      engagementByDay,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-sessions:', error);
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
