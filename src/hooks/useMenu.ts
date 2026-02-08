import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export interface MenuCategoryRef {
  id: string;
  name: string;
  icon: string | null;
  strokeRgba: string | null;
  glowRgba: string | null;
  displayOrder: number;
}

export interface MenuItem {
  id: string;
  name: string;
  categoryId: string;
  category: MenuCategoryRef | null;
  shortDesc: string;
  fullDesc: string;
  price: number;
  image2D: string;
  modelUrl: string;
  dimensions: string;
  nutrition: {
    calories: number;
    allergenes: string[];
    temps: string;
  };
  variants: Array<{
    size: string;
    label: string;
    priceModifier: number;
    scale: string;
  }>;
  hotspots: Array<{
    slot: string;
    pos: string;
    label: string;
    detail: string;
  }>;
}

export const useMenu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);

        const { data: categories, error: catError } = await supabase
          .from('menu_categories')
          .select('id, name, icon, stroke_rgba, glow_rgba, display_order')
          .order('display_order', { ascending: true });

        if (catError) throw catError;

        const { data: items, error: itemsError } = await supabase
          .from('menu_items')
          .select('*')
          .order('name', { ascending: true });

        if (itemsError) throw itemsError;

        const { data: variants, error: variantsError } = await supabase
          .from('menu_item_variants')
          .select('*');

        if (variantsError) throw variantsError;

        const { data: hotspots, error: hotspotsError } = await supabase
          .from('menu_item_hotspots')
          .select('*');

        if (hotspotsError) throw hotspotsError;

        const catMap = new Map(
          (categories || []).map((c: any) => [
            c.id,
            {
              id: c.id,
              name: c.name,
              icon: c.icon,
              strokeRgba: c.stroke_rgba,
              glowRgba: c.glow_rgba,
              displayOrder: c.display_order ?? 0,
            },
          ])
        );

        const menuData: MenuItem[] = (items || []).map((item: any) => {
          const cat = item.category_id ? catMap.get(item.category_id) ?? null : null;
          const itemVariants = (variants || [])
            .filter((v: any) => v.menu_item_id === item.id)
            .map((v: any) => ({
              size: v.size,
              label: v.label,
              priceModifier: parseFloat(v.price_modifier),
              scale: v.scale,
            }));
          const itemHotspots = (hotspots || [])
            .filter((h: any) => h.menu_item_id === item.id)
            .map((h: any) => ({
              slot: h.slot,
              pos: h.pos,
              label: h.label,
              detail: h.detail,
            }));

          return {
            id: item.id,
            name: item.name,
            categoryId: item.category_id,
            category: cat,
            shortDesc: item.short_desc,
            fullDesc: item.full_desc,
            price: parseFloat(item.price),
            image2D: item.image_2d,
            modelUrl: item.model_url,
            dimensions: item.dimensions,
            nutrition: item.nutrition as { calories: number; allergenes: string[]; temps: string },
            variants: itemVariants,
            hotspots: itemHotspots,
          };
        });

        const byCategory = (a: MenuItem, b: MenuItem) => {
          const oA = a.category?.displayOrder ?? 9999;
          const oB = b.category?.displayOrder ?? 9999;
          if (oA !== oB) return oA - oB;
          return (a.name || '').localeCompare(b.name || '');
        };
        menuData.sort(byCategory);

        setMenuItems(menuData);
        setError(null);
      } catch (err: unknown) {
        logger.error('[useMenu] Erreur');
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement du menu');
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  return { menuItems, loading, error };
};

export const useMenuItem = (id: string | undefined) => {
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setMenuItem(null);
      setLoading(false);
      return;
    }

    const fetchMenuItem = async () => {
      try {
        setLoading(true);

        const { data: item, error: itemError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('id', id)
          .single();

        if (itemError) throw itemError;

        let cat: MenuCategoryRef | null = null;
        if (item.category_id) {
          const { data: c } = await supabase
            .from('menu_categories')
            .select('id, name, icon, stroke_rgba, glow_rgba, display_order')
            .eq('id', item.category_id)
            .single();
          if (c) {
            cat = {
              id: c.id,
              name: c.name,
              icon: c.icon,
              strokeRgba: c.stroke_rgba,
              glowRgba: c.glow_rgba,
              displayOrder: c.display_order ?? 0,
            };
          }
        }

        const { data: variants, error: variantsError } = await supabase
          .from('menu_item_variants')
          .select('*')
          .eq('menu_item_id', id);

        if (variantsError) throw variantsError;

        const { data: hotspots, error: hotspotsError } = await supabase
          .from('menu_item_hotspots')
          .select('*')
          .eq('menu_item_id', id);

        if (hotspotsError) throw hotspotsError;

        const menuData: MenuItem = {
          id: item.id,
          name: item.name,
          categoryId: item.category_id,
          category: cat,
          shortDesc: item.short_desc,
          fullDesc: item.full_desc,
          price: parseFloat(item.price),
          image2D: item.image_2d,
          modelUrl: item.model_url,
          dimensions: item.dimensions,
          nutrition: item.nutrition as { calories: number; allergenes: string[]; temps: string },
          variants: (variants || []).map((v: any) => ({
            size: v.size,
            label: v.label,
            priceModifier: parseFloat(v.price_modifier),
            scale: v.scale,
          })),
          hotspots: (hotspots || []).map((h: any) => ({
            slot: h.slot,
            pos: h.pos,
            label: h.label,
            detail: h.detail,
          })),
        };

        setMenuItem(menuData);
        setError(null);
      } catch (err: unknown) {
        logger.error('[useMenuItem] Erreur');
        setError(err instanceof Error ? err.message : 'Erreur');
        setMenuItem(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItem();
  }, [id]);

  return { menuItem, loading, error };
};
