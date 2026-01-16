import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './components/CartContext';
import DirectARView from './components/DirectARView';
// Navbar and other components are intentionally omitted for the Zero-Friction experience

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-amber-500 selection:text-black">
          <Routes>
            <Route path="/" element={<DirectARView />} />
            <Route path="/ar/:id" element={<DirectARView />} />
          </Routes>
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
