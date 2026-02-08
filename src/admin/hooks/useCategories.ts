import { useState, useEffect } from 'react';
import { adminApi, type MenuCategory } from '../../lib/adminApi';
import { logger } from '../../lib/logger';
import { useAuth } from './useAuth';

export const useCategories = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin, loading: authLoading } = useAuth();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await adminApi.categories.getCategories();
      setCategories(data);
      setError(null);
    } catch (err: unknown) {
      logger.error('[useCategories] Erreur');
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Attendre que l'authentification soit vérifiée et que l'utilisateur soit admin
    if (authLoading || !isAdmin) {
      return;
    }
    fetchCategories();
  }, [isAdmin, authLoading]);

  const createCategory = async (category: {
    name: string;
    icon?: string;
    stroke_rgba?: string;
    glow_rgba?: string;
    display_order?: number;
  }) => {
    await adminApi.categories.createCategory(category);
    await fetchCategories();
  };

  const updateCategory = async (
    id: string,
    updates: Partial<Pick<MenuCategory, 'name' | 'icon' | 'stroke_rgba' | 'glow_rgba' | 'display_order'>>
  ) => {
    await adminApi.categories.updateCategory(id, updates);
    await fetchCategories();
  };

  const deleteCategory = async (id: string) => {
    await adminApi.categories.deleteCategory(id);
    await fetchCategories();
  };

  const toggleCategory = async (id: string, isActive: boolean) => {
    await adminApi.categories.toggleCategory(id, isActive);
    await fetchCategories();
  };

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategory,
    refetch: fetchCategories,
  };
};
