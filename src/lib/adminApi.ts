// Admin API Client - Version directe Supabase

import { supabase } from './supabase';
import { logger } from './logger';
import type { MenuItem } from '../hooks/useMenu';

export interface MenuCategory {
  id: string;
  name: string;
  icon: string | null;
  stroke_rgba: string | null;
  glow_rgba: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

// ============================================================================
// Categories API - Direct Supabase
// ============================================================================

export const adminCategoriesApi = {
  async getCategories(): Promise<MenuCategory[]> {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      logger.error('[getCategories] Erreur:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  async createCategory(category: {
    name: string;
    icon?: string;
    stroke_rgba?: string;
    glow_rgba?: string;
    display_order?: number;
  }): Promise<{ success: boolean; category: MenuCategory }> {
    const { data, error } = await supabase
      .from('menu_categories')
      .insert({
        name: category.name.trim(),
        icon: category.icon ?? '🍽️',
        stroke_rgba: category.stroke_rgba ?? 'rgba(37, 99, 235, 0.3)',
        glow_rgba: category.glow_rgba ?? 'rgba(37, 99, 235, 0.6)',
        display_order: category.display_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      logger.error('[createCategory] Erreur:', error);
      throw new Error(error.message);
    }

    return { success: true, category: data };
  },

  async updateCategory(
    id: string,
    updates: Partial<Pick<MenuCategory, 'name' | 'icon' | 'stroke_rgba' | 'glow_rgba' | 'display_order'>>
  ): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from('menu_categories')
      .update(updates)
      .eq('id', id);

    if (error) {
      logger.error('[updateCategory] Erreur:', error);
      throw new Error(error.message);
    }

    return { success: true };
  },

  async deleteCategory(id: string): Promise<{ success: boolean }> {
    // Vérifier si des items utilisent cette catégorie
    const { data: used } = await supabase
      .from('menu_items')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (used && used.length > 0) {
      throw new Error('Impossible de supprimer: des plats utilisent cette catégorie.');
    }

    const { error } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('[deleteCategory] Erreur:', error);
      throw new Error(error.message);
    }

    return { success: true };
  },

  async toggleCategory(id: string, is_active: boolean): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from('menu_categories')
      .update({ is_active })
      .eq('id', id);

    if (error) {
      logger.error('[toggleCategory] Erreur:', error);
      throw new Error(error.message);
    }

    return { success: true };
  },
};

// ============================================================================
// Menu API - Direct Supabase
// ============================================================================

