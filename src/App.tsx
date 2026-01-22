import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './components/CartContext';
import DirectARView from './components/DirectARView';
import { AdminRoutes } from './admin/routes';
import { AuthCallback } from './pages/AuthCallback';
import { LocalhostRedirect } from './pages/LocalhostRedirect';
import { LocalhostChecker } from './components/LocalhostChecker';
import { ARLayout } from './components/ARLayout';
// Navbar and other components are intentionally omitted for the Zero-Friction experience

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
          
          {/* Routes client */}
          <Route path="/" element={
            <div className="min-h-screen text-white font-sans selection:bg-amber-500 selection:text-black" style={{ background: 'transparent' }}>
              <DirectARView />
            </div>
          } />
          <Route path="/ar/:id" element={
            <div className="min-h-screen text-white font-sans selection:bg-amber-500 selection:text-black" style={{ background: 'transparent' }}>
              <DirectARView />
            </div>
          } />
          
          {/* Routes admin */}
          <Route path="/admin/*" element={<AdminRoutes />} />
          </Routes>
        </ARLayout>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
