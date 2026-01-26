// Edge Function: Admin Categories Management
// CRUD for menu_categories

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyAdmin, corsHeaders, handleCors } from '../_shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('origin');

  try {
    const auth = await verifyAdmin(req, supabaseUrl, supabaseServiceKey);
    if (!auth.isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const method = req.method;

    // GET: List categories ordered by display_order
    if (method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('menu_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // POST: Create category
    if (method === 'POST') {
      const body = await req.json();
      const { name, icon, stroke_rgba, glow_rgba, display_order } = body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        return new Response(JSON.stringify({ error: 'name is required' }), {
          status: 400,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabaseAdmin
        .from('menu_categories')
        .insert({
          name: name.trim(),
          icon: icon ?? '🍽️',
          stroke_rgba: stroke_rgba ?? 'rgba(37, 99, 235, 0.3)',
          glow_rgba: glow_rgba ?? 'rgba(37, 99, 235, 0.6)',
          display_order: typeof display_order === 'number' ? display_order : 0,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, category: data }), {
        status: 201,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // PATCH: Update category
    if (method === 'PATCH') {
      const body = await req.json();
      const { id, name, icon, stroke_rgba, glow_rgba, display_order } = body;

      if (!id) {
        return new Response(JSON.stringify({ error: 'id is required' }), {
          status: 400,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = typeof name === 'string' ? name.trim() : name;
      if (icon !== undefined) updates.icon = icon;
      if (stroke_rgba !== undefined) updates.stroke_rgba = stroke_rgba;
      if (glow_rgba !== undefined) updates.glow_rgba = glow_rgba;
      if (typeof display_order === 'number') updates.display_order = display_order;

      const { error } = await supabaseAdmin
        .from('menu_categories')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // DELETE: Delete category (refuse if menu_items use it)
    if (method === 'DELETE') {
      let id: string | null = null;
      try {
        const body = await req.json();
        id = body?.id ?? null;
      } catch {
        // body may be empty
      }

      if (!id) {
        return new Response(JSON.stringify({ error: 'id is required' }), {
          status: 400,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      const { data: used, error: countError } = await supabaseAdmin
        .from('menu_items')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (countError) throw countError;
      if (used && used.length > 0) {
        return new Response(
          JSON.stringify({
            error: 'Cannot delete category: it is used by menu items. Reassign or remove those items first.',
          }),
          {
            status: 400,
            headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
          }
        );
      }

      const { error } = await supabaseAdmin
        .from('menu_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Error in admin-categories:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      }
    );
  }
});
