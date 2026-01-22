import { supabase } from './supabase';

const BUCKET_GLB = '3d-models';
const BUCKET_IMAGES = 'images';

/**
 * Nettoie le nom de fichier pour qu'il soit compatible avec Supabase Storage
 * - Supprime les accents et caractères spéciaux
 * - Remplace les espaces par des underscores
 * - Garde uniquement les caractères alphanumériques, tirets, underscores et points
 */
function sanitizeFileName(fileName: string): string {
  // Séparer le nom et l'extension
  const lastDotIndex = fileName.lastIndexOf('.');
  const name = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';

  // Normaliser les caractères Unicode (supprimer les accents)
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les diacritiques
    .toLowerCase();

  // Remplacer les caractères non valides par des underscores
  const sanitized = normalized
    .replace(/[^a-z0-9._-]/g, '_') // Garder seulement alphanumériques, points, tirets, underscores
    .replace(/_{2,}/g, '_') // Remplacer les underscores multiples par un seul
    .replace(/^_+|_+$/g, ''); // Supprimer les underscores en début/fin

  return sanitized + extension;
}

export const storageService = {
  async uploadModel(file: File, path: string): Promise<string> {
    // Nettoyer le chemin pour éviter les caractères invalides
    const sanitizedPath = path.split('/').map(part => 
      part.includes('.') ? sanitizeFileName(part) : part
    ).join('/');

    // Déterminer le MIME type correct pour les fichiers GLB/GLTF
    let contentType = file.type;
    if (file.name.endsWith('.glb')) {
      contentType = 'model/gltf-binary';
    } else if (file.name.endsWith('.gltf')) {
      contentType = 'model/gltf+json';
    } else if (!contentType || contentType === 'application/octet-stream') {
      // Fallback si le navigateur ne détecte pas le type
      contentType = file.name.endsWith('.glb') 
        ? 'model/gltf-binary' 
        : 'model/gltf+json';
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_GLB)
      .upload(sanitizedPath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: contentType,
      });

    if (error) {
      // Message d'erreur plus explicite
      if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
        throw new Error('Le bucket "3d-models" n\'existe pas. Veuillez le créer dans Supabase Dashboard > Storage.');
      }
      if (error.message?.includes('mime type') || error.message?.includes('not supported')) {
        throw new Error(`Type MIME non supporté: ${contentType}. Assurez-vous que le bucket accepte "model/gltf-binary" et "application/octet-stream".`);
      }
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_GLB)
      .getPublicUrl(data.path);

    return publicUrl;
  },

  async uploadImage(file: File, path: string): Promise<string> {
    // Nettoyer le chemin pour éviter les caractères invalides
    const sanitizedPath = path.split('/').map(part => 
      part.includes('.') ? sanitizeFileName(part) : part
    ).join('/');

    const { data, error } = await supabase.storage
      .from(BUCKET_IMAGES)
      .upload(sanitizedPath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_IMAGES)
      .getPublicUrl(data.path);

    return publicUrl;
  },

  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  },

  async uploadWithProgress(
    file: File,
    bucket: string,
    path: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // Nettoyer le chemin pour éviter les caractères invalides
      const sanitizedPath = path.split('/').map(part => 
        part.includes('.') ? sanitizeFileName(part) : part
      ).join('/');

      // Déterminer le MIME type correct selon le bucket et l'extension
      let contentType = file.type;
      if (bucket === BUCKET_GLB) {
        if (file.name.endsWith('.glb')) {
          contentType = 'model/gltf-binary';
        } else if (file.name.endsWith('.gltf')) {
          contentType = 'model/gltf+json';
        } else if (!contentType || contentType === 'application/octet-stream') {
          contentType = file.name.endsWith('.glb') 
            ? 'model/gltf-binary' 
            : 'model/gltf+json';
        }
      }

      // Supabase Storage gère automatiquement les uploads progressifs
      const result = await supabase.storage
        .from(bucket)
        .upload(sanitizedPath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: contentType,
        });

      if (result.error) {
        // Message d'erreur plus explicite
        if (result.error.message?.includes('Bucket not found') || result.error.message?.includes('not found')) {
          throw new Error(`Le bucket "${bucket}" n'existe pas. Veuillez le créer dans Supabase Dashboard > Storage.`);
        }
        if (result.error.message?.includes('Invalid key') || result.error.message?.includes('invalid')) {
          throw new Error(`Nom de fichier invalide. Le fichier "${file.name}" contient des caractères non autorisés. Le nom a été nettoyé automatiquement.`);
        }
        if (result.error.message?.includes('mime type') || result.error.message?.includes('not supported')) {
          throw new Error(`Type MIME non supporté: ${contentType}. Assurez-vous que le bucket accepte ce type de fichier.`);
        }
        throw result.error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(result.data.path);

      if (onProgress) onProgress(100);
      return publicUrl;
    } catch (error) {
      throw error;
    }
  },
};
