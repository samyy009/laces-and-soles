import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { Search, X, ShoppingBag, ArrowRight, Star, Tag } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { products, formatImageUrl } = useShop();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Filter products based on query
  const filteredProducts = query.trim() === '' 
    ? products.slice(0, 4) // Show featured/recent if empty
    : products.filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) || 
        p.brand.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8);

  // Global listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };

    const handleOpenEvent = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleOpenEvent);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleOpenEvent);
    };
  }, []);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredProducts.length + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (filteredProducts.length + 1)) % (filteredProducts.length + 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex < filteredProducts.length) {
        goToProduct(filteredProducts[selectedIndex].id);
      } else {
        navigate(`/store?q=${encodeURIComponent(query)}`);
        setIsOpen(false);
      }
    }
  };

  const goToProduct = (id) => {
    navigate(`/product/${id}`);
    setIsOpen(false);
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-[8px] transition-opacity animate-in fade-in duration-300" 
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white/90 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-300">
        
        {/* Search Input Area */}
        <div className="p-6 border-b border-gray-100 flex items-center gap-4">
          <Search className="text-rose-500 animate-pulse" size={24} />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search shoes, brands, or collections... (Type 'Nike')"
            className="flex-1 bg-transparent border-none text-xl font-bold font-heading outline-none placeholder:text-gray-300 text-gray-900"
          />
          <div className="flex items-center gap-2">
            <span className="hidden sm:block px-2 py-1 bg-gray-100 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest">ESC to close</span>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-rose-50 rounded-xl transition-colors">
              <X size={20} className="text-gray-400 hover:text-rose-500" />
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
          {filteredProducts.length > 0 ? (
            <div className="space-y-2">
              <p className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                {query.trim() === '' ? 'Recommended for you' : `Results for "${query}"`}
              </p>
              
              {filteredProducts.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => goToProduct(product.id)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                    selectedIndex === index ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 -translate-y-0.5' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center p-2 shadow-inner ${selectedIndex === index ? 'bg-white/20' : 'bg-gray-100'}`}>
                    <img src={formatImageUrl(product.image)} alt="" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-black uppercase tracking-tight ${selectedIndex === index ? 'text-white' : 'text-gray-900'}`}>{product.title}</p>
                      {product.badge && (
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase ${selectedIndex === index ? 'bg-white text-rose-500' : 'bg-rose-500 text-white'}`}>
                          {product.badge}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedIndex === index ? 'text-rose-100' : 'text-gray-400'}`}>{product.brand}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${selectedIndex === index ? 'text-white' : 'text-gray-950'}`}>₹{product.price.toLocaleString()}</p>
                    <div className={`flex items-center justify-end gap-1 ${selectedIndex === index ? 'text-rose-100' : 'text-gray-400'}`}>
                       <Star size={10} fill="currentColor" />
                       <span className="text-[10px] font-black">4.9</span>
                    </div>
                  </div>
                </button>
              ))}

              {/* View all button */}
              <button
                onClick={() => { navigate(`/store?q=${encodeURIComponent(query)}`); setIsOpen(false); }}
                onMouseEnter={() => setSelectedIndex(filteredProducts.length)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all mt-4 border border-dashed ${
                  selectedIndex === filteredProducts.length ? 'bg-gray-900 text-white border-transparent' : 'bg-white border-gray-200 text-gray-500 hover:border-rose-500 hover:text-rose-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedIndex === filteredProducts.length ? 'bg-white/10' : 'bg-gray-50'}`}>
                    <ArrowRight size={16} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">View all search results</span>
                </div>
                <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">Enter</span>
              </button>
            </div>
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                <Search size={32} />
              </div>
              <div>
                <p className="text-lg font-black uppercase text-gray-900">No shoes found</p>
                <p className="text-xs font-bold text-gray-400">Try searching for "Jordan", "Nike", or "Men"</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-8">
           <div className="flex items-center gap-2">
              <Icons.MoveDown size={14} className="text-gray-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Navigate</span>
           </div>
           <div className="flex items-center gap-2">
              <Icons.CornerDownLeft size={14} className="text-gray-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Select</span>
           </div>
           <div className="flex items-center gap-2">
              <Icons.Zap size={14} className="text-rose-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Instant Results</span>
           </div>
        </div>
      </div>
    </div>
  );
}
