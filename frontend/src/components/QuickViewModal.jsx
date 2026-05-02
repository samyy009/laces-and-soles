import { useState } from 'react';
import { X, ShoppingCart, Heart, Star } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Link } from 'react-router-dom';

export default function QuickViewModal({ product, onClose, showFullDetails }) {
  const { addToCart, toggleWishlist, wishlistItems, isInWishlist, formatImageUrl } = useShop();
  const [activeImage, setActiveImage] = useState(product?.image);

  if (!product) return null;

  const galleryAngles = [
    { img: product.gallery?.[0] || product.image, label: "Left" },
    { img: product.gallery?.[1] || product.image, label: "Right" },
    { img: product.gallery?.[2] || product.image, label: "Top" },
    { img: product.gallery?.[3] || product.image, label: "Bottom" }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-[2px] transition-all duration-500">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-2xl flex flex-col md:flex-row max-h-[95vh] md:max-h-auto overflow-y-auto md:overflow-hidden animate-fade-in-scale">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 z-50 rounded-full bg-gray-100 p-2 text-gray-900 transition-colors hover:bg-gray-200"
        >
          <X size={20} />
        </button>

        <div className="flex-1 flex flex-col md:flex-row">
          {/* Image Side */}
          <div className="w-full md:w-1/2 bg-[#cacaca] p-6 flex flex-col relative items-center justify-center">
            


            <img 
              src={formatImageUrl(activeImage)} 
              alt={product.title} 
              className="w-full h-auto object-contain drop-shadow-xl my-auto max-h-[250px] md:max-h-[400px]"
            />

            {/* Thumbnails */}
            <div className="absolute bottom-4 flex gap-3 bg-white/40 p-2 rounded-2xl backdrop-blur-md">
              {galleryAngles.map((angleObj, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(angleObj.img)}
                  className={`size-14 rounded-xl flex flex-col items-center justify-center bg-[#cacaca] overflow-hidden border-2 transition-all relative ${activeImage === angleObj.img ? 'border-gray-800' : 'border-transparent hover:border-gray-400'}`}
                >
                  <img src={formatImageUrl(angleObj.img)} alt={`${angleObj.label} view`} className="w-full h-full object-contain p-1" />
                  <div className="absolute inset-x-0 bottom-0 bg-white/80 py-0.5 text-center">
                      <span className="text-[7px] font-black uppercase tracking-wider text-gray-900">{angleObj.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Content Side */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">{product.brand}</span>
            <h2 className="text-3xl font-black text-gray-900 uppercase mb-4">{product.title}</h2>
            
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
              {product.oldPrice && <del className="text-gray-400 text-lg">₹{product.oldPrice.toLocaleString()}</del>}
            </div>

            <p className="text-gray-600 mb-4 leading-relaxed">
              {product.description || "Premium footwear engineered for maximum comfort and style."}
            </p>

            <button 
              onClick={() => { addToCart(product.id, 1); onClose(); }}
              className="w-full mb-4 flex items-center justify-center gap-2 rounded-xl bg-gray-900 py-4 text-sm font-bold uppercase tracking-wider text-white hover:bg-gray-800 transition-colors"
            >
              <ShoppingCart size={20} /> Add to Cart
            </button>

            {showFullDetails && (
              <Link 
                to={`/product/${product.id}`}
                onClick={onClose}
                className="text-center text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-900 underline underline-offset-4 mt-4 block"
              >
                View Full Details
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
