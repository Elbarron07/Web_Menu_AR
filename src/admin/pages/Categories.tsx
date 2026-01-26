import { useState } from 'react';
import { Plus, FolderOpen, Edit, Trash2 } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import type { MenuCategory } from '../../lib/adminApi';

const ICON_OPTIONS = ['🍽️', '🍕', '🍔', '🥙', '🌮', '🍣', '🍝', '🥗', '🍰', '🥤', '🍟', '🍗'];

export const Categories = () => {
  const { categories, loading, error, createCategory, updateCategory, deleteCategory } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MenuCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '🍽️',
    stroke_rgba: 'rgba(37, 99, 235, 0.3)',
    glow_rgba: 'rgba(37, 99, 235, 0.6)',
    display_order: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormData({
      name: '',
      icon: '🍽️',
      stroke_rgba: 'rgba(37, 99, 235, 0.3)',
      glow_rgba: 'rgba(37, 99, 235, 0.6)',
      display_order: categories.length,
    });
    setShowForm(true);
  };

  const openEdit = (c: MenuCategory) => {
    setEditing(c);
    setFormData({
      name: c.name,
      icon: c.icon || '🍽️',
      stroke_rgba: c.stroke_rgba || 'rgba(37, 99, 235, 0.3)',
      glow_rgba: c.glow_rgba || 'rgba(37, 99, 235, 0.6)',
      display_order: c.display_order ?? 0,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setDeleteError(null);
    try {
      if (editing) {
        await updateCategory(editing.id, formData);
      } else {
        await createCategory(formData);
      }
      setShowForm(false);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (c: MenuCategory) => {
    if (!confirm(`Supprimer la catégorie « ${c.name } » ? Les plats qui l'utilisent doivent d'abord être réaffectés.`)) return;
    setDeleteError(null);
    try {
      await deleteCategory(c.id);
    } catch (err: any) {
      setDeleteError(err.message || 'Erreur lors de la suppression');
      alert(err.message || 'Impossible de supprimer : des plats utilisent cette catégorie.');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Chargement...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <FolderOpen className="w-8 h-8" />
            Catégories
          </h1>
          <p className="text-gray-600">Gérez les catégories de plats avant d&apos;ajouter des articles au menu</p>
        </div>
        <Button icon={<Plus className="w-5 h-5" />} onClick={openCreate}>
          Nouvelle catégorie
        </Button>
      </div>

      <Card variant="default" padding="lg">
        {categories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-4">Aucune catégorie. Créez-en une pour commencer à ajouter des plats.</p>
            <Button onClick={openCreate}>Créer une catégorie</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Icône
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ordre
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-2xl">{c.icon || '🍽️'}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{c.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.display_order}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {deleteError && (
          <p className="mt-4 text-sm text-red-600">{deleteError}</p>
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value.trim() }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icône</label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData((d) => ({ ...d, icon: emoji }))}
                      className={`w-10 h-10 rounded-lg border-2 text-xl flex items-center justify-center transition-colors ${
                        formData.icon === emoji
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ordre d&apos;affichage</label>
                <input
                  type="number"
                  min={0}
                  value={formData.display_order}
                  onChange={(e) => setFormData((d) => ({ ...d, display_order: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
                <Button type="submit" loading={submitting} disabled={!formData.name.trim()}>
                  {editing ? 'Enregistrer' : 'Créer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