export const adminMenuApi = {
  async getMenu(): Promise<MenuItem[]> {
    // Récupérer les catégories
    const { data: categories, error: catError } = await supabase
      .from('menu_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (catError) {
      logger.error('[getMenu] Erreur catégories:', catError);
      throw new Error(catError.message);
    }

    // Récupérer les items
    const { data: items, error: itemsError } = await supabase
      .from('menu_items')
      .select('*')
      .order('name', { ascending: true });

    if (itemsError) {
      logger.error('[getMenu] Erreur items:', itemsError);
      throw new Error(itemsError.message);
    }

    // Récupérer les variants
    const { data: variants, error: variantsError } = await supabase
      .from('menu_item_variants')
      .select('*');

    if (variantsError) {
      logger.error('[getMenu] Erreur variants:', variantsError);
      throw new Error(variantsError.message);
    }

    // Récupérer les hotspots
    const { data: hotspots, error: hotspotsError } = await supabase
      .from('menu_item_hotspots')
      .select('*');

    if (hotspotsError) {
      logger.error('[getMenu] Erreur hotspots:', hotspotsError);
      throw new Error(hotspotsError.message);
    }

    const catMap = new Map((categories || []).map((c: any) => [c.id, c]));

    const menuData = (items || [])
      .map((item: any) => {
        const cat = item.category_id ? catMap.get(item.category_id) : null;
        return {
          id: item.id,
          name: item.name,
          categoryId: item.category_id,
          category: cat
            ? {
              id: cat.id,
              name: cat.name,
              icon: cat.icon,
              strokeRgba: cat.stroke_rgba,
              glowRgba: cat.glow_rgba,
              displayOrder: cat.display_order,
              isActive: cat.is_active ?? true,
            }
            : null,
          shortDesc: item.short_desc || '',
          fullDesc: item.full_desc || '',
          price: parseFloat(item.price) || 0,
          image2D: item.image_2d,
          modelUrl: item.model_url,
          dimensions: item.dimensions,
          isActive: item.is_active ?? true,
          isFeatured: item.is_featured ?? false,
          status: item.status ?? 'published',
          nutrition: item.nutrition,
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
        };
      })
      .sort((a: any, b: any) => {
        const oA = a.category?.displayOrder ?? 9999;
        const oB = b.category?.displayOrder ?? 9999;
        if (oA !== oB) return oA - oB;
        return (a.name || '').localeCompare(b.name || '');
      });

    return menuData;
  },

  async createMenuItem(item: Partial<MenuItem> & { id: string; categoryId: string }): Promise<{ success: boolean; item: any }> {
    const { data: newItem, error: itemError } = await supabase
      .from('menu_items')
      .insert({
        id: item.id,
        name: item.name,
        category_id: item.categoryId,
        short_desc: item.shortDesc,
        full_desc: item.fullDesc,
        price: item.price,
        image_2d: item.image2D,
        model_url: item.modelUrl || null,
        dimensions: item.dimensions,
        nutrition: item.nutrition,
        is_featured: item.isFeatured ?? false,
        status: 'published',
      })
      .select()
      .single();

    if (itemError) {
      logger.error('[createMenuItem] Erreur:', itemError);
      throw new Error(itemError.message);
    }

    // Insérer les variants
    if (item.variants && item.variants.length > 0) {
      const variantsToInsert = item.variants.map((v: any) => ({
        menu_item_id: item.id,
        size: v.size,
        label: v.label,
        price_modifier: v.priceModifier,
        scale: v.scale || '1 1 1',
      }));

      const { error: variantsError } = await supabase
        .from('menu_item_variants')
        .insert(variantsToInsert);

      if (variantsError) {
        logger.error('[createMenuItem] Erreur variants:', variantsError);
      }
    }

    // Insérer les hotspots
    if (item.hotspots && item.hotspots.length > 0) {
      const hotspotsToInsert = item.hotspots.map((h: any) => ({
        menu_item_id: item.id,
        slot: h.slot,
        pos: h.pos,
        label: h.label,
        detail: h.detail,
      }));

      const { error: hotspotsError } = await supabase
        .from('menu_item_hotspots')
        .insert(hotspotsToInsert);

      if (hotspotsError) {
        logger.error('[createMenuItem] Erreur hotspots:', hotspotsError);
      }
    }

    return { success: true, item: newItem };
  },

  async updateMenuItem(id: string, item: Partial<MenuItem>): Promise<{ success: boolean }> {
    const updates: Record<string, unknown> = {};
    if (item.name !== undefined) updates.name = item.name;
    if (item.shortDesc !== undefined) updates.short_desc = item.shortDesc;
    if (item.fullDesc !== undefined) updates.full_desc = item.fullDesc;
    if (item.price !== undefined) updates.price = item.price;
    if (item.image2D !== undefined) updates.image_2d = item.image2D;
    if (item.modelUrl !== undefined) updates.model_url = item.modelUrl || null;
    if (item.dimensions !== undefined) updates.dimensions = item.dimensions;
    if (item.nutrition !== undefined) updates.nutrition = item.nutrition;
    if (item.categoryId !== undefined) updates.category_id = item.categoryId;
    if ((item as any).isFeatured !== undefined) updates.is_featured = (item as any).isFeatured;

    const { error: itemError } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id);

    if (itemError) {
      logger.error('[updateMenuItem] Erreur:', itemError);
      throw new Error(itemError.message);
    }

    // Supprimer et recréer variants
    await supabase.from('menu_item_variants').delete().eq('menu_item_id', id);
    await supabase.from('menu_item_hotspots').delete().eq('menu_item_id', id);

    if (item.variants && item.variants.length > 0) {
      const variantsToInsert = item.variants.map((v: any) => ({
        menu_item_id: id,
        size: v.size,
        label: v.label,
        price_modifier: v.priceModifier,
        scale: v.scale || '1 1 1',
      }));

      await supabase.from('menu_item_variants').insert(variantsToInsert);
    }

    if (item.hotspots && item.hotspots.length > 0) {
      const hotspotsToInsert = item.hotspots.map((h: any) => ({
        menu_item_id: id,
        slot: h.slot,
        pos: h.pos,
        label: h.label,
        detail: h.detail,
      }));

      await supabase.from('menu_item_hotspots').insert(hotspotsToInsert);
    }

    return { success: true };
  },

  async deleteMenuItem(id: string): Promise<{ success: boolean }> {
    // Supprimer variants et hotspots d'abord
    await supabase.from('menu_item_variants').delete().eq('menu_item_id', id);
    await supabase.from('menu_item_hotspots').delete().eq('menu_item_id', id);

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('[deleteMenuItem] Erreur:', error);
      throw new Error(error.message);
    }

    return { success: true };
  },

  async toggleMenuItem(id: string, is_active: boolean): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from('menu_items')
      .update({ is_active })
      .eq('id', id);

    if (error) {
      logger.error('[toggleMenuItem] Erreur:', error);
      throw new Error(error.message);
    }

    return { success: true };
  },
};

