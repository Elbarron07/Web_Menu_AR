/**
 * Logger conditionnel - n'affiche les logs qu'en mode developpement
 * Evite d'exposer des informations sensibles en production
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log de debug - uniquement en dev
   */
  debug: (...args: unknown[]): void => {
    if (isDev) console.debug(...args);
  },

  /**
   * Log d'information - uniquement en dev
   */
  info: (...args: unknown[]): void => {
    if (isDev) console.info(...args);
  },

  /**
   * Log d'avertissement - uniquement en dev
   */
  warn: (...args: unknown[]): void => {
    if (isDev) console.warn(...args);
  },

  /**
   * Log d'erreur - uniquement en dev
   * En production, les erreurs sont silencieuses pour eviter les fuites d'information
   */
  error: (...args: unknown[]): void => {
    if (isDev) console.error(...args);
  },
};

export default logger;
