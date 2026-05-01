import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';

export default function Layout({ children }) {
  const [showGoTop, setShowGoTop] = useState(false);
  const { pathname } = useLocation();

  const isDashboard = pathname.startsWith('/admin') || pathname.startsWith('/driver');

  useEffect(() => {
    const handleScroll = () => {
      setShowGoTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white font-inter">
      {!isDashboard && <Navbar />}
      {!isDashboard && <CartDrawer />}
      <main className={`flex-grow ${!isDashboard ? 'pt-14' : ''} animate-fade-in`}>
        {children}
      </main>
      {!isDashboard && <Footer />}

      {/* ─── Scroll to top button */}
      {showGoTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'auto' })}
          aria-label="Go to top"
          className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-rose-500 text-white shadow-2xl transition-all hover:bg-rose-600 hover:-translate-y-2 active:scale-90"
        >
          <Icons.ArrowUp size={24} />
        </button>
      )}
    </div>
  );
}
