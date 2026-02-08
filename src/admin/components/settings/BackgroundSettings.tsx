import { useState } from 'react';
import { Upload, X, Image, Layers, Palette } from 'lucide-react';
import { storageService } from '../../../lib/storage';
import type { BackgroundMode } from '../../../lib/adminApi';

interface BackgroundSettingsProps {
  backgroundImages: string[];
  backgroundMode: BackgroundMode;
  onImagesChange: (images: string[]) => void;
  onModeChange: (mode: BackgroundMode) => void;
}

const modeOptions: { value: BackgroundMode; label: string; icon: React.ElementType; description: string }[] = [
  { 
    value: 'gradient', 
    label: 'Dégradé', 
    icon: Palette,
    description: 'Fond dégradé par défaut'
  },
  { 
    value: 'single', 
    label: 'Image unique', 
    icon: Image,
    description: 'Une seule image en arrière-plan'
  },
  { 
    value: 'carousel', 
    label: 'Carrousel', 
    icon: Layers,
    description: 'Rotation automatique des images'
  },
];

export const BackgroundSettings = ({
  backgroundImages,
  backgroundMode,
  onImagesChange,
  onModeChange,
}: BackgroundSettingsProps) => {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newImages: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `backgrounds/${Date.now()}_${file.name}`;
        const url = await storageService.uploadImage(file, path);
        newImages.push(url);
      }
      
      onImagesChange([...backgroundImages, ...newImages]);
    } catch (error) {
      alert('Erreur lors de l\'upload des images');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = backgroundImages.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...backgroundImages];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newImages.length) return;
    
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Arrière-plan du menu</h4>
        
        {/* Mode Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {modeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = backgroundMode === option.value;
            
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onModeChange(option.value)}
                className={`
                  p-4 rounded-xl border-2 transition-all text-left
                  ${isSelected 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                  }
                `}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${isSelected ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`font-medium ${isSelected ? 'text-primary-700 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                    {option.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Image Upload Section - Only show if not gradient mode */}
      {backgroundMode !== 'gradient' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {backgroundMode === 'single' ? 'Image d\'arrière-plan' : 'Images du carrousel'}
          </label>
          
          {/* Upload Button */}
          <div className="mb-4">
            <input
              type="file"
              accept="image/*"
              multiple={backgroundMode === 'carousel'}
              onChange={handleImageUpload}
              className="hidden"
              id="background-upload"
            />
            <label
              htmlFor="background-upload"
              className={`
                inline-flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600
                rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all
                ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <Upload className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">
                {uploading ? 'Upload en cours...' : 'Ajouter des images'}
              </span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Formats acceptés: JPG, PNG, WebP. Taille recommandée: 1920x1080px
            </p>
          </div>

          {/* Image Preview Grid */}
          {backgroundImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {backgroundImages.map((url, index) => (
                <div 
                  key={index} 
                  className="relative group aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600"
                >
                  <img
                    src={url}
                    alt={`Background ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {backgroundMode === 'carousel' && index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMoveImage(index, 'up')}
                        className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
                        title="Déplacer vers la gauche"
                      >
                        ←
                      </button>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600"
                      title="Supprimer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    {backgroundMode === 'carousel' && index < backgroundImages.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMoveImage(index, 'down')}
                        className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100"
                        title="Déplacer vers la droite"
                      >
                        →
                      </button>
                    )}
                  </div>
                  
                  {/* Index badge for carousel */}
                  {backgroundMode === 'carousel' && (
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {backgroundImages.length === 0 && (
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-8 text-center">
              <Image className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Aucune image ajoutée</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Cliquez sur "Ajouter des images" pour commencer
              </p>
            </div>
          )}

          {/* Single mode warning */}
          {backgroundMode === 'single' && backgroundImages.length > 1 && (
            <p className="text-sm text-amber-600 mt-3">
              Note: En mode "Image unique", seule la première image sera affichée.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
