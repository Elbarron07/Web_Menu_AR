import { useState } from 'react';
import { X, Package } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMenuAdmin } from '../../hooks/useMenuAdmin';
import { storageService } from '../../../lib/storage';
import type { MenuItem } from '../../../hooks/useMenu';
import { VariantManager } from './VariantManager';
import { ModelUploader } from '../assets/ModelUploader';
import { HotspotEditor } from '../assets/HotspotEditor';

const menuItemSchema = z.object({
  id: z.string().min(1, 'ID requis'),
  name: z.string().min(1, 'Nom requis'),
  category: z.string().min(1, 'Catégorie requise'),
  shortDesc: z.string().min(1, 'Description courte requise'),
  fullDesc: z.string().min(1, 'Description complète requise'),
  price: z.number().min(0, 'Prix doit être positif'),
  image2D: z.string().url('URL d\'image invalide'),
  modelUrl: z.string().optional(),
  dimensions: z.string().min(1, 'Dimensions requises'),
  calories: z.number().min(0),
  allergenes: z.array(z.string()),
  temps: z.string().min(1),
});

type MenuItemFormData = z.infer<typeof menuItemSchema>;

interface MenuItemFormProps {
  item?: MenuItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const MenuItemForm = ({ item, onClose, onSuccess }: MenuItemFormProps) => {
  const { createMenuItem, updateMenuItem } = useMenuAdmin();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [variants, setVariants] = useState(item?.variants || []);
  const [hotspots, setHotspots] = useState<Array<{ slot: string; pos: string; label: string; detail: string }>>(item?.hotspots || []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: item ? {
      id: item.id,
      name: item.name,
      category: item.category,
      shortDesc: item.shortDesc,
      fullDesc: item.fullDesc,
      price: item.price,
      image2D: item.image2D,
      modelUrl: item.modelUrl,
      dimensions: item.dimensions,
      calories: item.nutrition.calories,
      allergenes: item.nutrition.allergenes,
      temps: item.nutrition.temps,
    } : {
      id: '',
      name: '',
      category: '',
      shortDesc: '',
      fullDesc: '',
      price: 0,
      image2D: '',
      modelUrl: '',
      dimensions: '',
      calories: 0,
      allergenes: [],
      temps: '',
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const path = `menu/${Date.now()}_${file.name}`;
      const url = await storageService.uploadImage(file, path);
      setValue('image2D', url);
    } catch (error) {
      alert('Erreur lors de l\'upload de l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (data: MenuItemFormData) => {
    try {
      const menuItemData = {
        id: data.id,
        name: data.name,
        category: data.category,
        shortDesc: data.shortDesc,
        fullDesc: data.fullDesc,
        price: data.price,
        image2D: data.image2D,
        modelUrl: data.modelUrl || '',
        dimensions: data.dimensions,
        nutrition: {
          calories: data.calories,
          allergenes: data.allergenes,
          temps: data.temps,
        },
        variants,
        hotspots,
      };

      if (item) {
        await updateMenuItem(item.id, menuItemData);
      } else {
        await createMenuItem(menuItemData as Partial<MenuItem> & { id: string });
      }

      onSuccess();
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {item ? 'Modifier le plat' : 'Nouveau plat'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID *
              </label>
              <input
                {...register('id')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                placeholder="pizza-01"
              />
              {errors.id && <p className="text-red-500 text-sm mt-1">{errors.id.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom *
              </label>
              <input
                {...register('name')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie *
              </label>
              <input
                {...register('category')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix (€) *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description courte *
            </label>
            <input
              {...register('shortDesc')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
            {errors.shortDesc && <p className="text-red-500 text-sm mt-1">{errors.shortDesc.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description complète *
            </label>
            <textarea
              {...register('fullDesc')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
            {errors.fullDesc && <p className="text-red-500 text-sm mt-1">{errors.fullDesc.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image 2D *
            </label>
            <div className="flex gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {uploadingImage ? 'Upload...' : 'Upload Image'}
              </label>
              <input
                {...register('image2D')}
                placeholder="URL de l'image"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
            {errors.image2D && <p className="text-red-500 text-sm mt-1">{errors.image2D.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Modèle 3D (.glb / .gltf)
            </label>
            <p className="text-sm text-gray-500 mb-2">
              Téléversez un fichier .glb ou .gltf pour le modèle 3D du plat.
            </p>
            <ModelUploader
              onUploadComplete={(url) => setValue('modelUrl', url || '')}
              currentUrl={watch('modelUrl') || ''}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dimensions *
            </label>
            <input
              {...register('dimensions')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
            {errors.dimensions && <p className="text-red-500 text-sm mt-1">{errors.dimensions.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calories
              </label>
              <input
                type="number"
                {...register('calories', { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temps de préparation
              </label>
              <input
                {...register('temps')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <VariantManager variants={variants} onChange={setVariants} />

          {watch('modelUrl') && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Éditeur de hotspots
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Cliquez sur le modèle 3D pour placer des points d'intérêt interactifs.
              </p>
              <HotspotEditor
                modelUrl={watch('modelUrl') || ''}
                hotspots={hotspots}
                onChange={setHotspots}
              />
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
