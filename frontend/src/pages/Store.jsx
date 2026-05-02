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

  const filteredProducts = products.filter(product => {
    const brandMatch = activeFilter === 'All' || 
                       product.brand.toLowerCase() === activeFilter.toLowerCase();
    const searchMatch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
    const priceMatch = product.price <= maxPrice;
    return brandMatch && searchMatch && priceMatch;
  });

  return (
    <div className="pb-16 bg-white min-h-screen">
      {/* Header Area - Reduced height for less scroll */}
      <section className="relative h-[120px] flex items-center bg-gray-50 overflow-hidden border-b border-gray-100">
         <div 
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{ backgroundImage: `url('/store_hero.png')` }}
         />
         <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
         
         <div className="relative z-10 w-full text-center px-6">
            <h1 className="text-2xl md:text-3xl font-black uppercase text-gray-900 tracking-tighter leading-none mb-2">
              THE <span className="text-[#ff3366]">STORE</span>
            </h1>
            <nav className="flex justify-center items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
               <Link to="/" className="hover:text-gray-900 transition-colors">HOME</Link>
               <span className="w-1 h-1 rounded-full bg-gray-200" />
               <span className="text-[#ff3366]">MASTERPIECES</span>
            </nav>
         </div>
      </section>

      <section className="py-2 mx-auto max-w-[1400px] px-6">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 py-6 flex flex-col md:flex-row gap-6 lg:gap-10">
        {/* Mobile Header for Filters/Summary */}
        <div className="md:hidden flex items-center justify-between bg-white  p-3 rounded-2xl border border-gray-100 shadow-sm mb-2">
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-1">
               {brands.slice(0, 5).map(brand => (
                 <button 
                  key={brand}
                  onClick={() => setActiveFilter(brand)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === brand ? 'bg-rose-500 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                 >
                   {brand}
                 </button>
               ))}
            </div>
        </div>

        {/* Sidebar Filters - Desktop only via md:block or similar */}
        <aside className="hidden md:block md:w-64 flex-shrink-0 space-y-6 sticky top-24 self-start">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">SEARCH CURATED</h4>
              <div className="relative">
                <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Find your masterpiece..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-2 pl-12 pr-4 text-sm font-semibold outline-none focus:border-[#ff3366] transition-colors"
                />
              </div>

            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">SELECT BRAND</h4>
              <ul className="space-y-1">
                {brands.map(brand => (
                  <li key={brand}>
                    <button 
                      onClick={() => setActiveFilter(brand)}
                      className={`flex items-center justify-between w-full text-[11px] py-1 font-black tracking-widest uppercase transition-colors ${activeFilter === brand ? 'text-[#ff3366]' : 'text-gray-900 hover:text-[#ff3366]'}`}
                    >
                      {brand}
                      {activeFilter === brand ? (
                        <div className="w-2 h-2 rounded-full bg-[#ff3366]" />
                      ) : (
                        <div className="w-1 h-1 rounded-full bg-gray-200" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Price Range placeholder from original logic */}
            <div>
              <div className="flex justify-between items-end mb-3">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">MAX PRICE</h4>
                 <span className="text-sm font-black text-gray-900">₹{maxPrice.toLocaleString()}</span>
              </div>
              <input 
                 type="range" 
                 min="0"
                 max="30000"
                 step="1000"
                 value={maxPrice}
                 onChange={(e) => setMaxPrice(Number(e.target.value))}
                 className="w-full accent-[#ff3366]" 
              />
            </div>
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
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-900">
                      SORT BY: NEWEST <Icons.ChevronDown size={14} />
                  </div>
               </div>
            </div>

             <div className={viewMode === 'grid' ? "grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6" : "space-y-4 sm:space-y-6"}>
              {filteredProducts.map((product) => (
                <div key={product.id} className="group relative border border-gray-100 rounded-[28px] overflow-hidden hover:shadow-xl transition-shadow duration-300 p-2 bg-white flex flex-col">
                    <div className="relative group/card overflow-hidden rounded-[20px]">
                       <button 
                         onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product.id); }}
                         className="absolute right-3 top-3 z-20 p-2 bg-white md:bg-white/90 md:backdrop-blur-md rounded-xl shadow-sm hover:scale-110 transition-opacity duration-300 opacity-100 lg:opacity-0 lg:group-hover/card:opacity-100 border border-gray-100"
                       >
                         <Icons.Heart size={14} className={isInWishlist(product.id) ? "fill-[#ff3366] text-[#ff3366]" : "text-gray-400 hover:text-gray-900"} />
                       </button>
                       <div 
                          onClick={() => setQuickViewProduct(product)}
                          className="relative bg-[#f0f0f0] aspect-square flex items-center justify-center p-2 cursor-pointer"
                       >
                           <img 
                              src={formatImageUrl(product.image)} 
                              alt={product.title} 
                              className="w-full h-full object-contain md:drop-shadow-xl group-hover:scale-110 transition-transform duration-500 will-change-transform"
                           />
                           <div className="absolute left-3 bottom-3 bg-white px-3 py-1.5 rounded-full shadow-sm">
                               <span className="text-[8px] font-black uppercase tracking-widest text-gray-900">{product.stock || 25} IN STOCK</span>
                           </div>
                       </div>
                    </div>

                   <div className="p-4 text-center">
                       <p className="text-[8px] font-black uppercase tracking-widest text-[#ff3366] mb-1">{product.brand} · EXCLUSIVE</p>
                       <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 truncate mb-3">{product.title}</h3>
                       <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString()}</p>
                          <button 
                            onClick={(e) => { e.stopPropagation(); addToCart(product.id, 1); }}
                            className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-[#ff3366] transition-colors"
                          >
                             <Icons.ShoppingCart size={14} />
                          </button>
                       </div>
                   </div>
                </div>
              ))}
            </div>
            
            {filteredProducts.length === 0 && (
               <div className="py-20 text-center flex flex-col items-center">
                   <div className="w-64 h-64 mb-4">
                     <LottieAnimation 
                       src="/animations/no-results.json" 
                     />
                   </div>
                   <p className="text-lg font-bold text-gray-400 uppercase tracking-widest">No masterpieces found.</p>
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
