/**
 * Configuration des routes admin
 * Le chemin est configurable via la variable d'environnement VITE_ADMIN_PATH
 */

export const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || 'console';

/**
 * Helper pour construire les routes admin
 * @param path - Sous-chemin optionnel (ex: 'login', 'dashboard')
 * @returns Route complete (ex: '/console/login')
 */
export const adminRoute = (path: string = ''): string => {
  if (!path) return `/${ADMIN_PATH}`;
  return `/${ADMIN_PATH}/${path}`;
};
