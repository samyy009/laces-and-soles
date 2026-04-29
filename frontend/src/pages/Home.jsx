import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import content from '../content.json';
import { useShop } from '../context/ShopContext';
import QuickViewModal from '../components/QuickViewModal';

export default function Home() {
  const { addToCart, products, formatImageUrl, toggleWishlist, wishlistItems, isInWishlist } = useShop();
  const [activeFilter, setActiveFilter] = useState('All');
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const filteredProducts =
    (products || []).filter(p => activeFilter === 'All' || p.brand === activeFilter).slice(0, 8);

  const serviceIcons = {
    truck: Icons.Truck,
    'credit-card': Icons.CreditCard,
    'rotate-ccw': Icons.RotateCcw,
    headphones: Icons.Headphones,
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero Banner ── */}
      <section className="relative w-full min-h-[500px] md:h-[450px] bg-[#fdfdfd] mt-0 flex items-center overflow-hidden border-b border-gray-100 px-4 sm:px-6">
        {/* Background Watermark */}
        <div className="absolute inset-0 z-0 flex items-center justify-center select-none pointer-events-none overflow-hidden opacity-50 md:opacity-100">
            <span className="text-[30vw] md:text-[20vw] font-black text-gray-50/50 uppercase tracking-tighter leading-none transform translate-y-12">FOOTWEAR</span>
        </div>

        {/* Split Image Container */}
        <div className="absolute right-0 top-0 bottom-0 w-full md:w-3/4 lg:w-[65%] z-0 opacity-40 md:opacity-100 pointer-events-none">
          <img
            src={content.hero.backgroundImage}
            alt="Hero Background"
            className="w-full h-full object-contain object-right md:object-center drop-shadow-2xl transition-transform duration-1000 rotate-[-5deg] hover:rotate-0 hover:scale-105"
          />
        </div>
        
        {/* Text Content */}
        <div className="relative z-10 py-8 px-4 md:px-6 max-w-xl lg:ml-4 animate-fade-in-up">
            <h3 className="text-[#ff3366] text-[10px] font-black uppercase tracking-[0.5em] mb-4">LATEST DROP</h3>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
               <span className="text-[#ff3366]">{content.hero.titleLight}</span> <br/>
               <span className="text-gray-900">{content.hero.titleBold}</span>
            </h1>
            <p className="text-gray-500 text-sm font-bold mb-10 leading-relaxed max-w-sm">
                {content.hero.description}
            </p>
            <Link to="/store">
                <button className="bg-gray-900 text-white px-12 py-5 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#ff3366] transition-all shadow-2xl hover:-translate-y-2 active:scale-95">
                    SHOP NOW
                </button>
            </Link>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-10 hidden lg:flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 animate-pulse-gentle">
            <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-gray-300 to-transparent" />
            <span>SCROLL TO EXPLORE</span>
        </div>
      </section>

      {/* ── Featured Collections ── */}
      <section className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(content.collection || []).map((cat, idx) => (
            <Link 
                to={cat.link} 
                key={idx}
                className="group relative h-[300px] rounded-[32px] overflow-hidden bg-gray-100 flex items-end p-8 border border-gray-100 hover:shadow-2xl transition-all"
            >
                {/* Background Image */}
                <img 
                    src={cat.image} 
                    alt={cat.title} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />

                {/* Content */}
                <div className="relative z-20 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <h3 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter mb-3 leading-tight">
                        {cat.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[#ff3366] text-[10px] font-black uppercase tracking-[0.3em] group/btn">
                        <span className="border-b-2 border-transparent group-hover/btn:border-[#ff3366] pb-1 transition-all">Shop Now</span>
                        <Icons.ArrowRight size={16} className="group-hover/btn:translate-x-2 transition-transform" />
                    </div>
                </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Shop by Brand — Infinite Marquee ── */}
      <section className="py-6 border-t border-gray-50 overflow-hidden">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-6 text-center">
          SHOP BY BRAND
        </h2>

        {/* Fade masks on left & right edges */}
        <div className="relative">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 z-10"
               style={{ background: 'linear-gradient(to right, white, transparent)' }} />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 z-10"
               style={{ background: 'linear-gradient(to left, white, transparent)' }} />

          {/* Marquee track — duplicated for seamless loop */}
          <div className="flex overflow-hidden py-4">
            <div className="flex items-center animate-marquee w-max whitespace-nowrap">
              {/* Set 1 */}
              <div className="flex items-center gap-12 md:gap-20 px-8">
                {[
                  { name: 'Nike',          logo: '/sponsor-1.png' },
                  { name: 'Adidas',        logo: '/sponsor-4.png' },
                  { name: 'Puma',          logo: '/sponsor-3.png' },
                  { name: 'Asics',         logo: '/sponsor-2.png' },
                  { name: 'Jordan',        logo: '/jordan_logo.png' },
                  { name: 'Reebok',        logo: '/reebok_logo.png' },
                  { name: 'New Balance',   logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/New_Balance_logo.svg/1280px-New_Balance_logo.svg.png' },
                  { name: 'Under Armour', logo: '/ua_logo.png' },
                ].map((brand, idx) => (
                  <Link
                    to={`/store?brand=${brand.name}`}
                    key={`${brand.name}-${idx}`}
                    className="flex-shrink-0 flex items-center justify-center min-w-[120px] md:min-w-[160px] opacity-90 hover:opacity-100 transition-all duration-500 hover:scale-110"
                  >
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="h-8 md:h-10 w-auto object-contain"
                    />
                  </Link>
                ))}
              </div>
              {/* Set 2 (Duplicate for seamless loop) */}
              <div className="flex items-center gap-12 md:gap-20 px-8" aria-hidden="true">
                {[
                  { name: 'Nike',          logo: '/sponsor-1.png' },
                  { name: 'Adidas',        logo: '/sponsor-4.png' },
                  { name: 'Puma',          logo: '/sponsor-3.png' },
                  { name: 'Asics',         logo: '/sponsor-2.png' },
                  { name: 'Jordan',        logo: '/jordan_logo.png' },
                  { name: 'Reebok',        logo: '/reebok_logo.png' },
                  { name: 'New Balance',   logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/New_Balance_logo.svg/1280px-New_Balance_logo.svg.png' },
                  { name: 'Under Armour', logo: '/ua_logo.png' },
                ].map((brand, idx) => (
                  <Link
                    to={`/store?brand=${brand.name}`}
                    key={`${brand.name}-dup-${idx}`}
                    className="flex-shrink-0 flex items-center justify-center min-w-[120px] md:min-w-[160px] opacity-90 hover:opacity-100 transition-all duration-500 hover:scale-110"
                  >
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="h-8 md:h-10 w-auto object-contain"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="bg-gray-50 border-t border-b border-gray-100 py-8">
        <div className="max-w-[1400px] mx-auto px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {(content.service || []).map((s, idx) => {
                    const IconComp = serviceIcons[s.icon];
                    return (
                        <div key={idx} className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#ff3366] shadow-sm">
                                {IconComp && <IconComp size={20} />}
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase text-gray-900 tracking-widest">{s.title}</h4>
                                <p className="text-[10px] font-bold text-gray-400 mt-1">{s.text}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </section>

      {/* ── Bestsellers ── */}
      <section className="max-w-[1400px] mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6">
             <h2 className="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter">Bestseller Products</h2>
             <div className="flex gap-4 mt-6 md:mt-0 overflow-x-auto pb-4 md:pb-0">
                {['All', 'Nike', 'Adidas', 'Jordan'].map(brand => (
                    <button 
                        key={brand}
                        onClick={() => setActiveFilter(brand)}
                        className={`text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-xl transition-colors whitespace-nowrap ${activeFilter === brand ? 'bg-[#ff3366] text-white' : 'bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-200'}`}
                    >
                        {brand}
                    </button>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-8">
              {filteredProducts.map((product, index) => (
                <div 
                  key={product.id} 
                  className="group relative border border-gray-100 rounded-[32px] overflow-hidden hover:shadow-xl transition-shadow duration-300 p-2 bg-white flex flex-col animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                    <div className="relative group/card">
                       <button 
                         onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product.id); }}
                         className="absolute right-4 top-4 z-20 p-2.5 bg-white md:bg-white/90 md:backdrop-blur-md rounded-xl shadow-sm hover:scale-110 transition-opacity duration-300 opacity-100 lg:opacity-0 lg:group-hover/card:opacity-100 border border-gray-100"
                       >
                         <Icons.Heart size={16} className={isInWishlist(product.id) ? "fill-[#ff3366] text-[#ff3366]" : "text-gray-400 hover:text-gray-900"} />
                       </button>
                       <div 
                          className="relative bg-[#f0f0f0] rounded-[24px] aspect-square flex items-center justify-center p-2 overflow-hidden"
                       >
                           <img 
                              src={formatImageUrl(product.image)} 
                              alt={product.title} 
                              className="w-full h-full object-contain md:drop-shadow-xl group-hover:scale-105 transition-transform duration-500 will-change-transform"
                           />
                       </div>
                    </div>

                   <div className="p-6 text-center">
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
      </section>

      {quickViewProduct && (
        <QuickViewModal 
          product={quickViewProduct} 
          onClose={() => setQuickViewProduct(null)} 
        />
      )}
    </div>
  );
}
