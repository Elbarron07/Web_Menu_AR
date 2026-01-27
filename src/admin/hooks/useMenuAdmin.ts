import { useState, useEffect } from 'react';
import { adminApi } from '../../lib/adminApi';
import type { MenuItem } from '../../hooks/useMenu';
import { useAuth } from './useAuth';

export const useMenuAdmin = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin, loading: authLoading } = useAuth();

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const data = await adminApi.menu.getMenu();
      setMenuItems(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching menu items:', err);
      setError(err.message || 'Erreur lors du chargement du menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Attendre que l'authentification soit vérifiée et que l'utilisateur soit admin
    if (authLoading || !isAdmin) {
      return;
    }
    fetchMenuItems();
  }, [isAdmin, authLoading]);

  const createMenuItem = async (itemData: Partial<MenuItem> & { id: string; categoryId: string }) => {
    try {
      await adminApi.menu.createMenuItem(itemData);
      await fetchMenuItems();
    } catch (err: any) {
      throw err;
    }
  };

  const updateMenuItem = async (id: string, itemData: Partial<MenuItem>) => {
    try {
      await adminApi.menu.updateMenuItem(id, itemData);
      await fetchMenuItems();
    } catch (err: any) {
      throw err;
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      await adminApi.menu.deleteMenuItem(id);
      await fetchMenuItems();
    } catch (err: any) {
      throw err;
    }
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
