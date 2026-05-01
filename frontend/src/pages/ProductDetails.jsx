import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import axios from 'axios';
import { useShop, API } from '../context/ShopContext';

const API_BASE = `${API}/api`;

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, wishlistItems, isInWishlist, formatImageUrl } = useShop();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState('10');

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/products/${id}`);
        setProduct(res.data.product);
        setActiveImage(res.data.product.image);
      } catch (err) {
        console.error('Failed to fetch product:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#ff3366] border-t-transparent" />
    </div>
  );

  if (!product) return (
    <div className="flex h-screen flex-col items-center justify-center text-center">
      <h2 className="text-3xl font-black uppercase tracking-tighter">Product Not Found</h2>
      <button onClick={() => navigate('/store')} className="mt-8 bg-gray-900 text-white px-10 py-4 rounded-full font-black uppercase tracking-widest text-xs hover:bg-[#ff3366] transition-colors">
        Back to Store
      </button>
    </div>
  );

  const mockGallery = [product.image, product.image, product.image, product.image];

  return (
    <div className="pb-16 bg-gray-50 min-h-screen">
      <div className="w-full bg-white border-b border-gray-100 mb-0">
          <nav className="flex items-center gap-4 px-6 pt-1 pb-2 text-[10px] font-black uppercase tracking-widest text-gray-400 max-w-[1400px] mx-auto">
            <Link to="/" className="hover:text-[#ff3366] transition-colors">Home</Link>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <Link to="/store" className="hover:text-[#ff3366] transition-colors">Store</Link>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <span className="text-[#ff3366] truncate">{product.title}</span>
          </nav>
      </div>

      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-8">

          {/* ── Gallery ── */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] md:aspect-square md:max-h-[520px] bg-[#f5f5f5] rounded-[32px] flex items-center justify-center p-8 overflow-hidden border border-gray-100 shadow-sm">
               {/* Removed wishlist button as requested per standardization */}
              <img
                src={formatImageUrl(activeImage)}
                alt={product.title}
                className="w-full h-full object-contain drop-shadow-2xl"
              />
            </div>

            <div className="flex justify-center gap-4">
              {mockGallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`size-16 rounded-2xl bg-[#f5f5f5] border-2 flex items-center justify-center p-2 relative overflow-hidden transition-all ${activeImage === img ? 'border-[#ff3366]' : 'border-transparent hover:border-gray-300'}`}
                >
                  <img
                    src={formatImageUrl(img)}
                    alt={`Angle ${i}`}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-white/80 py-0.5 text-center">
                      <span className="text-[8px] font-black uppercase tracking-wider text-gray-900">Angle</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Details ── */}
          <div className="flex items-center">
             <div className="flex-1 max-w-xl">
                <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full mb-4">
                   <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-green-700">
                      11 PEOPLE ARE VIEWING THIS MASTERPIECE RIGHT NOW
                   </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter leading-tight mb-3">
                  {product.title}
                </h1>

                <div className="flex items-center gap-2 mb-4">
                   <div className="flex">
                      {[1,2,3,4,5].map(star => (
                         <Icons.Star key={star} size={16} className={star <= (product.rating||4.5) ? "fill-gray-900 text-gray-900" : "text-gray-200"} />
                      ))}
                   </div>
                   <span className="text-[10px] font-bold text-gray-400">(10 reviews)</span>
                </div>

                <div className="mb-4">
                   <span className="text-3xl font-black text-gray-900 tracking-tighter">MRP: ₹{product.price.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-4">
                   <div className="size-2 rounded-full bg-green-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-green-600">LIVE INVENTORY: {product.stock || 43} UNITS AVAILABLE</span>
                </div>

                <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-md mb-6">
                  {product.description || `Premium ${product.brand} ${product.type} footwear. Engineered for maximum comfort and style.`}
                </p>

                <div className="mb-3">
                  <div className="flex justify-between items-end mb-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900">SELECT SIZE</h4>
                    <span className="text-[10px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer">Size Guide</span>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {['6', '7', '8', '9', '10', '11'].map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`h-10 rounded-xl border-2 text-xs font-black transition-all ${selectedSize === size ? 'border-[#ff3366] text-[#ff3366] bg-rose-50' : 'border-gray-100 text-gray-600 hover:border-gray-900 hover:text-gray-900'}`}
                      >
                        UK {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900 mb-3">DELIVERY OPTIONS</h4>
                   <div className="flex">
                       <input 
                           type="text" 
                           placeholder="Enter Pincode" 
                           className="flex-1 bg-gray-50 border border-gray-100 border-r-0 rounded-l-2xl px-4 py-2 outline-none text-sm font-bold focus:border-gray-300 transition-colors"
                       />
                       <button className="bg-gray-50 border border-gray-100 border-l-0 rounded-r-2xl px-4 py-2 text-[10px] font-black text-[#ff3366] uppercase tracking-widest hover:bg-gray-100 transition-colors">
                           CHECK
                       </button>
                   </div>
                   <p className="text-[9px] font-bold text-gray-400 mt-3 tracking-wide">Free shipping over ₹5000 • Easy 14 days returns</p>
                </div>

                <button
                  onClick={() => addToCart(product.id, 1, selectedSize)}
                  className="w-full h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:bg-[#ff3366] transition-colors shadow-xl"
                >
                  <Icons.ShoppingBag size={18} /> Add to Cart (₹{product.price.toLocaleString()})
                </button>

             </div>
          </div>
        </div>
        </div>

        {/* ── Reviews Section ── */}
        <div className="mt-20 border-t border-gray-100 pt-16">
           <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                 <Icons.MessageSquare size={24} className="text-[#ff3366]" />
                 CUSTOMER REVIEWS
              </h3>

              <div className="space-y-8 mb-16">
                 {product.reviews && product.reviews.length > 0 ? (
                    product.reviews.map((rev, i) => (
                       <div key={i} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-4">
                             <div className="flex items-center gap-3">
                                <div className="size-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                   <Icons.User size={20} />
                                </div>
                                <div>
                                   <p className="text-xs font-black uppercase tracking-widest">{rev.user_name || "Anonymous User"}</p>
                                   <p className="text-[10px] text-gray-400 font-bold">{new Date(rev.created_at).toLocaleDateString()}</p>
                                </div>
                             </div>
                             <div className="flex">
                                {[1,2,3,4,5].map(s => (
                                   <Icons.Star key={s} size={12} className={s <= rev.rating ? "fill-gray-900 text-gray-900" : "text-gray-200"} />
                                ))}
                             </div>
                          </div>
                          <p className="text-sm font-medium text-gray-600 leading-relaxed italic">"{rev.comment}"</p>
                       </div>
                    ))
                 ) : (
                    <div className="text-center py-10 bg-gray-100/50 rounded-3xl border-2 border-dashed border-gray-200">
                       <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No reviews yet. Be the first to buy and review!</p>
                    </div>
                 )}
              </div>

              {/* Add Review Form */}
              <div className="bg-gray-900 rounded-[32px] p-8 text-white relative overflow-hidden">
                 <div className="relative z-10">
                    <h4 className="text-lg font-black uppercase tracking-tighter mb-2">WRITE A REVIEW</h4>
                    <p className="text-xs text-gray-400 font-medium mb-6">Only verified buyers can submit reviews to ensure authenticity.</p>
                    
                    <form onSubmit={async (e) => {
                       e.preventDefault();
                       const rating = e.target.rating.value;
                       const comment = e.target.comment.value;
                       try {
                          await axios.post(`${API_BASE}/products/${product.id}/reviews`, { rating: parseInt(rating), comment }, {
                             headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                          });
                          toast.success("Review posted successfully!");
                          window.location.reload();
                       } catch (err) {
                          toast.error(err.response?.data?.error || "Failed to post review");
                       }
                    }} className="space-y-4">
                       <div className="flex gap-4">
                          <select name="rating" required className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest outline-none focus:border-[#ff3366]">
                             <option value="5" className="text-black">5 Stars (Excellent)</option>
                             <option value="4" className="text-black">4 Stars (Great)</option>
                             <option value="3" className="text-black">3 Stars (Average)</option>
                             <option value="2" className="text-black">2 Stars (Poor)</option>
                             <option value="1" className="text-black">1 Star (Terrible)</option>
                          </select>
                       </div>
                       <textarea 
                          name="comment" 
                          required 
                          placeholder="Share your experience with this product..." 
                          className="w-full h-32 bg-white/10 border border-white/20 rounded-2xl p-4 text-sm font-medium outline-none focus:border-[#ff3366] placeholder:text-gray-500"
                       ></textarea>
                       <button type="submit" className="w-full bg-[#ff3366] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg">
                          Submit Verified Review
                       </button>
                    </form>
                 </div>
                 <Icons.Zap size={160} className="absolute bottom-[-40px] right-[-40px] opacity-10 rotate-12" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
