import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import LiveChat from './components/premium/LiveChat';
import DesignLab from './components/premium/DesignLab';
import CustomCursor from './components/premium/CustomCursor';

// Lazy-loaded pages — each page is only downloaded when first visited
const Home               = lazy(() => import('./pages/Home'));
const About              = lazy(() => import('./pages/About'));
const Collections        = lazy(() => import('./pages/Collections'));
const Store              = lazy(() => import('./pages/Store'));
const Blog               = lazy(() => import('./pages/Blog'));
const Contact            = lazy(() => import('./pages/Contact'));
const Wishlist           = lazy(() => import('./pages/Wishlist'));
const Checkout           = lazy(() => import('./pages/Checkout'));
const Login              = lazy(() => import('./pages/Login'));
const Register           = lazy(() => import('./pages/Register'));
const UserDashboard      = lazy(() => import('./pages/UserDashboard'));
const AdminLogin         = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard     = lazy(() => import('./pages/AdminDashboard'));
const DriverDashboard    = lazy(() => import('./pages/DriverDashboard'));
const MensFootwear       = lazy(() => import('./pages/MensFootwear'));
const ProductDetails     = lazy(() => import('./pages/ProductDetails'));
const WomensFootwear     = lazy(() => import('./pages/WomensFootwear'));
const SportsFootwear     = lazy(() => import('./pages/SportsFootwear'));
const CollectionExplore  = lazy(() => import('./pages/CollectionExplore'));
const ForgotPassword     = lazy(() => import('./pages/ForgotPassword'));
const TrackOrder         = lazy(() => import('./pages/TrackOrder'));
const Privacy            = lazy(() => import('./pages/Privacy'));
const Terms              = lazy(() => import('./pages/Terms'));

// Minimal page-transition fallback — appears for <100ms on fast connections
function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-gray-100 border-t-rose-500 rounded-full animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Loading</span>
      </div>
    </div>
  );
}

import { useShop, API } from './context/ShopContext';


function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

export default function App() {
  const { products, addToCart } = useShop();
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [isDesignLabOpen, setIsDesignLabOpen] = useState(false);

  // One-time cleanup and event binders
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');

    // Background pre-warm call to wake up Render + Neon DB immediately
    fetch(`${API}/api/ping`).catch(() => {});

    const handleOpenDesignLab = () => setIsDesignLabOpen(true);

    window.addEventListener('open-design-lab', handleOpenDesignLab);

    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setShowSplash(false), 1000);
    }, 3000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('open-design-lab', handleOpenDesignLab);
    };
  }, []);

  return (
    <>
      <CustomCursor />
      {showSplash && (
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505] transition-opacity duration-1000 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
          
          {/* Abstract Elegant Shoe Line Art */}
          <div className="relative w-64 h-64 mb-4 flex items-center justify-center">
            {/* Soft backdrop glow */}
            <div className="absolute inset-0 bg-rose-500/10 rounded-full blur-[60px] animate-pulse"></div>
            
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(244,63,94,0.4)] z-10">
              {/* Abstract sole */}
              <path d="M 20 70 Q 50 78 80 70" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" className="animate-[dash_3s_ease-in-out_infinite]" style={{strokeDasharray: 100, strokeDashoffset: 100}} />
              {/* Abstract heel */}
              <path d="M 20 70 Q 15 45 30 35" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" className="animate-[dash_3s_ease-in-out_infinite_0.3s]" style={{strokeDasharray: 100, strokeDashoffset: 100}} />
              {/* Abstract collar/tongue */}
              <path d="M 30 35 Q 50 45 65 50" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" className="animate-[dash_3s_ease-in-out_infinite_0.6s]" style={{strokeDasharray: 100, strokeDashoffset: 100}} />
              {/* Abstract toe box */}
              <path d="M 65 50 Q 85 55 80 70" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" className="animate-[dash_3s_ease-in-out_infinite_0.9s]" style={{strokeDasharray: 100, strokeDashoffset: 100}} />
              
              {/* Dynamic swoosh/detail */}
              <path d="M 35 55 Q 55 50 70 65" fill="none" stroke="url(#premiumGrad)" strokeWidth="2.5" strokeLinecap="round" className="animate-[dash_3s_ease-in-out_infinite_1.2s]" style={{strokeDasharray: 100, strokeDashoffset: 100}} />
              
              <defs>
                <linearGradient id="premiumGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#fda4af" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Typography */}
          <div className="flex items-center font-heading text-3xl md:text-5xl font-black tracking-[0.2em] uppercase">
            <span className="text-rose-500 transform transition-transform hover:scale-110">L</span>
            <span className="text-white tracking-widest font-light ml-1">aces & </span>
            <span className="text-rose-500 transform transition-transform hover:scale-110 ml-3">S</span>
            <span className="text-white tracking-widest font-light ml-1">oles</span>
          </div>
          
          <div className="text-gray-500 text-xs tracking-[0.4em] uppercase mt-4 font-light animate-pulse">
            Premium Boutique
          </div>
          
          {/* Minimalist Loading Line */}
          <div className="mt-12 w-48 h-[1px] bg-gray-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-rose-500 to-transparent w-full" style={{ animation: 'scanline 2s ease-in-out infinite' }}></div>
          </div>
          
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes dash {
              0% { stroke-dashoffset: 100; opacity: 0; }
              20% { opacity: 1; }
              80% { stroke-dashoffset: 0; opacity: 1; }
              100% { stroke-dashoffset: -100; opacity: 0; }
            }
            @keyframes scanline {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}} />
        </div>
      )}
      <Layout>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/store" element={<Store />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/mens-footwear" element={<MensFootwear />} />
          <Route path="/womens-footwear" element={<WomensFootwear />} />
          <Route path="/sports-footwear" element={<SportsFootwear />} />
          <Route path="/collection/:slug" element={<CollectionExplore />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          {/* Auth Routes */}
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
          <Route path="/admin-login" element={<GuestRoute><AdminLogin /></GuestRoute>} />

          {/* Protected Private Routes */}
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
          <Route path="/driver" element={<ProtectedRoute allowedRoles={['driver']}><DriverDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </Layout>
    <LiveChat />
    
    <DesignLab 
      isOpen={isDesignLabOpen} 
      onClose={() => setIsDesignLabOpen(false)} 
      onAddToCart={(item) => addToCart(item, 'UK 9')} 
    />

    </>
  );
}
