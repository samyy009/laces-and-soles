import { useShop } from '../context/ShopContext';
import * as Icons from 'lucide-react';
import { Link } from 'react-router-dom';
import LottieAnimation from '../components/premium/LottieAnimation';
import Lordicon from '../components/premium/Lordicon';

export default function Wishlist() {
  const { wishlistItems, toggleWishlist, addToCart, getProductById, formatImageUrl } = useShop();

  return (
    <div className="pb-16 bg-white  min-h-screen">
      {/* ─── Header ─── */}
      <section className="relative pt-4 pb-2 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            <span className="text-[9px] font-black uppercase tracking-[0.8em] text-rose-500 mb-4 block">Curated Collection</span>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none font-heading mb-3">
            YOUR <span className="text-rose-500">WISHLIST</span>
          </h1>
          <div className="mt-4 h-1 w-16 bg-rose-500 rounded-full mx-auto shadow-[0_0_20px_rgba(244,63,94,0.3)]" />
          <p className="mt-4 text-[10px] text-gray-400  font-black uppercase tracking-[0.3em] font-heading">
            {wishlistItems.length} ARCHIVED STYLES FOR THE COLLECTOR
          </p>
        </div>
      </section>

      <section className="py-6 mx-auto max-w-7xl px-6">
        {wishlistItems.length === 0 ? (
          <div className="py-8 text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="w-72 h-72 mx-auto">
              <LottieAnimation src="/animations/wishlist-v4.json" />
            </div>
            <h2 className="text-4xl font-black text-gray-900  uppercase tracking-tight font-heading">The List is Empty</h2>
            <p className="mt-4 text-gray-400  max-w-sm mx-auto font-medium italic text-lg leading-relaxed">
              Begin your curation journey within our boutique collections.
            </p>
            <Link 
              to="/store"
               className="mt-8 inline-block bg-gray-900 text-white px-12 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-[0.4em] transition-all hover:bg-rose-500 hover:-translate-y-2 active:scale-95 font-heading shadow-2xl"
            >
              Enter the Boutique
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {wishlistItems.map((id) => {
              const product = getProductById(id);
              if (!product) return null;
              return (
                <div key={id} className="group relative bg-white  rounded-3xl p-6 border border-gray-50 transition-all hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] hover:-translate-y-2">
                  <button 
                    onClick={() => toggleWishlist(id)}
                    className="absolute right-8 top-8 z-10 p-3 bg-white  backdrop-blur-md rounded-2xl text-gray-300 hover:text-rose-500 hover:scale-110 transition-all border border-gray-50 shadow-sm"
                  >
                    <Icons.X size={20} strokeWidth={3} />
                  </button>
                  
                  <div className="relative aspect-[3/2] w-full mb-6 bg-white rounded-2xl overflow-hidden p-1 transition-all group-hover:bg-white">
                    <div className="absolute inset-0 mesh-gradient opacity-0 group-hover:opacity-5 transition-opacity" />
                    <img 
                      src={formatImageUrl(product.image)} 
                      alt={product.title} 
                      className="h-full w-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-3" 
                    />
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-500 font-heading">
                      {product.brand}
                    </span>
                    <h3 className="mt-2 text-xl font-black text-gray-900  group-hover:text-rose-500 transition-colors uppercase tracking-tight font-heading">
                      {product.title}
                    </h3>
                    <div className="mb-6">
                      <span className="text-3xl font-black text-gray-900  font-heading tracking-tighter">₹{product.price.toFixed(2)}</span>
                    </div>

                    <button 
                      onClick={() => addToCart(id)}
                      className="mt-6 w-full bg-gray-900 text-white py-4 rounded-[24px] text-[10px] font-black uppercase tracking-[0.4em] transition-all hover:bg-rose-500 hover:shadow-xl active:scale-95 font-heading flex items-center justify-center gap-2"
                    >
                      <Lordicon src="https://cdn.lordicon.com/lpddubrl.json" size={20} colors="primary:#ffffff,secondary:#ff3366" />
                      Acquire Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
