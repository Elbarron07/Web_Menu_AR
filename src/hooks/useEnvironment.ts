import { useMemo } from 'react';

/**
 * Hook pour détecter l'environnement et obtenir l'URL de base
 */
export const useEnvironment = () => {
  const environment = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        isDevelopment: false,
        isProduction: true,
        baseUrl: import.meta.env.VITE_SITE_URL || 'https://web-menu-ar.vercel.app',
      };
    }

    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
    const isDevelopment = isLocalhost || import.meta.env.DEV;
    const isProduction = !isDevelopment;

    // En développement, utiliser localhost
    // En production, utiliser la variable d'environnement ou l'origine actuelle
    const baseUrl = isDevelopment
      ? window.location.origin
      : (import.meta.env.VITE_SITE_URL || window.location.origin);

    return {
      isDevelopment,
      isProduction,
      baseUrl,
      hostname,
    };
  }, []);

  return environment;
};
