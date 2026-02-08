import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, UtensilsCrossed, FolderOpen } from 'lucide-react';
import { AdminPageSkeleton } from '../components/skeletons/AdminPageSkeleton';
import { useMenuAdmin } from '../hooks/useMenuAdmin';
import { useCategories } from '../hooks/useCategories';
import { MenuItemForm } from '../components/menu/MenuItemForm';
import { MenuItemTable } from '../components/menu/MenuItemTable';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { adminRoute } from '../../config/routes';
import type { MenuItem } from '../../hooks/useMenu';

export const MenuManagement = () => {
  const { menuItems, loading, deleteMenuItem, toggleMenuItem } = useMenuAdmin();
  const { categories, loading: categoriesLoading } = useCategories();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.shortDesc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryId === 'all' || item.categoryId === selectedCategoryId;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce plat ?')) {
      try {
        await deleteMenuItem(id);
      } catch (error) {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  if (loading || categoriesLoading) {
    return <AdminPageSkeleton variant="table" />;
  }

  const canAddPlat = categories.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <UtensilsCrossed className="w-8 h-8" />
            Gestion du Menu
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Créez et gérez vos plats</p>
        </div>
        {canAddPlat ? (
          <Button
            icon={<Plus className="w-5 h-5" />}
            onClick={() => setShowForm(true)}
          >
            Ajouter un plat
          </Button>
        ) : (
          <Link to={adminRoute('categories')}>
            <Button icon={<FolderOpen className="w-5 h-5" />} variant="secondary">
              Créer d&apos;abord une catégorie
            </Button>
          </Link>
        )}
      </div>

      {!canAddPlat && (
        <Card variant="default" padding="lg" className="bg-amber-50 border-amber-200">
          <p className="text-amber-800">
            Aucune catégorie. Créez-en une dans{' '}
            <Link to={adminRoute('categories')} className="font-semibold text-primary-600 hover:underline">
              Catégories
            </Link>{' '}
            avant d&apos;ajouter des plats.
          </p>
        </Card>
      )}

      <Card variant="default" padding="lg">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un plat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <MenuItemTable
          items={filteredItems}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggle={async (id, isActive) => {
            try {
              await toggleMenuItem(id, isActive);
            } catch {
              alert('Erreur lors du changement de statut');
            }
          }}
        />
      </Card>

      {showForm && canAddPlat && (
        <MenuItemForm
          item={editingItem}
          categories={categories}
          onClose={handleCloseForm}
          onSuccess={handleCloseForm}
        />
      )}
    </div>
  );
};
