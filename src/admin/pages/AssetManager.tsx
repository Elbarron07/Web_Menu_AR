import { useState } from 'react';
import { Package, Upload } from 'lucide-react';
import { ModelUploader } from '../components/assets/ModelUploader';
import { HotspotEditor } from '../components/assets/HotspotEditor';

export const AssetManager = () => {
  const [modelUrl, setModelUrl] = useState('');
  const [hotspots, setHotspots] = useState<Array<{
    slot: string;
    pos: string;
    label: string;
    detail: string;
  }>>([]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Asset Manager 3D</h1>
        <p className="text-gray-600">Gérez vos modèles 3D et configurez les hotspots</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Upload className="w-6 h-6" />
            Upload de modèle 3D
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Téléversez vos fichiers .glb ou .gltf (modèles 3D)
          </p>
          <ModelUploader
            onUploadComplete={(url) => setModelUrl(url)}
            currentUrl={modelUrl}
          />
        </div>

        {modelUrl && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-6 h-6" />
              Éditeur de Hotspots
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Cliquez sur le modèle 3D pour placer des points d'intérêt interactifs
            </p>
            <HotspotEditor
              modelUrl={modelUrl}
              hotspots={hotspots}
              onChange={setHotspots}
            />
          </div>
        )}
      </div>
    </div>
  );
};
