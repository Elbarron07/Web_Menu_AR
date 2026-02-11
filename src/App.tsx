import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './components/CartContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import DirectARView from './components/DirectARView';
import { AuthCallback } from './pages/AuthCallback';
import { NotFound } from './pages/NotFound';
import { LocalhostRedirect } from './pages/LocalhostRedirect';
import { LocalhostChecker } from './components/LocalhostChecker';
import { ARLayout } from './components/ARLayout';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { QRCodeResolver } from './components/QRCodeResolver';
import { ADMIN_PATH } from './config/routes';

// Lazy loading des routes admin (chunk separe)
const AdminRoutes = lazy(() => import('./admin/routes').then(m => ({ default: m.AdminRoutes })));

function App() {
  return (
    <ErrorBoundary>
      <CartProvider>
        <BrowserRouter>
          <ARLayout>
            <LocalhostChecker />
            <Routes>
              {/* Route de redirection pour localhost */}
              <Route path="/localhost-redirect" element={<LocalhostRedirect />} />

              {/* Route de callback pour les invitations Supabase */}
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Route QR Code - resolution et redirection */}
              <Route path="/q/:code" element={<QRCodeResolver />} />

              {/* Routes client */}
              <Route path="/" element={
                <div className="min-h-screen text-white font-sans selection:bg-amber-500 selection:text-black" style={{ background: 'transparent' }}>
                  <DirectARView />
                  <PWAInstallBanner />
                </div>
              } />
              <Route path="/menu/:categorySlug" element={
                <div className="min-h-screen text-white font-sans selection:bg-amber-500 selection:text-black" style={{ background: 'transparent' }}>
                  <DirectARView />
                  <PWAInstallBanner />
                </div>
              } />
              <Route path="/ar/:id" element={
                <div className="min-h-screen text-white font-sans selection:bg-amber-500 selection:text-black" style={{ background: 'transparent' }}>
                  <DirectARView />
                  <PWAInstallBanner />
                </div>
              } />

              {/* Routes admin - lazy loaded */}
              <Route path={`/${ADMIN_PATH}/*`} element={
                <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div></div>}>
                  <AdminRoutes />
                </Suspense>
              } />

              {/* 404 catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ARLayout>
        </BrowserRouter>
      </CartProvider>
    </ErrorBoundary>
  );
}

export default App;