// ============================================================================
// Settings API - Direct Supabase
// ============================================================================

export type BackgroundMode = 'gradient' | 'single' | 'carousel';

export interface RestaurantSettings {
  id?: string;
  name?: string;
  logo_url?: string;
  theme_color?: string;
  qr_code_base_url?: string;
  background_images?: string[];
  background_mode?: BackgroundMode;
}

export const adminSettingsApi = {
  async getSettings(): Promise<RestaurantSettings> {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      logger.error('[getSettings] Erreur:', error);
      throw new Error(error.message);
    }

    return data || {};
  },

  async updateSettings(settings: {
    name: string;
    logo_url?: string;
    theme_color?: string;
    qr_code_base_url?: string;
    background_images?: string[];
    background_mode?: BackgroundMode;
  }): Promise<RestaurantSettings> {
    const { data: existing } = await supabase
      .from('restaurant_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .update({
          name: settings.name,
          logo_url: settings.logo_url || null,
          theme_color: settings.theme_color || '#f59e0b',
          qr_code_base_url: settings.qr_code_base_url || null,
          background_images: settings.background_images || [],
          background_mode: settings.background_mode || 'gradient',
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      result = data;
    } else {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .insert({
          name: settings.name,
          logo_url: settings.logo_url || null,
          theme_color: settings.theme_color || '#f59e0b',
          qr_code_base_url: settings.qr_code_base_url || null,
          background_images: settings.background_images || [],
          background_mode: settings.background_mode || 'gradient',
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      result = data;
    }

    return result;
  },
};

// ============================================================================
// Analytics API - Direct Supabase
// ============================================================================

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
    hotspots: number;
    arStarts: number;
    arEnds: number;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    menu_item_id: string | null;
    menu_item_name: string | null;
    created_at: string;
    session_id: string | null;
    metadata: Record<string, unknown> | null;
  }>;
}

