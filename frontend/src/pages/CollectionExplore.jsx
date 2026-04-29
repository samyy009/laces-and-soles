import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import axios from 'axios';
import { useShop, API } from '../context/ShopContext';
import QuickViewModal from '../components/QuickViewModal';
const API_BASE = `${API}/api`;

const COLLECTION_METADATA = {
  'urban-explorer': {
    title: 'Urban Explorer',
    subtitle: 'Nike — Modern street aesthetics',
    description: 'Designed for the concrete jungle. Where rugged durability meets sharp metropolitan style. Powered by Nike.',
    banner: '/collection-1.png'
  },
  'performance-pro': {
    title: 'Performance Pro',
    subtitle: 'Adidas — Push your limits',
    description: 'Elite Adidas footwear engineered for peak athletic performance. Lightweight, responsive, and powerful.',
    banner: '/assets/banners/sports_banner.png'
  },
  'vintage-luxe': {
    title: 'Vintage Luxe',
    subtitle: 'Reebok — Timeless craftsmanship',
    description: 'Heirloom-quality Reebok designs bridging classic silhouettes with modern luxury.',
    banner: '/cta-1.jpg'
  },
  'summer-breeze': {
    title: 'Summer Breeze',
    subtitle: 'Puma — Lightweight comfort',
    description: 'Breathable, airy Puma footwear. Effortlessly cool — perfect for warm days and coastal adventures.',
    banner: '/assets/banners/womens_banner.png'
  },
  'winter-shield': {
    title: 'Winter Shield',
    subtitle: 'Asics — Rugged performance',
    description: 'Advanced Asics engineering and weather-resistant materials to keep you moving through anything.',
    banner: '/collections_banner.png'
  },
  'junior-series': {
    title: 'Junior Series',
    subtitle: 'Jordan — For the next generation',
    description: 'Vibrant, durable Jordan footwear built for the next generation of explorers and street legends.',
    banner: '/collection-3.png'
  },
  'formal-edge': {
    title: 'Formal Edge',
    subtitle: 'Reebok - Office to street',
    description: 'Clean, simple, and functional. Go directly from the boardroom to happy hour.',
    banner: '/about_hero.png'
  },
  'marathon-elite': {
    title: 'Marathon Elite',
    subtitle: 'Nike — Built for distance',
    description: 'State of the art cushioning for marathon runners pulling serious distance.',
    banner: '/cta-2.jpg'
  },
  'court-classics': {
    title: 'Court Classics',
    subtitle: 'Jordan — Basketball legends',
    description: 'Heritage court shoes that stand the test of time, recreated for today.',
    banner: '/hero-banner.png'
  }
};

