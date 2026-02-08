import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './components/CartContext';
import DirectARView from './components/DirectARView';
import { AuthCallback } from './pages/AuthCallback';
import { LocalhostRedirect } from './pages/LocalhostRedirect';
import { LocalhostChecker } from './components/LocalhostChecker';
import { ARLayout } from './components/ARLayout';
import { PWAInstallGate } from './components/PWAInstallGate';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { ADMIN_PATH } from './config/routes';

// Lazy loading des routes admin (chunk separe)
const AdminRoutes = lazy(() => import('./admin/routes').then(m => ({ default: m.AdminRoutes })));

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <ARLayout>
          <LocalhostChecker />
          <Routes>
          {/* Route de redirection pour localhost */}
          <Route path="/localhost-redirect" element={<LocalhostRedirect />} />
          
          {/* Route de callback pour les invitations Supabase */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Routes client - protegees par le gate PWA */}
          <Route path="/" element={
            <PWAInstallGate>
              <div className="min-h-screen text-white font-sans selection:bg-amber-500 selection:text-black" style={{ background: 'transparent' }}>
                <DirectARView />
                <PWAInstallBanner />
              </div>
            </PWAInstallGate>
          } />
          <Route path="/menu/:categorySlug" element={
            <PWAInstallGate>
              <div className="min-h-screen text-white font-sans selection:bg-amber-500 selection:text-black" style={{ background: 'transparent' }}>
                <DirectARView />
                <PWAInstallBanner />
              </div>
            </PWAInstallGate>
          } />
          <Route path="/ar/:id" element={
            <PWAInstallGate>
              <div className="min-h-screen text-white font-sans selection:bg-amber-500 selection:text-black" style={{ background: 'transparent' }}>
                <DirectARView />
                <PWAInstallBanner />
              </div>
            </PWAInstallGate>
          } />
          
          {/* Routes admin - lazy loaded */}
          <Route path={`/${ADMIN_PATH}/*`} element={
            <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div></div>}>
              <AdminRoutes />
            </Suspense>
          } />
          </Routes>
        </ARLayout>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