export const adminAnalyticsApi = {
  /**
   * Calculer les tendances réelles en comparant la période courante vs précédente
   */
  async getTrends(days: number = 7): Promise<{
    views: { current: number; previous: number };
    carts: { current: number; previous: number };
    sessions: { current: number; previous: number };
  }> {
    const now = new Date();
    const currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - days);
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - days);

    // Période courante
    const { data: currentEvents } = await supabase
      .from('analytics_events')
      .select('event_type, session_id')
      .gte('created_at', currentStart.toISOString())
      .lte('created_at', now.toISOString());

    // Période précédente
    const { data: previousEvents } = await supabase
      .from('analytics_events')
      .select('event_type, session_id')
      .gte('created_at', previousStart.toISOString())
      .lt('created_at', currentStart.toISOString());

    const count = (events: typeof currentEvents, type: string) =>
      events?.filter(e => e.event_type === type).length || 0;

    const uniqueSessions = (events: typeof currentEvents) =>
      new Set(events?.map(e => e.session_id).filter(Boolean)).size;

    return {
      views: {
        current: count(currentEvents, 'view_3d'),
        previous: count(previousEvents, 'view_3d'),
      },
      carts: {
        current: count(currentEvents, 'add_to_cart'),
        previous: count(previousEvents, 'add_to_cart'),
      },
      sessions: {
        current: uniqueSessions(currentEvents),
        previous: uniqueSessions(previousEvents),
      },
    };
  },

  async getAnalytics(days: number = 7): Promise<AnalyticsData> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Récupérer les événements
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (eventsError) {
      logger.error('[getAnalytics] Erreur events:', eventsError);
      // Retourner des données vides si la table n'existe pas
      return {
        totalViews: 0,
        totalCarts: 0,
        avgEngagement: 0,
        topItems: [],
        eventsByType: [],
        eventsByDay: [],
        recentActivities: [],
      };
    }

    // Récupérer les noms des items
    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('id, name, category_id');

    const itemsMap = new Map(
      (menuItems || []).map((item) => [item.id, { name: item.name, category: item.category_id }])
    );

    // Calculer les métriques
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
      {
        event_type: 'ar_session_start',
        count: events?.filter((e) => e.event_type === 'ar_session_start').length || 0,
      },
      {
        event_type: 'ar_session_end',
        count: events?.filter((e) => e.event_type === 'ar_session_end').length || 0,
      },
    ];

    // Events by day
    const eventsByDayMap = new Map<string, { views: number; carts: number; hotspots: number; arStarts: number; arEnds: number }>();
    events?.forEach((event) => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      if (!eventsByDayMap.has(date)) {
        eventsByDayMap.set(date, { views: 0, carts: 0, hotspots: 0, arStarts: 0, arEnds: 0 });
      }
      const dayStats = eventsByDayMap.get(date)!;
      if (event.event_type === 'view_3d') dayStats.views++;
      if (event.event_type === 'add_to_cart') dayStats.carts++;
      if (event.event_type === 'hotspot_click') dayStats.hotspots++;
      if (event.event_type === 'ar_session_start') dayStats.arStarts++;
      if (event.event_type === 'ar_session_end') dayStats.arEnds++;
    });

    const eventsByDay = Array.from(eventsByDayMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Recent activities
    const recentActivities = (events || [])
      .map((event) => ({
        id: event.id,
        type: event.event_type,
        menu_item_id: event.menu_item_id,
        menu_item_name: event.menu_item_id ? itemsMap.get(event.menu_item_id)?.name || null : null,
        created_at: event.created_at,
        session_id: event.session_id,
        metadata: (event.metadata as Record<string, unknown>) || null,
      }));

    return {
      totalViews,
      totalCarts,
      avgEngagement: Math.round(avgEngagement),
      topItems,
      eventsByType,
      eventsByDay,
      recentActivities,
    };
  },

  // Helper: get map of menu item id → name for realtime resolution
  async getMenuItemsMap(): Promise<Map<string, string>> {
    const { data } = await supabase
      .from('menu_items')
      .select('id, name');
    return new Map((data || []).map((item) => [item.id, item.name]));
  },
};

// ============================================================================
// Sessions API - Direct Supabase
// ============================================================================

export interface Session {
  session_id: string;
  views: number;
  carts: number;
  interactions: number;
  first_seen: string;
  last_seen: string;
  total_events: number;
  conversion_rate: number;
  status: 'active' | 'inactive';
  days_since_last_seen: number;
}

export interface SessionsData {
  sessions: Session[];
  stats: {
    totalSessions: number;
    activeSessions: number;
    avgOrders: number;
    retentionRate: number;
  };
  engagementByDay: Array<{
    day: string;
    views: number;
    interactions: number;
  }>;
}

