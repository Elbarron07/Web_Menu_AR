import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MenuManagement } from './pages/MenuManagement';
import { AssetManager } from './pages/AssetManager';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';

export const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/menu"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <MenuManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/assets"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <AssetManager />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Analytics />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Settings />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};
