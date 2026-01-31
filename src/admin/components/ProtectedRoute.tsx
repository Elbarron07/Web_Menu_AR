import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { adminRoute } from '../../config/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'super_admin';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAdmin, adminUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-main">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to={adminRoute('login')} replace state={{ from: location }} />;
  }

  // Verifier le role si requis
  if (requiredRole === 'super_admin' && adminUser?.role !== 'super_admin') {
    return <Navigate to={adminRoute()} replace />;
  }

  return <>{children}</>;
};
