import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { ThemeProvider } from './context/ThemeContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Categories } from './pages/Categories';
import { MenuManagement } from './pages/MenuManagement';
import { AssetManager } from './pages/AssetManager';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { CustomerTracking } from './pages/CustomerTracking';
import { DataAnalytics } from './pages/DataAnalytics';
import { QRCodes } from './pages/QRCodes';
import { adminRoute } from '../config/routes';

export const AdminRoutes = () => {
  return (
    <ThemeProvider>
    <Routes>
      <Route path="login" element={<Login />} />
      <Route
        path="dashboard"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path=""
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="categories"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Categories />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="menu"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <MenuManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="assets"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <AssetManager />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="analytics"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Analytics />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="settings"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Settings />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="customers"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <CustomerTracking />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="data-analytics"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <DataAnalytics />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="qr-codes"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <QRCodes />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={adminRoute()} replace />} />
    </Routes>
    </ThemeProvider>
  );
};
