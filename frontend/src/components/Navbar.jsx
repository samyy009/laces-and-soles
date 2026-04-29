import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import content from '../content.json';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import Lordicon from './premium/Lordicon';

export default function Navbar() {
  const { wishlistItems, getCartCount, getCartTotal, setIsCartOpen } = useShop();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Easter egg: 7 clicks on logo to open admin login
  const [clickCount, setClickCount] = useState(0);
  const handleLogoClick = (e) => {
    e.preventDefault();
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount === 7) {
      navigate('/admin-login');
      setClickCount(0);
    } else {
      // Navigate to home immediately if not the 7th click
      navigate('/');
      
      // Reset counter if they stop clicking
      setTimeout(() => {
        setClickCount(0);
      }, 3000);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      navigate(`/store?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md py-1 shadow-lg border-b border-gray-100' : 'bg-transparent py-2 md:py-3'}`}>
      {/* ─── Global Search Overlay */}
      <div className={`absolute top-full left-0 w-full bg-white  border-b border-gray-100 shadow-2xl transition-all duration-300 origin-top ${searchOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'}`}>
        <form onSubmit={handleSearchSubmit} className="mx-auto max-w-7xl px-4 py-4 flex items-center gap-6">
          <Icons.Search className="text-gray-400 " size={24} />
          <input 
            type="text" 
            autoFocus={searchOpen}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search our premium collection..."
            className="flex-1 bg-transparent border-none text-xl font-bold font-heading outline-none placeholder:text-gray-300 text-gray-900 "
          />
          <button 
            type="button"
            onClick={() => setSearchOpen(false)}
            className="group rounded-xl p-2 hover:bg-rose-50 transition-colors"
          >
            <Icons.X size={24} className="text-gray-400  group-hover:text-rose-500" />
          </button>
        </form>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* ─── Site logo */}
        <div 
          onClick={handleLogoClick}
          className="cursor-pointer select-none group flex items-center"
        >
          <div className="flex items-center font-heading text-xl md:text-2xl font-black tracking-tighter uppercase transition-transform group-hover:scale-105">
            <span className="text-rose-500">{content.header.logo.textHighlight1}</span>
            <span className="text-gray-900">{content.header.logo.textMain}</span>
            <span className="text-rose-500">{content.header.logo.textHighlight2}</span>
            <span className="text-gray-900">{content.header.logo.textEnd}</span>
          </div>
        </div>

        {/* ─── Desktop navigation menu */}
        <nav className="hidden lg:flex items-center gap-10">
          {content.header.menu.map((item) => (
            <NavLink
              key={item.label}
              to={item.label === 'Home' ? '/' : `/${item.label.toLowerCase()}`}
              className={({ isActive }) =>
                `text-[11px] font-black uppercase tracking-[0.3em] transition-all relative py-2 ${
                  isActive ? 'text-rose-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-rose-500 after:rounded-full after:shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'text-gray-900  hover:text-rose-500'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* ─── Action icons & Mobile Menu ─── */}
        <div className="flex items-center gap-1 sm:gap-3 lg:gap-6">

          <button 
            onClick={() => setSearchOpen(!searchOpen)} 
            className="group relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl transition-all hover:bg-gray-50"
          >
            <Icons.Search className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${searchOpen ? 'text-rose-500' : 'text-gray-900 group-hover:text-rose-500'}`} />
          </button>

          <Link to={user ? "/dashboard" : "/login"} className="group relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl transition-all hover:bg-gray-50">
            <Icons.User className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${user ? 'text-rose-500' : 'text-gray-900 group-hover:text-rose-500'}`} />
          </Link>

          <Link to="/wishlist" className="group relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl transition-all hover:bg-gray-50">
            <Icons.Heart className="h-4 w-4 sm:h-5 sm:w-5 text-gray-900 transition-colors group-hover:text-rose-500" />
            {wishlistItems.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-gray-900 text-[8px] sm:text-[9px] text-white font-black ring-2 ring-white">
                {wishlistItems.length}
              </span>
            )}
          </Link>

          <button 
            onClick={() => setIsCartOpen(true)}
            className="group relative flex items-center gap-2 lg:gap-3 px-2 py-1.5 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5 rounded-xl lg:rounded-2xl bg-gray-900 text-white transition-all hover:bg-rose-500 hover:-translate-y-0.5 shadow-xl shadow-gray-200"
          >
            <Icons.ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
            <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">₹{getCartTotal().toFixed(2)}</span>
            {getCartCount() > 0 && (
              <span className="absolute -right-1.5 -top-1.5 sm:-right-2 sm:-top-2 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-rose-500 text-[9px] sm:text-[10px] text-white font-black ring-2 ring-white animate-bounce-subtle">
                {getCartCount()}
              </span>
            )}
          </button>

          {/* ─── Mobile menu toggle button */}
          <button
            className="lg:hidden rounded-xl bg-gray-900 p-1.5 sm:p-2.5 text-white shadow-xl transition-all hover:bg-rose-500 active:scale-90"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Icons.Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>
    </header>

      {/* ─── Mobile menu overlay */}
      {menuOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity" 
          onClick={() => setMenuOpen(false)} 
        />
      )}

      {/* ─── Mobile slide-out menu */}
      <aside
        className={`fixed left-0 top-0 z-[70] h-[100dvh] w-72 bg-white overflow-y-auto p-8 shadow-2xl transition-transform duration-500 ease-out ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          className="absolute right-6 top-6 text-gray-400  hover:text-rose-500 transition-colors"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          <Icons.X size={24} />
        </button>

        {/* ─── Mobile logo */}
        <Link to="/" className="text-2xl font-bold text-black " onClick={() => setMenuOpen(false)}>
          <span className="text-rose-500">{content.header.logo.textHighlight1}</span>
          {content.header.logo.textMain}
          <span className="text-rose-500">{content.header.logo.textHighlight2}</span>
          {content.header.logo.textEnd}
        </Link>

        {/* ─── Mobile navigation links */}
        <nav className="mt-12 space-y-6">
          {content.header.menu.map((item) => (
            <NavLink
              key={item.label}
              to={item.label === 'Home' ? '/' : `/${item.label.toLowerCase()}`}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block text-lg font-bold uppercase tracking-wide transition-colors ${
                  isActive ? 'text-rose-500 ml-2 border-l-4 border-rose-500 pl-3' : 'text-gray-800 '
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* ─── Mobile Quick Actions (Login / Wishlist) */}
        <div className="mt-12 space-y-4 border-t border-gray-100 pt-8">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-6 font-heading">My Account</h4>
          
          <Link 
            to={user ? "/dashboard" : "/login"} 
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-4 text-gray-800 hover:text-rose-500 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border border-gray-100">
              <Icons.User size={20} className={user ? 'text-rose-500' : ''} />
            </div>
            <span className="font-bold tracking-wide">{user ? "Dashboard" : "Login / Register"}</span>
          </Link>

          <Link 
            to="/wishlist" 
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-4 text-gray-800 hover:text-rose-500 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border border-gray-100 relative">
              <Icons.Heart size={20} />
              {wishlistItems.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-[10px] text-white font-black ring-2 ring-white">
                  {wishlistItems.length}
                </span>
              )}
            </div>
            <span className="font-bold tracking-wide">My Wishlist</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
