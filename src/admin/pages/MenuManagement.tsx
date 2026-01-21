import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useMenuAdmin } from '../hooks/useMenuAdmin';
import { MenuItemForm } from '../components/menu/MenuItemForm';
import { MenuItemTable } from '../components/menu/MenuItemTable';
import type { MenuItem } from '../../hooks/useMenu';

export const MenuManagement = () => {
  const { menuItems, loading, deleteMenuItem } = useMenuAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const categories = Array.from(new Set(menuItems.map((item) => item.category)));

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.shortDesc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
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

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion du Menu</h1>
          <p className="text-gray-600">Créez et gérez vos plats</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Ajouter un plat
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un plat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <MenuItemTable
          items={filteredItems}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {showForm && (
        <MenuItemForm
          item={editingItem}
          onClose={handleCloseForm}
          onSuccess={handleCloseForm}
        />
      )}
    </div>
  );
};
