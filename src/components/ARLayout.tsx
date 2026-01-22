import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Composant wrapper pour les routes AR
 * Applique la classe 'ar-mode' au document HTML pour activer les styles AR
 */
export const ARLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  useEffect(() => {
    // Vérifier si on est sur une route AR
    const isARRoute = location.pathname === '/' || location.pathname.startsWith('/ar/');
    
    // Vérifier si on est sur une route admin ou autre route non-AR
    const isAdminRoute = location.pathname.startsWith('/admin/') || 
                         location.pathname.startsWith('/auth/') ||
                         location.pathname.startsWith('/localhost-redirect');

    if (isARRoute) {
      // Ajouter la classe ar-mode au document HTML
      document.documentElement.classList.add('ar-mode');
      document.body.classList.add('ar-mode');
    } else if (isAdminRoute || !isARRoute) {
      // Retirer la classe ar-mode si on est sur une route admin ou autre route non-AR
      document.documentElement.classList.remove('ar-mode');
      document.body.classList.remove('ar-mode');
    }

    // Nettoyer lors du démontage
    return () => {
      // Ne retirer la classe que si on quitte vraiment une route AR
      if (isARRoute) {
        document.documentElement.classList.remove('ar-mode');
        document.body.classList.remove('ar-mode');
      }
    };
  }, [location.pathname]);

  return <>{children}</>;
};
