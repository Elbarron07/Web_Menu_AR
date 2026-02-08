import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export type BackgroundMode = 'gradient' | 'single' | 'carousel';

export interface RestaurantSettings {
  id?: string;
  name?: string;
  logo_url?: string;
  theme_color?: string;
  background_images?: string[];
  background_mode?: BackgroundMode;
}

// Cache pour eviter les requetes repetees
let settingsCache: RestaurantSettings | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useRestaurantSettings = () => {
  const [settings, setSettings] = useState<RestaurantSettings | null>(settingsCache);
  const [loading, setLoading] = useState(!settingsCache);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('restaurant_settings')
        .select('id, name, logo_url, theme_color, background_images, background_mode')
        .limit(1)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const result = data || {};

      // Mettre en cache
      settingsCache = result;
      cacheTimestamp = Date.now();

      setSettings(result);
      setError(null);
    } catch (err) {
      logger.error('Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Utiliser le cache si valide
    if (settingsCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
      setSettings(settingsCache);
      setLoading(false);
    } else {
      fetchSettings();
    }
  }, [fetchSettings]);

  // Abonnement realtime sur restaurant_settings
  useEffect(() => {
    const channel = supabase
      .channel('settings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_settings' },
        () => {
          // Invalider le cache et refetch
          settingsCache = null;
          cacheTimestamp = 0;
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSettings]);

  return { settings, loading, error };
};

// Fonction pour invalider le cache (utile apres une mise a jour)
export const invalidateSettingsCache = () => {
  settingsCache = null;
  cacheTimestamp = 0;
};
