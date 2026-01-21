import { supabase } from './supabase';

const BUCKET_GLB = '3d-models';
const BUCKET_IMAGES = 'images';

export const storageService = {
  async uploadModel(file: File, path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET_GLB)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_GLB)
      .getPublicUrl(data.path);

    return publicUrl;
  },

  async uploadImage(file: File, path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET_IMAGES)
      .upload(path, file, {
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
      // Supabase Storage gère automatiquement les uploads progressifs
      const result = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (result.error) throw result.error;

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