export default function CollectionExplore() {
  const { slug } = useParams();
  const { addToCart, formatImageUrl, toggleWishlist, isInWishlist } = useShop();
  const meta = COLLECTION_METADATA[slug] || { title: 'Collection', subtitle: 'Explore Our Range', description: 'Curated sets of premium footwear.', banner: '/hero-banner.png' };

  // State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [activeBrand, setActiveBrand] = useState('All');
  const [activeGender, setActiveGender] = useState('All');
  const [activeSort, setActiveSort] = useState('newest');

  const brands = ['All', 'Nike', 'Adidas', 'Jordan', 'Puma', 'Reebok', 'Asics', 'New Balance', 'Under Armour'];
  const genders = ['All', 'Men', 'Women'];

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        collection: slug,
        page,
        limit: 12,
        sort: activeSort
      });
      if (activeBrand !== 'All') params.append('brand', activeBrand);
      if (activeGender !== 'All') params.append('category', activeGender.toLowerCase());
      if (search) params.append('search', search);

      const response = await axios.get(`${API_BASE}/products?${params.toString()}`);
      setProducts(response.data.products);
      setTotal(response.data.total);
      setTotalPages(response.data.pages);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    window.scrollTo(0, 0);
  }, [slug, page, activeBrand, activeGender, activeSort]);

  return (
    <div className="min-h-screen bg-white">
      
      {/* ────────────────────────────────────────────────── [ Header ] */}
      <section className="relative w-full h-[240px] bg-gray-50 mt-0 flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={meta.banner}
            alt="Collection Header"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative z-10 p-6 md:p-8 max-w-xl bg-white/95 backdrop-blur-sm m-6 md:ml-12 rounded-[24px] border border-gray-100 shadow-xl">
           <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#ff3366] mb-2">EXPLORE COLLECTION</h3>
           <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tighter leading-tight mb-2">
               {meta.title}
           </h1>
           <p className="text-gray-500 font-bold text-[10px] leading-relaxed mb-3 uppercase tracking-wide">
             {meta.description}
           </p>
           <nav className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-gray-400">
             <Link to="/" className="hover:text-[#ff3366] transition-colors">Home</Link>
             <Icons.ChevronRight size={8} />
             <Link to="/collections" className="hover:text-[#ff3366] transition-colors">Collections</Link>
             <Icons.ChevronRight size={10} />
             <span className="text-gray-900">{meta.title}</span>
           </nav>
        </div>
      </section>

      {/* ────────────────────────────────────────────────── [ Content Grid ] */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Mobile Header for Filters */}
        <div className="md:hidden flex items-center justify-between bg-white  p-4 rounded-2xl border border-gray-100 shadow-sm mb-2 overflow-x-auto no-scrollbar">
            <div className="flex gap-4 py-2">
               {brands.slice(0, 6).map(brand => (
                 <button 
                  key={brand}
                  onClick={() => { setActiveBrand(brand); setPage(1); }}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeBrand === brand ? 'bg-[#ff3366] text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                 >
                   {brand}
                 </button>
               ))}
            </div>
        </div>

        {/* Sidebar Filters - Desktop only */}
        <aside className="hidden md:block md:w-64 flex-shrink-0">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-4">Filters</h2>
            
            <div className="mb-5">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-4 border-b border-gray-100 pb-2">Target Gender</h3>
                <div className="space-y-3">
                    {genders.map(gender => (
                        <button 
                            key={gender} 
                            onClick={() => { setActiveGender(gender); setPage(1); }}
                            className="flex items-center gap-3 w-full group"
                        >
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${activeGender === gender ? 'border-[#ff3366]' : 'border-gray-300'}`}>
                                {activeGender === gender && <div className="w-2 h-2 rounded-full bg-[#ff3366]" />}
                            </div>
                            <span className={`text-sm font-bold uppercase tracking-widest ${activeGender === gender ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}`}>
                                {gender}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-5">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-4 border-b border-gray-100 pb-2">Top Brands</h3>
                <div className="space-y-3">
                    {brands.map(brand => (
                        <button 
                            key={brand} 
                            onClick={() => { setActiveBrand(brand); setPage(1); }}
                            className="flex items-center gap-3 w-full group"
                        >
                            <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-colors ${activeBrand === brand ? 'border-[#ff3366] bg-[#ff3366]' : 'border-gray-300'}`}>
                                {activeBrand === brand && <Icons.Check size={12} className="text-white" />}
                            </div>
                            <span className={`text-sm font-bold uppercase tracking-widest ${activeBrand === brand ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'}`}>
                                {brand}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

        </aside>

        {/* Product Grid */}
        <main className="flex-1">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Showing <span className="text-gray-900 font-black">{total}</span> Results</p>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sort By</span>
                    <select 
                      value={activeSort}
                      onChange={(e) => setActiveSort(e.target.value)}
                      className="bg-gray-50 border border-gray-200 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg outline-none focus:border-[#ff3366]"
                    >
                        <option value="newest">Latest Drop</option>
                        <option value="price_asc">Price Low to High</option>
                        <option value="price_desc">Price High to Low</option>
                        <option value="popular">Most Popular</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="min-h-[400px] flex items-center justify-center">Loading items...</div>
            ) : products.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
                    {products.map(product => (
                        <div key={product.id} className="group relative border border-gray-100 rounded-[32px] overflow-hidden hover:shadow-xl transition-shadow duration-300 p-2 bg-white flex flex-col">
                            <div className="relative group/card">
                               <button 
                                 onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product.id); }}
                                 className="absolute right-4 top-4 z-20 p-2.5 bg-white md:bg-white/90 md:backdrop-blur-md rounded-xl shadow-sm hover:scale-110 transition-opacity duration-300 opacity-100 lg:opacity-0 lg:group-hover/card:opacity-100 border border-gray-100"
                               >
                                 <Icons.Heart size={16} className={isInWishlist(product.id) ? "fill-[#ff3366] text-[#ff3366]" : "text-gray-400 hover:text-gray-900"} />
                               </button>
                                <div 
                                    onClick={() => setQuickViewProduct(product)}
                                    className="relative bg-[#f0f0f0] rounded-[24px] aspect-[4/5] flex items-center justify-center p-2 overflow-hidden cursor-pointer"
                                >
                                   <img 
                                      src={formatImageUrl(product.image)} 
                                      alt={product.title} 
                                      className="w-full h-full object-contain md:drop-shadow-xl group-hover:scale-110 transition-transform duration-500 will-change-transform"
                                   />
                                   <div className="absolute left-4 bottom-4 bg-white px-4 py-2 rounded-full shadow-sm">
                                      <span className="text-[9px] font-black uppercase tracking-widest text-[#ff3366]">Quick View</span>
                                   </div>
                                </div>
                            </div>

                            <div className="p-6 text-center">
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 truncate mb-4 cursor-pointer hover:text-[#ff3366]" onClick={() => window.location.href = `/product/${product.id}`}>{product.title}</h3>
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
                <div className="py-20 text-center bg-gray-50 rounded-[32px] border border-gray-100">
                    <p className="text-gray-500 font-bold uppercase tracking-widest">No products found matching these filters.</p>
                    <button 
                        onClick={() => { setActiveBrand('All'); setActiveGender('All'); setSearch(''); }}
                        className="mt-6 text-xs font-black uppercase tracking-widest text-white bg-gray-900 px-6 py-3 rounded-xl hover:bg-[#ff3366]"
                    >
                        Clear Filters
                    </button>
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#ff3366] disabled:opacity-30"><Icons.ChevronLeft size={18} /></button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button key={i} onClick={() => setPage(i + 1)} className={`w-10 h-10 rounded-lg font-bold text-sm ${page === i + 1 ? 'bg-[#ff3366] text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-200'}`}>{i + 1}</button>
                    ))}
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center hover:border-[#ff3366] disabled:opacity-30"><Icons.ChevronRight size={18} /></button>
                </div>
            )}
        </main>
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
