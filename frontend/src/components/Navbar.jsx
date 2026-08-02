import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import content from '../content.json';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';

import { toast } from 'react-toastify';

export default function Navbar() {
  const { wishlistItems, getCartCount, getCartTotal, setIsCartOpen } = useShop();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [labsOpen, setLabsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Easter egg: 7 clicks on logo to open admin login
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);
  
  const handleLogoClick = (e) => {
    if (e) e.preventDefault();
    
    clickCountRef.current += 1;
    const currentCount = clickCountRef.current;
    
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    
    if (currentCount >= 7) {
      clickCountRef.current = 0;
      clickTimerRef.current = null;
      toast.info('🔑 Unlocking Admin Portal...', { autoClose: 2000 });
      const targetPath = user?.role === 'admin' ? '/admin' : '/admin-login';
      navigate(targetPath);
      return;
    }

    if (currentCount === 1 && location.pathname !== '/') {
      navigate('/');
    }

    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
      clickTimerRef.current = null;
    }, 2500);
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
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* ─── Site logo */}
        <div 
          onClick={handleLogoClick}
          className="cursor-pointer select-none group flex items-center shrink-0 mr-4"
        >
          <div className="flex items-center font-heading text-3xl md:text-4xl xl:text-3xl 2xl:text-4xl font-black tracking-tighter uppercase transition-transform group-hover:scale-105">
            <span className="text-rose-500">{content.header.logo.textHighlight1}</span>
            <span className="text-gray-900">{content.header.logo.textMain}</span>
            <span className="text-rose-500">{content.header.logo.textHighlight2}</span>
            <span className="text-gray-900">{content.header.logo.textEnd}</span>
          </div>
        </div>

        {/* ─── Desktop navigation menu */}
        <nav className="hidden lg:flex items-center gap-2 lg:gap-4 2xl:gap-7 flex-1 justify-center min-w-0 px-2">
          {content.header.menu.map((item) => (
            <NavLink
              key={item.label}
              to={item.label === 'Home' ? '/' : `/${item.label.toLowerCase()}`}
              className={({ isActive }) =>
                `text-[12px] 2xl:text-[14px] font-black uppercase tracking-wider transition-all relative py-2 outline-none focus:outline-none whitespace-nowrap ${
                  isActive ? 'text-rose-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-rose-500 after:rounded-full after:shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'text-gray-900 hover:text-rose-500'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {/* ─── Premium Experience Labs Dropdown */}
          <div 
            className="relative shrink-0" 
            onMouseEnter={() => setLabsOpen(true)} 
            onMouseLeave={() => setLabsOpen(false)}
          >
            <button 
              className={`text-[11px] 2xl:text-xs font-black uppercase tracking-wider text-rose-600 bg-rose-50/70 hover:bg-rose-100/80 border border-rose-100/70 px-3 2xl:px-3.5 py-1.5 rounded-full transition-all duration-300 flex items-center justify-center gap-1.5 hover:scale-[1.03] active:scale-95 shrink-0 outline-none focus:outline-none cursor-pointer shadow-sm hover:shadow ${labsOpen ? 'bg-rose-100/85' : ''}`}
            >
              <Icons.Sparkles size={12} className="animate-pulse text-rose-500" />
              <span>{content.header.labels.interactiveLabs}</span>
              <Icons.ChevronDown size={12} className={`transition-transform duration-300 ${labsOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu with Premium Glassmorphism */}
            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 py-2 transition-all duration-300 z-50 origin-top ${labsOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible'}`}>
              <button 
                onClick={() => { setLabsOpen(false); window.dispatchEvent(new CustomEvent('open-design-lab')); }}
                className="w-full px-4 py-2.5 text-left hover:bg-rose-50/50 flex items-center gap-3 transition-colors group"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 border border-rose-100 text-rose-500 shadow-sm shrink-0">
                  <Icons.Sparkles size={14} className="animate-pulse" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-900 group-hover:text-[#ff3366]">{content.header.labels.designLab}</div>
                  <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">{content.header.labels.sneakerCustomizer}</div>
                </div>
              </button>
            </div>
          </div>
        </nav>

        {/* ─── Action icons & Mobile Menu ─── */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4 2xl:gap-5 shrink-0">

          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            className="group relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl transition-all hover:bg-gray-50 border border-transparent hover:border-gray-100"
            title="Search (Ctrl+K)"
          >
            <Icons.Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-900 group-hover:text-rose-500 transition-colors" />
            <div className="absolute -bottom-1 -right-1 hidden lg:flex h-4 w-4 items-center justify-center rounded-md bg-white border border-gray-200 shadow-sm">
               <span className="text-[8px] font-black text-gray-400">K</span>
            </div>
          </button>

          <Link 
            to={
              !user ? "/login" : 
              user.role === 'admin' ? "/admin" : 
              user.role === 'driver' ? "/driver" : 
              "/dashboard"
            } 
            className="group relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl transition-all hover:bg-gray-50"
          >
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
        <div 
          onClick={(e) => {
            setMenuOpen(false);
            handleLogoClick(e);
          }}
          className="cursor-pointer select-none text-2xl font-bold text-black"
        >
          <span className="text-rose-500">{content.header.logo.textHighlight1}</span>
          {content.header.logo.textMain}
          <span className="text-rose-500">{content.header.logo.textHighlight2}</span>
          {content.header.logo.textEnd}
        </div>

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
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-6 font-heading">{content.header.labels.myAccount}</h4>
          
          <Link 
            to={
              !user ? "/login" : 
              user.role === 'admin' ? "/admin" : 
              user.role === 'driver' ? "/driver" : 
              "/dashboard"
            } 
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-4 text-gray-800 hover:text-rose-500 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border border-gray-100">
              <Icons.User size={20} className={user ? 'text-rose-500' : ''} />
            </div>
            <span className="font-bold tracking-wide">
              {!user ? "Login / Register" : 
               user.role === 'admin' ? "Admin Dashboard" : 
               user.role === 'driver' ? "Driver Dashboard" : 
               "My Dashboard"}
            </span>
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
            <span className="font-bold tracking-wide">{content.header.labels.myWishlist}</span>
          </Link>
        </div>

        {/* ─── Mobile Interactive Labs Section */}
        <div className="mt-8 space-y-4 border-t border-gray-100 pt-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-4 font-heading">{content.header.labels.interactiveLabs}</h4>
          
          <button 
            onClick={() => { setMenuOpen(false); window.dispatchEvent(new CustomEvent('open-design-lab')); }}
            className="flex items-center gap-4 w-full text-left text-gray-800 hover:text-rose-500 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 border border-rose-100 shadow-sm text-rose-500 shrink-0">
              <Icons.Sparkles size={18} className="animate-pulse" />
            </div>
            <span className="font-bold tracking-wide">{content.header.labels.designLabCustomizer}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
