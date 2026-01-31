import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Upload } from 'lucide-react';
import { adminApi, type BackgroundMode } from '../../../lib/adminApi';
import { storageService } from '../../../lib/storage';
import { logger } from '../../../lib/logger';
import { BackgroundSettings } from './BackgroundSettings';
import { invalidateSettingsCache } from '../../../hooks/useRestaurantSettings';

const settingsSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  logo_url: z.string().url().optional().or(z.literal('')),
  theme_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Couleur invalide'),
  qr_code_base_url: z.string().url().optional().or(z.literal('')),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export const RestaurantSettings = () => {
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [backgroundImages, setBackgroundImages] = useState<string[]>([]);
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('gradient');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: '',
      logo_url: '',
      theme_color: '#f59e0b',
      qr_code_base_url: window.location.origin,
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await adminApi.settings.getSettings();

        if (data) {
          setValue('name', data.name || '');
          setValue('logo_url', data.logo_url || '');
          setValue('theme_color', data.theme_color || '#f59e0b');
          setValue('qr_code_base_url', data.qr_code_base_url || window.location.origin);
          setBackgroundImages(data.background_images || []);
          setBackgroundMode(data.background_mode || 'gradient');
        }
      } catch (error) {
        logger.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [setValue]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const path = `logo/${Date.now()}_${file.name}`;
      const url = await storageService.uploadImage(file, path);
      setValue('logo_url', url);
    } catch (error) {
      alert('Erreur lors de l\'upload du logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const onSubmit = async (data: SettingsFormData) => {
    try {
      await adminApi.settings.updateSettings({
        name: data.name,
        logo_url: data.logo_url || undefined,
        theme_color: data.theme_color,
        qr_code_base_url: data.qr_code_base_url || undefined,
        background_images: backgroundImages,
        background_mode: backgroundMode,
      });
      invalidateSettingsCache();
      alert('Paramètres sauvegardés avec succès');
    } catch (error) {
      alert(`Erreur : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Chargement...</div>;
  }

  const logoUrl = watch('logo_url');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Paramètres du restaurant</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom du restaurant *
          </label>
          <input
            {...register('name')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo
          </label>
          <div className="flex items-center gap-4">
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-20 h-20 object-contain border border-gray-200 rounded-lg"
              />
            )}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                {uploadingLogo ? 'Upload...' : 'Upload Logo'}
              </label>
            </div>
          </div>
          <input
            {...register('logo_url')}
            placeholder="URL du logo"
            className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Couleur du thème
          </label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              {...register('theme_color')}
              className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
            />
            <input
              {...register('theme_color')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>
          {errors.theme_color && (
            <p className="text-red-500 text-sm mt-1">{errors.theme_color.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL de base pour QR Codes
          </label>
          <input
            {...register('qr_code_base_url')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            placeholder="https://votre-domaine.com"
          />
        </div>

        {/* Background Settings */}
        <div className="pt-6 border-t border-gray-200">
          <BackgroundSettings
            backgroundImages={backgroundImages}
            backgroundMode={backgroundMode}
            onImagesChange={setBackgroundImages}
            onModeChange={setBackgroundMode}
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {isSubmitting ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
};
