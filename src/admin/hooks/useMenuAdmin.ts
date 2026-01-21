import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { MenuItem } from '../../hooks/useMenu';

export const useMenuAdmin = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true });

      if (itemsError) throw itemsError;

      const { data: variants, error: variantsError } = await supabase
        .from('menu_item_variants')
        .select('*');

      if (variantsError) throw variantsError;

      const { data: hotspots, error: hotspotsError } = await supabase
        .from('menu_item_hotspots')
        .select('*');

      if (hotspotsError) throw hotspotsError;

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

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const createMenuItem = async (itemData: Partial<MenuItem>) => {
    const { error } = await supabase
      .from('menu_items')
      .insert({
        id: itemData.id,
        name: itemData.name,
        category: itemData.category,
        short_desc: itemData.shortDesc,
        full_desc: itemData.fullDesc,
        price: itemData.price,
        image_2d: itemData.image2D,
        model_url: itemData.modelUrl,
        dimensions: itemData.dimensions,
        nutrition: itemData.nutrition,
        status: 'draft',
      });

    if (error) throw error;
    await fetchMenuItems();
  };

  const updateMenuItem = async (id: string, itemData: Partial<MenuItem>) => {
    const { error } = await supabase
      .from('menu_items')
      .update({
        name: itemData.name,
        category: itemData.category,
        short_desc: itemData.shortDesc,
        full_desc: itemData.fullDesc,
        price: itemData.price,
        image_2d: itemData.image2D,
        model_url: itemData.modelUrl,
        dimensions: itemData.dimensions,
        nutrition: itemData.nutrition,
      })
      .eq('id', id);

    if (error) throw error;
    await fetchMenuItems();
  };

  const deleteMenuItem = async (id: string) => {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchMenuItems();
  };

  return {
    menuItems,
    loading,
    error,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    refetch: fetchMenuItems,
  };
};