export const adminSessionsApi = {
  async getSessions(days: number = 30, search?: string): Promise<SessionsData> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (eventsError) {
      logger.error('[getSessions] Erreur:', eventsError);
      return {
        sessions: [],
        stats: { totalSessions: 0, activeSessions: 0, avgOrders: 0, retentionRate: 0 },
        engagementByDay: [],
      };
    }

    // Agréger par session_id
    const sessionMap = new Map<string, {
      session_id: string;
      views: number;
      carts: number;
      interactions: number;
      first_seen: string;
      last_seen: string;
      events: any[];
    }>();

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

      if (event.created_at < session.first_seen) session.first_seen = event.created_at;
      if (event.created_at > session.last_seen) session.last_seen = event.created_at;

      session.events.push(event);
    });

    // Convertir et calculer
    let sessions = Array.from(sessionMap.values()).map((session) => {
      const daysSinceLastSeen = Math.floor(
        (Date.now() - new Date(session.last_seen).getTime()) / (1000 * 60 * 60 * 24)
      );
      const isActive = daysSinceLastSeen <= 7;

      return {
        session_id: session.session_id,
        views: session.views,
        carts: session.carts,
        interactions: session.interactions,
        first_seen: session.first_seen,
        last_seen: session.last_seen,
        total_events: session.events.length,
        conversion_rate: session.views > 0 ? (session.carts / session.views) * 100 : 0,
        status: (isActive ? 'active' : 'inactive') as 'active' | 'inactive',
        days_since_last_seen: daysSinceLastSeen,
      };
    });

    // Filtrer par recherche
    if (search) {
      const query = search.toLowerCase();
      sessions = sessions.filter((s) => s.session_id.toLowerCase().includes(query));
    }

    // Trier par dernière visite
    sessions.sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime());

    // Stats
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter((s) => s.status === 'active').length;
    const avgOrders = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.carts, 0) / sessions.length
      : 0;
    const retentionRate = sessions.length > 0 ? (activeSessions / sessions.length) * 100 : 0;

    // Engagement par jour
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

    return {
      sessions,
      stats: {
        totalSessions,
        activeSessions,
        avgOrders: Math.round(avgOrders * 10) / 10,
        retentionRate: Math.round(retentionRate * 10) / 10,
      },
      engagementByDay,
    };
  },
};

// ============================================================================
// Upload API - Direct Supabase Storage
// ============================================================================

export const adminUploadApi = {
  async getUploadUrl(bucket: string, path: string, _fileType?: string): Promise<{
    signedUrl: string;
    path: string;
    token: string;
  }> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error) {
      logger.error('[getUploadUrl] Erreur:', error);
      throw new Error(error.message);
    }

    return {
      signedUrl: data.signedUrl,
      path: data.path,
      token: data.token,
    };
  },
};

// ============================================================================
// Combined API export
// ============================================================================

// ============================================================================
// QR Codes API - Direct Supabase
// ============================================================================

export interface QRCode {
  id: string;
  type: 'table' | 'room' | 'delivery' | 'custom';
  label: string;
  code: string;
  metadata: Record<string, unknown>;
  is_active: boolean;
  scan_count: number;
  created_at: string;
  updated_at: string;
}

