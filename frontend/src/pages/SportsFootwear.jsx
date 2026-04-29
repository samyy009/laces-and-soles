import { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import QuickViewModal from '../components/QuickViewModal';
import * as Icons from 'lucide-react';

export default function SportsFootwear() {
  const { addToCart, products: allProducts, formatImageUrl } = useShop();
  
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [activeBrand, setActiveBrand] = useState('All');
  const [maxPrice, setMaxPrice] = useState(30000);

  const brands = ['All', 'Nike', 'Adidas', 'Jordan', 'Puma', 'Reebok', 'Asics', 'New Balance', 'Under Armour'];

  const filteredProducts = allProducts.filter(p => {
    const isSports = p.category && p.category.toLowerCase() === 'sports';
    const brandMatch = activeBrand === 'All' || p.brand === activeBrand;
    const priceMatch = p.price <= maxPrice;
    return isSports && brandMatch && priceMatch;
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pb-16 bg-white min-h-screen pt-8">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar */}
          <aside className="w-full lg:w-52 pt-6">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">OUR PARTNERS</h4>
              <ul className="space-y-2">
                {brands.map(brand => (
                  <li key={brand}>
                    <button 
                      onClick={() => setActiveBrand(brand)}
                      className="group flex items-center justify-between w-full text-xs font-bold tracking-widest uppercase text-gray-900 transition-colors"
                    >
                      <span className={activeBrand === brand ? 'text-[#ff3366]' : 'group-hover:text-[#ff3366]'}>{brand}</span>
                      {activeBrand === brand ? (
                        <div className="w-3 h-3 rounded-full bg-[#ff3366] ring-2 ring-[#ff3366]/20" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border border-gray-300 group-hover:border-[#ff3366]" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <div className="flex justify-between items-end mb-4">
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

          {/* Main Content */}
          <div className="flex-1">
             <div className="mb-8">
                <h1 className="text-5xl md:text-6xl font-black text-[#1e293b] uppercase tracking-tighter leading-[0.9] m-0">
                  SPORTS
                </h1>
                <h1 className="text-5xl md:text-6xl font-black text-[#ff3366] uppercase tracking-tighter leading-[0.9] m-0">
                  FOOTWEAR
                </h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-3 max-w-xl">
                  DISCOVER THE ULTIMATE COLLECTION OF SPORTS SNEAKERS. ENGINEERED FOR PERFORMANCE AND STYLE.
                </p>
             </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="group relative border border-gray-100 rounded-[32px] overflow-hidden hover:shadow-xl transition-all p-2 bg-white flex flex-col">
                    <div 
                        onClick={() => setQuickViewProduct(product)}
                        className="relative bg-[#f0f0f0] rounded-[24px] aspect-square flex items-center justify-center p-2 overflow-hidden cursor-pointer"
                    >
                        <img 
                            src={formatImageUrl(product.image)} 
                            alt={product.title} 
                            className="w-full h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute left-4 bottom-4 bg-white px-4 py-2 rounded-full shadow-sm">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-900">{product.stock || 25} IN STOCK</span>
                        </div>
                    </div>

                    <div className="p-6 text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#ff3366] mb-2">{product.brand} · EXCLUSIVE</p>
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 truncate mb-4">{product.title}</h3>
                        <div className="flex items-center justify-between">
                            <p className="text-xl font-bold text-gray-900">₹{product.price.toLocaleString()}</p>
                            <button 
                              onClick={(e) => { e.stopPropagation(); addToCart(product.id, 1); }}
                              className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-[#ff3366] transition-colors"
                            >
                              <Icons.ShoppingCart size={16} />
                            </button>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                <div className="py-20 text-center">
                    <p className="text-lg font-bold text-gray-400 uppercase tracking-widest">No styles found in this category.</p>
                </div>
            )}
          </div>
        </div>
      </div>

      {quickViewProduct && (
        <QuickViewModal 
          product={quickViewProduct} 
          onClose={() => setQuickViewProduct(null)} 
        />
      )}
    </div>
  );
}
