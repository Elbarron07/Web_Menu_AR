// Edge Function: Admin Menu Management
// Handles CRUD operations for menu_items, variants, and hotspots

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

    const method = req.method;

    // GET: List all menu items with variants and hotspots
    if (method === 'GET') {
      const { data: items, error: itemsError } = await supabaseAdmin
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true });

      if (itemsError) throw itemsError;

      const { data: variants, error: variantsError } = await supabaseAdmin
        .from('menu_item_variants')
        .select('*');

      if (variantsError) throw variantsError;

      const { data: hotspots, error: hotspotsError } = await supabaseAdmin
        .from('menu_item_hotspots')
        .select('*');

      if (hotspotsError) throw hotspotsError;

      // Combine data
      const menuData = (items || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        shortDesc: item.short_desc,
        fullDesc: item.full_desc,
        price: parseFloat(item.price),
        image2D: item.image_2d,
        modelUrl: item.model_url,
        dimensions: item.dimensions,
        nutrition: item.nutrition,
        status: item.status,
        variants: (variants || [])
          .filter((v: any) => v.menu_item_id === item.id)
          .map((v: any) => ({
            size: v.size,
            label: v.label,
            priceModifier: parseFloat(v.price_modifier),
            scale: v.scale,
          })),
        hotspots: (hotspots || [])
          .filter((h: any) => h.menu_item_id === item.id)
          .map((h: any) => ({
            slot: h.slot,
            pos: h.pos,
            label: h.label,
            detail: h.detail,
          })),
      }));

      return new Response(JSON.stringify(menuData), {
        status: 200,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // POST: Create new menu item
    if (method === 'POST') {
      const body = await req.json();
      const {
        id,
        name,
        category,
        shortDesc,
        fullDesc,
        price,
        image2D,
        modelUrl,
        dimensions,
        nutrition,
        variants = [],
        hotspots = [],
      } = body;

      // Insert menu item
      const { data: newItem, error: itemError } = await supabaseAdmin
        .from('menu_items')
        .insert({
          id,
          name,
          category,
          short_desc: shortDesc,
          full_desc: fullDesc,
          price,
          image_2d: image2D,
          model_url: modelUrl || null,
          dimensions,
          nutrition,
          status: 'published',
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // Insert variants
      if (variants.length > 0) {
        const variantsToInsert = variants.map((v: any) => ({
          menu_item_id: id,
          size: v.size,
          label: v.label,
          price_modifier: v.priceModifier,
          scale: v.scale || '1 1 1',
        }));

        const { error: variantsError } = await supabaseAdmin
          .from('menu_item_variants')
          .insert(variantsToInsert);

        if (variantsError) throw variantsError;
      }

      // Insert hotspots
      if (hotspots.length > 0) {
        const hotspotsToInsert = hotspots.map((h: any) => ({
          menu_item_id: id,
          slot: h.slot,
          pos: h.pos,
          label: h.label,
          detail: h.detail,
        }));

        const { error: hotspotsError } = await supabaseAdmin
          .from('menu_item_hotspots')
          .insert(hotspotsToInsert);

        if (hotspotsError) throw hotspotsError;
      }

      return new Response(JSON.stringify({ success: true, item: newItem }), {
        status: 201,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // PATCH: Update menu item
    if (method === 'PATCH') {
      const body = await req.json();
      const {
        id: itemId,
        name,
        category,
        shortDesc,
        fullDesc,
        price,
        image2D,
        modelUrl,
        dimensions,
        nutrition,
        variants = [],
        hotspots = [],
      } = body;

      if (!itemId) {
        return new Response(JSON.stringify({ error: 'id is required' }), {
          status: 400,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      // Update menu item
      const { error: itemError } = await supabaseAdmin
        .from('menu_items')
        .update({
          name,
          category,
          short_desc: shortDesc,
          full_desc: fullDesc,
          price,
          image_2d: image2D,
          model_url: modelUrl || null,
          dimensions,
          nutrition,
        })
        .eq('id', itemId);

      if (itemError) throw itemError;

      // Delete existing variants and hotspots
      await supabaseAdmin
        .from('menu_item_variants')
        .delete()
        .eq('menu_item_id', itemId);

      await supabaseAdmin
        .from('menu_item_hotspots')
        .delete()
        .eq('menu_item_id', itemId);

      // Insert new variants
      if (variants.length > 0) {
        const variantsToInsert = variants.map((v: any) => ({
          menu_item_id: itemId,
          size: v.size,
          label: v.label,
          price_modifier: v.priceModifier,
          scale: v.scale || '1 1 1',
        }));

        const { error: variantsError } = await supabaseAdmin
          .from('menu_item_variants')
          .insert(variantsToInsert);

        if (variantsError) throw variantsError;
      }

      // Insert new hotspots
      if (hotspots.length > 0) {
        const hotspotsToInsert = hotspots.map((h: any) => ({
          menu_item_id: itemId,
          slot: h.slot,
          pos: h.pos,
          label: h.label,
          detail: h.detail,
        }));

        const { error: hotspotsError } = await supabaseAdmin
          .from('menu_item_hotspots')
          .insert(hotspotsToInsert);

        if (hotspotsError) throw hotspotsError;
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // DELETE: Delete menu item
    if (method === 'DELETE') {
      let itemId: string | null = null;
      try {
        const body = await req.json();
        itemId = body?.id || null;
      } catch {
        // Body may be empty
      }

      if (!itemId) {
        return new Response(JSON.stringify({ error: 'id is required' }), {
          status: 400,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        });
      }

      // Delete variants and hotspots first (cascade should handle this, but explicit is safer)
      await supabaseAdmin
        .from('menu_item_variants')
        .delete()
        .eq('menu_item_id', itemId);

      await supabaseAdmin
        .from('menu_item_hotspots')
        .delete()
        .eq('menu_item_id', itemId);

      // Delete menu item
      const { error: itemError } = await supabaseAdmin
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (itemError) throw itemError;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-menu:', error);
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