export const adminQRCodesApi = {
  async getQRCodes(): Promise<QRCode[]> {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as QRCode[];
  },

  async createQRCode(qrCode: {
    type: QRCode['type'];
    label: string;
    code: string;
    metadata?: Record<string, unknown>;
  }): Promise<QRCode> {
    const { data, error } = await supabase
      .from('qr_codes')
      .insert({
        type: qrCode.type,
        label: qrCode.label,
        code: qrCode.code,
        metadata: qrCode.metadata || {},
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as QRCode;
  },

  async createBatchQRCodes(
    type: QRCode['type'],
    prefix: string,
    start: number,
    end: number,
    labelTemplate: string
  ): Promise<QRCode[]> {
    const items = [];
    for (let i = start; i <= end; i++) {
      items.push({
        type,
        label: labelTemplate.replace('{n}', String(i)),
        code: `${prefix}${i}`,
        metadata: {},
      });
    }

    const { data, error } = await supabase
      .from('qr_codes')
      .insert(items)
      .select();

    if (error) throw new Error(error.message);
    return (data || []) as QRCode[];
  },

  async updateQRCode(id: string, updates: Partial<Pick<QRCode, 'label' | 'metadata' | 'is_active'>>): Promise<QRCode> {
    const { data, error } = await supabase
      .from('qr_codes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as QRCode;
  },

  async deleteQRCode(id: string): Promise<void> {
    const { error } = await supabase
      .from('qr_codes')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async toggleQRCode(id: string, is_active: boolean): Promise<void> {
    const { error } = await supabase
      .from('qr_codes')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async getQRCodeByCode(code: string): Promise<QRCode | null> {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as QRCode | null;
  },

  async incrementScanCount(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_scan_count', { qr_id: id });
    // Fallback: if RPC doesn't exist, do manual increment
    if (error) {
      const { data: current } = await supabase
        .from('qr_codes')
        .select('scan_count')
        .eq('id', id)
        .single();
      if (current) {
        await supabase
          .from('qr_codes')
          .update({ scan_count: (current.scan_count || 0) + 1 })
          .eq('id', id);
      }
    }
  },
};

// ============================================================================
// Advanced Analytics API
// ============================================================================

export interface FunnelStep {
  step: string;
  count: number;
  rate: number; // % par rapport à l'étape précédente
  color: string;
}

export interface EngagementHeatmapItem {
  id: string;
  name: string;
  category: string;
  views: number;
  carts: number;
  hotspots: number;
  arSessions: number;
  avgDuration: number;
  conversionRate: number;
  engagementScore: number;
}

export interface PeakHourCell {
  day: string;       // 'Lun', 'Mar', etc.
  dayIndex: number;
  hour: number;
  count: number;
  intensity: number; // 0-1 normalized
}

export interface CohortData {
  period: string;
  newSessions: number;
  returningSessions: number;
  totalSessions: number;
  retentionRate: number;
}

export interface QRAnalyticsItem {
  id: string;
  label: string;
  type: string;
  code: string;
  scanCount: number;
  isActive: boolean;
}

export interface AdvancedAnalyticsData {
  funnel: FunnelStep[];
  engagementHeatmap: EngagementHeatmapItem[];
  peakHours: PeakHourCell[];
  cohorts: CohortData[];
  qrAnalytics: QRAnalyticsItem[];
}

export const adminAdvancedAnalyticsApi = {
  async getAdvancedAnalytics(days: number = 30): Promise<AdvancedAnalyticsData> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch all events
    const { data: events } = await supabase
      .from('analytics_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Fetch menu items for names
    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('id, name, category_id');

    // Fetch categories
    const { data: categories } = await supabase
      .from('menu_categories')
      .select('id, name');

    // Fetch QR codes
    const { data: qrCodes } = await supabase
      .from('qr_codes')
      .select('*')
      .order('scan_count', { ascending: false });

    const allEvents = events || [];
    const catMap = new Map((categories || []).map((c: any) => [c.id, c.name]));
    const itemMap = new Map((menuItems || []).map((m: any) => [m.id, { name: m.name, category: catMap.get(m.category_id) || 'Sans catégorie' }]));

    // ─── 1. FUNNEL ───
    const uniqueSessions = new Set(allEvents.filter(e => e.session_id).map(e => e.session_id));
    const sessionsWithView = new Set(allEvents.filter(e => e.event_type === 'view_3d' && e.session_id).map(e => e.session_id));
    const sessionsWithAR = new Set(allEvents.filter(e => e.event_type === 'ar_session_start' && e.session_id).map(e => e.session_id));
    const sessionsWithHotspot = new Set(allEvents.filter(e => e.event_type === 'hotspot_click' && e.session_id).map(e => e.session_id));
    const sessionsWithCart = new Set(allEvents.filter(e => e.event_type === 'add_to_cart' && e.session_id).map(e => e.session_id));

    const totalSessions = uniqueSessions.size || 1;
    const funnel: FunnelStep[] = [
      { step: 'Sessions', count: uniqueSessions.size, rate: 100, color: '#6366F1' },
      { step: 'Vues 3D', count: sessionsWithView.size, rate: (sessionsWithView.size / totalSessions) * 100, color: '#3B82F6' },
      { step: 'Sessions AR', count: sessionsWithAR.size, rate: (sessionsWithAR.size / totalSessions) * 100, color: '#10B981' },
      { step: 'Clics Hotspot', count: sessionsWithHotspot.size, rate: (sessionsWithHotspot.size / totalSessions) * 100, color: '#F59E0B' },
      { step: 'Ajouts Panier', count: sessionsWithCart.size, rate: (sessionsWithCart.size / totalSessions) * 100, color: '#EF4444' },
    ];

    // ─── 2. ENGAGEMENT HEATMAP ───
    const itemStats = new Map<string, { views: number; carts: number; hotspots: number; arSessions: number; durations: number[] }>();
    allEvents.forEach((e: any) => {
      if (!e.menu_item_id) return;
      if (!itemStats.has(e.menu_item_id)) {
        itemStats.set(e.menu_item_id, { views: 0, carts: 0, hotspots: 0, arSessions: 0, durations: [] });
      }
      const s = itemStats.get(e.menu_item_id)!;
      if (e.event_type === 'view_3d') s.views++;
      if (e.event_type === 'add_to_cart') s.carts++;
      if (e.event_type === 'hotspot_click') s.hotspots++;
      if (e.event_type === 'ar_session_start') s.arSessions++;
      if (e.event_type === 'ar_session_end' && e.duration) s.durations.push(e.duration);
    });

    const engagementHeatmap: EngagementHeatmapItem[] = Array.from(itemStats.entries())
      .map(([id, s]) => {
        const info = itemMap.get(id) || { name: 'Inconnu', category: 'N/A' };
        const avgDuration = s.durations.length > 0 ? s.durations.reduce((a, b) => a + b, 0) / s.durations.length : 0;
        const conversionRate = s.views > 0 ? (s.carts / s.views) * 100 : 0;
        // Score composite: vues(1x) + AR(2x) + hotspots(1.5x) + cart(3x) + durée(0.5x)
        const engagementScore = Math.round(
          s.views * 1 + s.arSessions * 2 + s.hotspots * 1.5 + s.carts * 3 + (avgDuration / 60) * 0.5
        );
        return { id, name: info.name, category: info.category, views: s.views, carts: s.carts, hotspots: s.hotspots, arSessions: s.arSessions, avgDuration: Math.round(avgDuration), conversionRate, engagementScore };
      })
      .sort((a, b) => b.engagementScore - a.engagementScore);

    // ─── 3. PEAK HOURS ───
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const hourDayMap = new Map<string, number>();
    allEvents.forEach((e: any) => {
      const d = new Date(e.created_at);
      const key = `${d.getDay()}-${d.getHours()}`;
      hourDayMap.set(key, (hourDayMap.get(key) || 0) + 1);
    });
    const maxCount = Math.max(...Array.from(hourDayMap.values()), 1);
    const peakHours: PeakHourCell[] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 8; hour <= 23; hour++) {
        const key = `${day}-${hour}`;
        const count = hourDayMap.get(key) || 0;
        peakHours.push({ day: dayNames[day], dayIndex: day, hour, count, intensity: count / maxCount });
      }
    }

    // ─── 4. COHORTS ───
    const sessionFirstSeen = new Map<string, string>();
    allEvents.forEach((e: any) => {
      if (!e.session_id) return;
      if (!sessionFirstSeen.has(e.session_id) || e.created_at < sessionFirstSeen.get(e.session_id)!) {
        sessionFirstSeen.set(e.session_id, e.created_at);
      }
    });

    // Group by week
    const weekBuckets = new Map<string, { newSessions: Set<string>; returningSessions: Set<string> }>();
    const allSessionIds = new Set<string>();

    allEvents.forEach((e: any) => {
      if (!e.session_id) return;
      const d = new Date(e.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekBuckets.has(weekKey)) {
        weekBuckets.set(weekKey, { newSessions: new Set(), returningSessions: new Set() });
      }
      const bucket = weekBuckets.get(weekKey)!;

      if (allSessionIds.has(e.session_id)) {
        bucket.returningSessions.add(e.session_id);
      } else {
        bucket.newSessions.add(e.session_id);
      }
      allSessionIds.add(e.session_id);
    });

    const cohorts: CohortData[] = Array.from(weekBuckets.entries())
      .map(([period, b]) => {
        const total = b.newSessions.size + b.returningSessions.size;
        return {
          period: `Sem. ${period.slice(5)}`,
          newSessions: b.newSessions.size,
          returningSessions: b.returningSessions.size,
          totalSessions: total,
          retentionRate: total > 0 ? (b.returningSessions.size / total) * 100 : 0,
        };
      })
      .sort((a, b) => a.period.localeCompare(b.period));

    // ─── 5. QR ANALYTICS ───
    const qrAnalytics: QRAnalyticsItem[] = (qrCodes || []).map((qr: any) => ({
      id: qr.id,
      label: qr.label,
      type: qr.type,
      code: qr.code,
      scanCount: qr.scan_count || 0,
      isActive: qr.is_active,
    }));

    return { funnel, engagementHeatmap, peakHours, cohorts, qrAnalytics };
  },
};

export const adminApi = {
  menu: adminMenuApi,
  categories: adminCategoriesApi,
  settings: adminSettingsApi,
  analytics: adminAnalyticsApi,
  advancedAnalytics: adminAdvancedAnalyticsApi,
  sessions: adminSessionsApi,
  upload: adminUploadApi,
  qrCodes: adminQRCodesApi,
};
