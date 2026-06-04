import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as Icons from 'lucide-react';
import content from '../content.json';
import { useShop } from '../context/ShopContext';
import QuickViewModal from '../components/QuickViewModal';
import LottieAnimation from '../components/premium/LottieAnimation';

export default function Store() {
  const { addToCart, products, formatImageUrl, toggleWishlist, isInWishlist } = useShop();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [viewMode, setViewMode] = useState('grid');
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [maxPrice, setMaxPrice] = useState(30000);

  const brands = ['All', 'Nike', 'Adidas', 'Jordan', 'Puma', 'Reebok', 'Asics', 'New Balance', 'Under Armour'];

  useEffect(() => {
    const brandParam = searchParams.get('brand');
    const categoryParam = searchParams.get('category');
    
    if (brandParam) {
      const matchedBrand = brands.find(b => b.toLowerCase() === brandParam.toLowerCase());
      if (matchedBrand) setActiveFilter(matchedBrand);
    } else if (categoryParam) {
      setActiveFilter(categoryParam);
    }
  }, [searchParams]);

  const [sortBy, setSortBy] = useState('newest');
  const [onlyInStock, setOnlyInStock] = useState(false);

  const filteredProducts = products.filter(product => {
    const brandMatch = activeFilter === 'All' || 
                       product.brand.toLowerCase() === activeFilter.toLowerCase();
    const searchMatch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
    const priceMatch = product.price <= maxPrice;
    const stockMatch = !onlyInStock || product.stock > 0;
    return brandMatch && searchMatch && priceMatch && stockMatch;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'newest') return b.id - a.id;
    return 0;
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const hasActiveFilters = activeFilter !== 'All' || searchQuery !== '' || onlyInStock === true || maxPrice !== 30000;

  const handleFreshStart = () => {
    setActiveFilter('All');
    setSearchQuery('');
    setOnlyInStock(false);
    setMaxPrice(30000);
    setSortBy('newest');
    setSearchParams({});
  };

  return (
    <div className="pb-16 bg-white min-h-screen">
      {/* Header Area */}
      <section className="relative h-[100px] sm:h-[120px] flex items-center bg-gray-50 overflow-hidden border-b border-gray-100">
         <div 
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{ backgroundImage: `url('/store_hero.png')` }}
         />
         <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
         
         <div className="relative z-10 w-full text-center px-4 sm:px-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase text-gray-900 tracking-tighter leading-none mb-1 sm:mb-2">
              THE <span className="text-[#ff3366]">STORE</span>
            </h1>
            <nav className="flex justify-center items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
               <Link to="/" className="hover:text-gray-900 transition-colors">HOME</Link>
               <span className="w-1 h-1 rounded-full bg-gray-200" />
               <span className="text-[#ff3366]">MASTERPIECES</span>
            </nav>
         </div>
      </section>

      <section className="py-2 mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="max-w-[1400px] mx-auto py-4 sm:py-6 flex flex-col md:flex-row gap-4 sm:gap-6 lg:gap-10">
        
        {/* Mobile Filter Toggle & Quick Brand Bar */}
        <div className="md:hidden space-y-3 mb-4">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
               {brands.map(brand => (
                 <button 
                  key={brand}
                  onClick={() => setActiveFilter(brand)}
                  className={`whitespace-nowrap px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeFilter === brand ? 'bg-rose-500 border-rose-500 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400'}`}
                 >
                   {brand}
                 </button>
               ))}
            </div>
            <button 
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              <Icons.SlidersHorizontal size={16} />
              {mobileSidebarOpen ? "Hide Filters" : "Advanced Filters"}
            </button>
        </div>

        {/* Sidebar Filters - Shared for Desktop and Mobile (toggled) */}
        <aside className={`${mobileSidebarOpen ? 'block' : 'hidden'} md:block md:w-64 flex-shrink-0 space-y-10 sticky top-24 self-start bg-white z-40`}>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">Quick Search</h4>
                <div className="relative group">
                  <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#ff3366] transition-colors" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search masterpiece..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-semibold outline-none focus:bg-white focus:border-[#ff3366] transition-all"
                  />
                </div>
              </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Availability</h4>
                  <button 
                    onClick={() => setOnlyInStock(!onlyInStock)}
                    className={`w-10 h-5 rounded-full transition-all relative ${onlyInStock ? 'bg-rose-500' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${onlyInStock ? 'left-6' : 'left-1'}`} />
                  </button>
               </div>
               <p className="text-[10px] font-bold text-gray-400 uppercase">Show only in-stock shoes</p>
            </div>

            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">Select Brand</h4>
              <ul className="space-y-2">
                {brands.map(brand => {
                  const count = brand === 'All' ? products.length : products.filter(p => p.brand.toLowerCase() === brand.toLowerCase()).length;
                  return (
                  <li key={brand}>
                    <button 
                      onClick={() => { setActiveFilter(brand); if(window.innerWidth < 768) setMobileSidebarOpen(false); }}
                      className={`flex items-center justify-between w-full text-[11px] py-2 px-3 rounded-xl font-black tracking-widest uppercase transition-all ${activeFilter === brand ? 'bg-rose-50 text-[#ff3366]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                      <span>{brand}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-md ${activeFilter === brand ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-400'}`}>{count}</span>
                    </button>
                  </li>
                  );
                })}
              </ul>
            </div>
            
            <div>
              <div className="flex justify-between items-end mb-4">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Budget Range</h4>
                 <span className="text-xs font-black text-gray-950">₹{maxPrice.toLocaleString()}</span>
              </div>
              <input 
                 type="range" 
                 min="0"
                 max="30000"
                 step="1000"
                 value={maxPrice}
                 onChange={(e) => setMaxPrice(Number(e.target.value))}
                 className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-rose-500" 
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleFreshStart}
                className="w-full mt-6 bg-[#ff3366] hover:bg-rose-600 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-200 active:scale-95 border border-rose-500"
              >
                <Icons.RotateCcw size={14} className="animate-spin-slow" /> Fresh Start
              </button>
            )}
          </aside>

          {/* Product Feed */}
          <div className="flex-1">
             <div className="flex flex-col sm:flex-row items-center justify-between mb-4 pb-3 border-b border-gray-100 gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center sm:text-left">
                  SHOWING <span className="text-[#ff3366]">{filteredProducts.length}</span> CURATED MASTERPIECES
                </p>
                
                <div className="flex items-center gap-3 sm:gap-4 justify-center w-full sm:w-auto">
                  <div className="flex bg-gray-50 p-1 rounded-xl">
                      <button onClick={()=>setViewMode('grid')} className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#ff3366]' : 'text-gray-400'}`}><Icons.LayoutGrid size={16} /></button>
                      <button onClick={()=>setViewMode('list')} className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-white shadow-sm text-[#ff3366]' : 'text-gray-400'}`}><Icons.List size={16} /></button>
                  </div>
                  <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">SORT BY:</span>
                      <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-transparent text-[10px] font-black uppercase tracking-widest text-gray-900 outline-none cursor-pointer"
                      >
                        <option value="newest">NEWEST FIRST</option>
                        <option value="price-low">PRICE: LOW TO HIGH</option>
                        <option value="price-high">PRICE: HIGH TO LOW</option>
                      </select>
                  </div>
               </div>
            </div>

             <div className={viewMode === 'grid' ? "grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6" : "space-y-4 sm:space-y-6"}>
              {filteredProducts.map((product) => {
                const isLowStock = product.stock > 0 && product.stock <= 10;
                const isTrending = product.id % 3 === 0; // Simulated trending status
                const viewingCount = Math.floor(Math.random() * 8) + 2;

                return (
                <div key={product.id} className="group relative border border-gray-100 rounded-[28px] overflow-hidden hover:shadow-2xl transition-all duration-500 p-2 bg-white flex flex-col">
                    <div className="relative group/card overflow-hidden rounded-[20px]">
                       {/* Trending Badge */}
                       {isTrending && (
                         <div className="absolute left-3 top-3 z-20 bg-rose-500 text-white text-[8px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-rose-200 animate-pulse">
                            TRENDING 🔥
                         </div>
                       )}

                       <button 
                         onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product.id); }}
                         className="absolute right-3 top-3 z-20 p-2 bg-white md:bg-white/90 md:backdrop-blur-md rounded-xl shadow-sm hover:scale-110 transition-all duration-300 opacity-100 lg:opacity-0 lg:group-hover/card:opacity-100 border border-gray-100"
                       >
                         <Icons.Heart size={14} className={isInWishlist(product.id) ? "fill-[#ff3366] text-[#ff3366]" : "text-gray-400 hover:text-gray-900"} />
                       </button>

                       <div 
                          onClick={() => setQuickViewProduct(product)}
                          className="relative bg-[#f0f0f0] aspect-square flex items-center justify-center p-2 cursor-pointer group-hover/card:bg-[#e8e8e8] transition-colors"
                       >
                           <img 
                              src={formatImageUrl(product.image)} 
                              alt={product.title} 
                              className="w-full h-full object-contain md:drop-shadow-2xl group-hover/card:scale-110 group-hover/card:-rotate-6 transition-all duration-700 will-change-transform"
                              loading="lazy"
                              decoding="async"
                           />
                           
                           {/* Dynamic Stock Badge */}
                           <div className={`absolute left-3 bottom-3 px-3 py-1.5 rounded-full shadow-md border ${
                             isLowStock ? 'bg-rose-50 border-rose-100 text-[#ff3366]' : 'bg-white border-gray-100 text-gray-900'
                           }`}>
                               <span className="text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                                 {isLowStock && <div className="w-1.5 h-1.5 rounded-full bg-[#ff3366] animate-ping" />}
                                 {isLowStock ? `ONLY ${product.stock} LEFT!` : `${product.stock || 25} IN STOCK`}
                               </span>
                           </div>

                           {/* Viewing Indicator */}
                           <div className="absolute right-3 bottom-3 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500">
                             <div className="bg-gray-900/10 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[8px] font-black text-gray-900 uppercase tracking-widest">{viewingCount} viewing</span>
                             </div>
                           </div>
                       </div>
                    </div>

                   <div className="p-4 text-center">
                       <p className="text-[8px] font-black uppercase tracking-widest text-[#ff3366] mb-1">{product.brand} · EXCLUSIVE</p>
                       <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 truncate mb-3">{product.title}</h3>
                       <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-gray-900 tracking-tighter">₹{product.price.toLocaleString()}</p>
                          <button 
                            onClick={(e) => { e.stopPropagation(); addToCart(product.id, 1); }}
                            className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center hover:bg-[#ff3366] hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-200 transition-all active:scale-90"
                          >
                             <Icons.Plus size={18} strokeWidth={3} />
                          </button>
                       </div>
                   </div>
                </div>
                );
              })}
            </div>
            
             {filteredProducts.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center">
                    <div className="w-64 h-64 mb-4">
                      <LottieAnimation 
                        src="/animations/no-results.json" 
                      />
                    </div>
                    <p className="text-lg font-bold text-gray-400 uppercase tracking-widest mb-6">No masterpieces found.</p>
                    <button
                      onClick={handleFreshStart}
                      className="bg-[#ff3366] hover:bg-rose-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-rose-200 active:scale-95"
                    >
                      <Icons.RotateCcw size={14} /> Fresh Start / Reset Filters
                    </button>
                </div>
             )}
          </div>
        </div>
      </section>

      {quickViewProduct && (
        <QuickViewModal 
          product={quickViewProduct} 
          onClose={() => setQuickViewProduct(null)} 
          showFullDetails={true}
        />
      )}
    </div>
  );
}
