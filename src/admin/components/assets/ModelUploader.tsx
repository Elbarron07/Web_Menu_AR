import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';
import { storageService } from '../../../lib/storage';

interface ModelUploaderProps {
  onUploadComplete: (url: string) => void;
  currentUrl?: string;
}

export const ModelUploader = ({ onUploadComplete, currentUrl }: ModelUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(currentUrl || null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.endsWith('.glb') && !file.name.endsWith('.gltf')) {
      alert('Seuls les fichiers .glb et .gltf sont acceptés');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const path = `models/${Date.now()}_${file.name}`;
      const url = await storageService.uploadWithProgress(
        file,
        '3d-models',
        path,
        (prog) => setProgress(prog)
      );
      
      setUploadedUrl(url);
      onUploadComplete(url);
    } catch (error: any) {
      alert(`Erreur lors de l'upload: ${error.message}`);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'model/gltf-binary': ['.glb'],
      'model/gltf+json': ['.gltf'],
    },
    maxFiles: 1,
  });

  const handleRemove = () => {
    setUploadedUrl(null);
    onUploadComplete('');
  };

  return (
    <div className="space-y-4">
      {uploadedUrl ? (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <File className="w-8 h-8 text-purple-500" />
              <div>
                <p className="font-medium text-gray-900">Modèle uploadé</p>
                <p className="text-sm text-gray-500 truncate max-w-md">{uploadedUrl}</p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-amber-500 bg-amber-50'
              : 'border-gray-300 hover:border-amber-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700 font-medium mb-2">
            {isDragActive ? 'Déposez le fichier ici' : 'Glissez un fichier .glb ici'}
          </p>
          <p className="text-sm text-gray-500">ou cliquez pour sélectionner</p>
          {uploading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">{progress}%</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
