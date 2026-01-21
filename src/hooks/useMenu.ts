import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
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
        
        // Récupérer les articles principaux
        const { data: items, error: itemsError } = await supabase
          .from('menu_items')
          .select('*')
          .order('category', { ascending: true });

        if (itemsError) throw itemsError;

        // Récupérer toutes les variantes
        const { data: variants, error: variantsError } = await supabase
          .from('menu_item_variants')
          .select('*');

        if (variantsError) throw variantsError;

        // Récupérer tous les hotspots
        const { data: hotspots, error: hotspotsError } = await supabase
          .from('menu_item_hotspots')
          .select('*');

        if (hotspotsError) throw hotspotsError;

        // Combiner les données
        const menuData: MenuItem[] = (items || []).map((item: any) => {
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
            category: item.category,
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

        setMenuItems(menuData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching menu items:', err);
        setError(err.message || 'Erreur lors du chargement du menu');
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
      setLoading(false);
      return;
    }

    const fetchMenuItem = async () => {
      try {
        setLoading(true);
        
        // Récupérer l'article principal
        const { data: item, error: itemError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('id', id)
          .single();

        if (itemError) throw itemError;

        // Récupérer les variantes
        const { data: variants, error: variantsError } = await supabase
          .from('menu_item_variants')
          .select('*')
          .eq('menu_item_id', id);

        if (variantsError) throw variantsError;

        // Récupérer les hotspots
        const { data: hotspots, error: hotspotsError } = await supabase
          .from('menu_item_hotspots')
          .select('*')
          .eq('menu_item_id', id);

        if (hotspotsError) throw hotspotsError;

        // Combiner les données
        const menuData: MenuItem = {
          id: item.id,
          name: item.name,
          category: item.category,
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
      } catch (err: any) {
        console.error('Error fetching menu item:', err);
        setError(err.message || 'Erreur lors du chargement de l\'article');
        setMenuItem(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItem();
  }, [id]);

  return { menuItem, loading, error };
};
