// Edge Function: Admin Settings Management
// Handles GET and PUT operations for restaurant_settings

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

    // GET: Retrieve settings
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('restaurant_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return new Response(JSON.stringify(data || {}), {
        status: 200,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // PUT: Update or create settings
    if (req.method === 'PUT') {
      const body = await req.json();
      const { name, logo_url, theme_color, qr_code_base_url } = body;

      // Check if settings exist
      const { data: existing } = await supabaseAdmin
        .from('restaurant_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      let result;
      if (existing) {
        // Update existing
        const { data, error } = await supabaseAdmin
          .from('restaurant_settings')
          .update({
            name,
            logo_url: logo_url || null,
            theme_color: theme_color || '#f59e0b',
            qr_code_base_url: qr_code_base_url || null,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new
        const { data, error } = await supabaseAdmin
          .from('restaurant_settings')
          .insert({
            name,
            logo_url: logo_url || null,
            theme_color: theme_color || '#f59e0b',
            qr_code_base_url: qr_code_base_url || null,
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-settings:', error);
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
