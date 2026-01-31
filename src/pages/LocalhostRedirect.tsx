import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '../lib/logger';

/**
 * Page de redirection pour intercepter les liens localhost et les rediriger vers la production
 * Cette page détecte si l'application est accédée via localhost avec des tokens d'authentification
 * et redirige automatiquement vers l'URL de production avec les mêmes paramètres
 */
export const LocalhostRedirect = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'redirecting' | 'error'>('checking');
  const [message, setMessage] = useState('Vérification de l\'URL...');

  useEffect(() => {
    const handleRedirect = () => {
      try {
        // Vérifier si on est sur localhost
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

        if (!isLocalhost) {
          // Si on n'est pas sur localhost, rediriger vers la page d'accueil
          navigate('/');
          return;
        }

        // URL de production
        const productionUrl = 'https://web-menu-ar.vercel.app';

        // Extraire les paramètres de l'URL actuelle
        const hash = window.location.hash;
        const queryParams = window.location.search;

        // Construire la nouvelle URL avec les mêmes paramètres
        let redirectUrl = `${productionUrl}/auth/callback`;

        // Si on a des paramètres dans le hash (access_token, etc.)
        if (hash && hash.length > 1) {
          // Les tokens sont dans le hash, on les passe en query params pour la redirection
          const hashParams = new URLSearchParams(hash.substring(1));
          const queryParamsObj = new URLSearchParams(queryParams);
          
          // Copier tous les paramètres du hash vers les query params
          hashParams.forEach((value, key) => {
            queryParamsObj.set(key, value);
          });

          redirectUrl += `?${queryParamsObj.toString()}`;
        } else if (queryParams) {
          // Si on a des query params, les conserver
          redirectUrl += queryParams;
        }

        setStatus('redirecting');
        setMessage('Redirection vers la production...');

        // Rediriger vers la production
        window.location.href = redirectUrl;
      } catch (error: any) {
        logger.error('Erreur lors de la redirection:', error);
        setStatus('error');
        setMessage(`Erreur: ${error.message || 'Une erreur est survenue'}`);
        
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };

    handleRedirect();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'checking' && (
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            </div>
          )}
          {status === 'redirecting' && (
            <div className="mb-4">
              <div className="animate-pulse rounded-full h-12 w-12 bg-amber-100 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          )}
          {status === 'error' && (
            <div className="mb-4">
              <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'checking' && 'Vérification...'}
            {status === 'redirecting' && 'Redirection...'}
            {status === 'error' && 'Erreur'}
          </h2>
          <p className="text-gray-600">{message}</p>
          {status === 'redirecting' && (
            <p className="text-sm text-gray-500 mt-4">
              Vous allez être redirigé vers la version de production...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
