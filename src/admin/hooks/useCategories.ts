import { useState, useEffect } from 'react';
import { adminApi, type MenuCategory } from '../../lib/adminApi';

export const useCategories = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await adminApi.categories.getCategories();
      setCategories(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
};
