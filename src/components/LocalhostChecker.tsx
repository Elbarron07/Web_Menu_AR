import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Composant qui vérifie si on est sur localhost avec des tokens d'authentification
 * et redirige automatiquement vers la production si nécessaire
 */
export const LocalhostChecker = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si on est sur localhost
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    // Si on n'est pas sur localhost, ne rien faire
    if (!isLocalhost) {
      return;
    }

    // Vérifier si on a des tokens d'authentification dans l'URL (hash ou query params)
    const hasHashTokens = window.location.hash.includes('access_token');
    const hasQueryTokens = window.location.search.includes('token') || 
                          window.location.search.includes('access_token');

    // Si on a des tokens et qu'on est sur localhost, rediriger vers la page de redirection
    if ((hasHashTokens || hasQueryTokens) && location.pathname !== '/localhost-redirect') {
      navigate('/localhost-redirect', { replace: true });
    }
  }, [location, navigate]);

  return null; // Ce composant ne rend rien
};
