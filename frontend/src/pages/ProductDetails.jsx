import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import axios from 'axios';
import { useShop, API } from '../context/ShopContext';
import { toast } from 'react-toastify';

const API_BASE = `${API}/api`;

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, formatImageUrl, products } = useShop();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeAngle, setActiveAngle] = useState(null);
  const [selectedSize, setSelectedSize] = useState('10');
  const [ratingFormValue, setRatingFormValue] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [pincode, setPincode] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [viewers, setViewers] = useState(Math.floor(Math.random() * 15) + 5);

  useEffect(() => {
    const interval = setInterval(() => {
      setViewers(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        const next = prev + change;
        return next < 3 ? 3 : (next > 35 ? 35 : next);
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handlePincodeCheck = () => {
    if (pincode.length !== 6) {
      setDeliveryStatus("Please enter a valid 6-digit pincode");
      return;
    }
    // Simulate check
    if (pincode.startsWith('580')) {
      setDeliveryStatus("✅ Delivery Available! Usually arrives in 2-4 hours.");
    } else {
      setDeliveryStatus("❌ Outside current delivery zone (Hubli-Dharwad only)");
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      // ⚡ Zero-Latency Fast Path: Check if product is already in global memory
      if (products && products.length > 0) {
        const cachedProduct = products.find(p => p.id.toString() === id.toString());
        if (cachedProduct) {
          setProduct(cachedProduct);
          setActiveAngle({ img: cachedProduct.image, transform: "scaleX(1)", label: "Left Side" });
          setLoading(false);
          
          // Still fetch quietly in the background to ensure reviews/stock are perfectly fresh
          axios.get(`${API_BASE}/products/${id}`).then(res => {
            if (res.data && res.data.product) {
              setProduct(res.data.product);
            }
          }).catch(err => console.error('Background sync failed:', err));
          
          return;
        }
      }

      // Standard Path (if navigating directly via URL and not in cache)
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/products/${id}`);
        setProduct(res.data.product);
        setActiveAngle({ img: res.data.product.image, transform: "scaleX(1)", label: "Left Side" });
      } catch (err) {
        console.error('Failed to fetch product:', err);
      } finally {
        setLoading(false);
      }
    };
    
    // Slight delay to ensure context is hydrated
    const timeout = setTimeout(fetchProduct, 50);
    window.scrollTo(0, 0);
    return () => clearTimeout(timeout);
  }, [id, products]);

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

  // 4-Angle CSS Perspective Engine
  const galleryAngles = [
    { img: product.image, label: "Left Side", transform: "scaleX(1)" },
    { img: product.image, label: "Right Side", transform: "scaleX(-1)" },
    { img: product.image, label: "Top", transform: "rotate(-15deg) scale(1.1)" },
    { img: product.image, label: "Outsole", transform: "rotate(180deg) scaleY(-1)" }
  ];

  // Related Products Logic
  const getRelatedProducts = () => {
    if (!products || !product) return [];
    let related = products.filter(p => p.id !== product.id && p.brand === product.brand);
    if (related.length < 4) {
      const others = products.filter(p => p.id !== product.id && !related.some(r => r.id === p.id));
      related = [...related, ...others];
    }
    return related.slice(0, 4);
  };
  const relatedProducts = getRelatedProducts();

  const SizeGuideModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSizeGuideOpen(false)} />
      <div className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter">Find Your Perfect Fit</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">{product.brand} Official Sizing Guide</p>
          </div>
          <button onClick={() => setIsSizeGuideOpen(false)} className="p-2 hover:bg-rose-50 rounded-xl transition-colors">
            <Icons.X size={24} className="text-gray-400 hover:text-rose-500" />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div className="grid grid-cols-4 gap-4 mb-8 text-center">
            {['UK', 'US', 'EU', 'CM'].map((label, idx) => (
              <div key={label} className={`p-4 rounded-2xl border-2 transition-all ${idx === 0 ? 'border-rose-500 bg-rose-50' : 'border-gray-50 bg-gray-50'}`}>
                <span className={`text-xs font-black uppercase ${idx === 0 ? 'text-rose-500' : 'text-gray-400'}`}>{label}</span>
              </div>
            ))}
          </div>

          <table className="w-full text-center border-collapse mb-8">
             <thead>
                <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                   <th className="p-4 border border-gray-100">UK SIZE</th>
                   <th className="p-4 border border-gray-100">US SIZE</th>
                   <th className="p-4 border border-gray-100">EU SIZE</th>
                   <th className="p-4 border border-gray-100">FOOT LENGTH</th>
                </tr>
             </thead>
             <tbody className="text-xs font-bold text-gray-900">
                {[
                  { uk: '6', us: '7', eu: '40', cm: '25.0' },
                  { uk: '7', us: '8', eu: '41', cm: '26.0' },
                  { uk: '8', us: '9', eu: '42.5', cm: '27.0' },
                  { uk: '9', us: '10', eu: '44', cm: '28.0' },
                  { uk: '10', us: '11', eu: '45', cm: '29.0' },
                  { uk: '11', us: '12', eu: '46', cm: '30.0' }
                ].map(row => (
                  <tr key={row.uk} className={selectedSize === row.uk ? 'bg-rose-50/50' : ''}>
                     <td className="p-4 border border-gray-100">{row.uk}</td>
                     <td className="p-4 border border-gray-100">{row.us}</td>
                     <td className="p-4 border border-gray-100">{row.eu}</td>
                     <td className="p-4 border border-gray-100">{row.cm} CM</td>
                  </tr>
                ))}
             </tbody>
          </table>

          <div className="bg-gray-900 rounded-3xl p-6 text-white relative overflow-hidden">
             <div className="relative z-10 flex items-start gap-4">
                <div className="p-3 bg-white/10 rounded-xl">
                   <Icons.Info size={24} className="text-rose-500" />
                </div>
                <div>
                   <h4 className="text-sm font-black uppercase tracking-tight mb-1">Fitting Tip for {product.brand}</h4>
                   <p className="text-xs text-gray-400 font-medium leading-relaxed">
                     {product.brand === 'Nike' ? 'Most Nike sneakers run true to size. If you have wider feet, we recommend going up by half a size.' : 
                      product.brand === 'Adidas' ? 'Adidas shoes are known for their consistent fit. Stick to your usual UK size for the best experience.' :
                      'This brand generally runs true to size. Refer to the CM measurement for the most accurate fit.'}
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pb-16 bg-gray-50 min-h-screen">
      {isSizeGuideOpen && <SizeGuideModal />}
      
      <div className="w-full bg-white border-b border-gray-100 mb-0">
          <nav className="flex items-center gap-4 px-6 pt-1 pb-2 text-[10px] font-black uppercase tracking-widest text-gray-400 max-w-[1400px] mx-auto">
            <Link to="/" className="hover:text-[#ff3366] transition-colors">Home</Link>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <Link to="/store" className="hover:text-[#ff3366] transition-colors">Store</Link>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <span className="text-[#ff3366] truncate">{product.title}</span>
          </nav>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <div className="grid lg:grid-cols-2 gap-6">

          {/* ── Gallery ── */}
          <div className="space-y-3">
            <div className="relative aspect-[4/3] md:aspect-square md:max-h-[400px] bg-[#f5f5f5] rounded-[24px] flex items-center justify-center p-6 overflow-hidden border border-gray-100 shadow-sm">
              {activeAngle && (
                <img
                  src={formatImageUrl(activeAngle.img)}
                  alt={product.title}
                  className="w-full h-full object-contain drop-shadow-2xl transition-all duration-700 ease-in-out"
                  style={{ transform: activeAngle.transform }}
                />
              )}
            </div>

            <div className="flex justify-center gap-4 mt-6">
              {galleryAngles.map((angleObj, i) => (
                <button
                  key={i}
                  onClick={() => setActiveAngle(angleObj)}
                  className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white border-4 flex flex-col items-center justify-between p-2 relative overflow-hidden transition-all duration-300 ${activeAngle?.label === angleObj.label ? 'border-[#ff3366] shadow-[0_8px_20px_rgba(255,51,102,0.2)] scale-105' : 'border-[#1a202c] hover:border-gray-400 hover:scale-105'}`}
                >
                  <div className="flex-1 w-full flex items-center justify-center p-1">
                     <img
                       src={formatImageUrl(angleObj.img)}
                       alt={`${angleObj.label} view`}
                       className="w-full h-full object-contain drop-shadow-md transition-transform duration-500"
                       style={{ transform: angleObj.transform }}
                     />
                  </div>
                  <div className="w-full text-center pb-1">
                      <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#1a202c]">{angleObj.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Details ── */}
          <div className="flex items-center">
             <div className="flex-1 max-w-xl">
                <div className="inline-flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full mb-3 transition-all duration-500">
                   <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[8px] font-black uppercase tracking-widest text-green-700">
                      {viewers} PEOPLE ARE VIEWING THIS MASTERPIECE
                   </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tighter leading-tight mb-2">
                  {product.title}
                </h1>

                <div className="flex items-center gap-2 mb-3">
                   <div className="flex">
                      {[1,2,3,4,5].map(star => (
                         <Icons.Star key={star} size={14} className={star <= (product.rating||4.5) ? "fill-gray-900 text-gray-900" : "text-gray-200"} />
                      ))}
                   </div>
                   <span className="text-[9px] font-bold text-gray-400">({product.reviews?.length || 0} reviews)</span>
                </div>

                <div className="mb-3">
                   <span className="text-2xl font-black text-gray-900 tracking-tighter">MRP: ₹{product.price.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-3">
                   <div className="size-1.5 rounded-full bg-green-500" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-green-600">LIVE INVENTORY: {product.stock || 0} UNITS</span>
                </div>

                <p className="text-xs font-medium text-gray-500 leading-relaxed max-w-md mb-4">
                  {product.description || `Premium ${product.brand} ${product.type} footwear. Engineered for maximum comfort and style.`}
                </p>

                <div className="mb-3">
                  <div className="flex justify-between items-end mb-2">
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-900">SELECT SIZE</h4>
                    <button 
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 cursor-pointer border-b border-rose-500"
                    >
                      Size Guide
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {['6', '7', '8', '9', '10', '11'].map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`h-8 rounded-lg border-2 text-[10px] font-black transition-all ${selectedSize === size ? 'border-[#ff3366] text-[#ff3366] bg-rose-50' : 'border-gray-100 text-gray-600 hover:border-gray-900 hover:text-gray-900'}`}
                      >
                        UK {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                   <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-900 mb-2">DELIVERY OPTIONS</h4>
                   <div className="flex">
                       <input 
                           type="text" 
                           placeholder="Enter Pincode" 
                           maxLength="6"
                           value={pincode}
                           onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                           className="flex-1 bg-gray-50 border border-gray-100 border-r-0 rounded-l-xl px-3 py-1.5 outline-none text-xs font-bold focus:border-gray-300 transition-colors"
                       />
                       <button 
                         onClick={handlePincodeCheck}
                         className="bg-gray-50 border border-gray-100 border-l-0 rounded-r-xl px-3 py-1.5 text-[9px] font-black text-[#ff3366] uppercase tracking-widest hover:bg-gray-100 transition-colors"
                       >
                           CHECK
                       </button>
                   </div>
                   {deliveryStatus && (
                     <p className={`text-[8px] font-black uppercase mt-2 tracking-widest ${deliveryStatus.includes('Available') ? 'text-green-600' : 'text-rose-500'}`}>
                       {deliveryStatus}
                     </p>
                   )}
                   <p className="text-[8px] font-bold text-gray-400 mt-2 tracking-wide">Free shipping over ₹5000 • Easy 14 days returns</p>
                </div>

                {product.stock > 0 ? (
                  <button
                    onClick={() => addToCart(product.id, 1, selectedSize)}
                    className="w-full h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#ff3366] transition-colors shadow-lg"
                  >
                    <Icons.ShoppingBag size={16} /> Add to Cart (₹{product.price.toLocaleString()})
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      toast.info("We'll notify you when this is back in stock!");
                    }}
                    className="w-full h-10 bg-rose-100 text-[#ff3366] rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-rose-200 transition-colors border-2 border-rose-200"
                  >
                    <Icons.Bell size={16} /> Notify Me When Available
                  </button>
                )}
             </div>
          </div>
        </div>

        {/* ── Reviews Section ── */}
        <div className="mt-10 border-t border-gray-100 pt-8">
           <div className="max-w-3xl mx-auto">
              <h3 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
                 <Icons.MessageSquare size={20} className="text-[#ff3366]" />
                 CUSTOMER REVIEWS
              </h3>

              <div className="space-y-6 mb-10">
                 {product.reviews && product.reviews.length > 0 ? (
                    product.reviews.map((rev, i) => (
                       <div key={i} className="bg-white p-5 rounded-[20px] border border-gray-100 shadow-sm hover:shadow-md transition-all">
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
                       const comment = e.target.comment.value;
                       if (ratingFormValue === 0) {
                          toast.error("Please select a star rating");
                          return;
                       }
                       try {
                          await axios.post(`${API_BASE}/products/${product.id}/reviews`, { rating: ratingFormValue, comment }, {
                             headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                          });
                          toast.success("Review posted successfully!");
                          window.location.reload();
                       } catch (err) {
                          toast.error(err.response?.data?.error || "Failed to post review");
                       }
                    }} className="space-y-4">
                       <div className="flex gap-2 mb-2 items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                             <button
                                type="button"
                                key={star}
                                className="focus:outline-none transition-transform hover:scale-110"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRatingFormValue(star)}
                             >
                                <Icons.Star 
                                   size={28} 
                                   className={`${star <= (hoverRating || ratingFormValue) ? "fill-[#ff3366] text-[#ff3366]" : "text-gray-500"} transition-colors`} 
                                />
                             </button>
                          ))}
                          <span className="ml-3 text-xs font-black text-gray-400 uppercase tracking-widest">
                             {ratingFormValue === 0 ? "Select Rating" : `${ratingFormValue} Star${ratingFormValue > 1 ? 's' : ''}`}
                          </span>
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

         {/* ── Related Products ── */}
         {relatedProducts.length > 0 && (
           <div className="mt-16 pt-10 border-t border-gray-100 max-w-[1400px] mx-auto px-6">
              <h3 className="text-xl font-black uppercase tracking-tighter mb-8 text-center flex items-center justify-center gap-2">
                 <Icons.Sparkles size={20} className="text-[#ff3366]" />
                 YOU MAY ALSO LIKE
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 {relatedProducts.map(rp => (
                   <Link key={rp.id} to={`/product/${rp.id}`} className="group bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all block">
                     <div className="aspect-square bg-gray-50 rounded-xl mb-4 overflow-hidden relative">
                        <img src={formatImageUrl(rp.image)} alt={rp.title} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{rp.brand}</p>
                     <h4 className="text-xs font-bold text-gray-900 line-clamp-1 mb-2">{rp.title}</h4>
                     <p className="text-sm font-black text-gray-900">₹{rp.price.toLocaleString()}</p>
                   </Link>
                 ))}
              </div>
           </div>
         )}
      </div>
      {/* Size Guide Modal */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl relative animate-in zoom-in-95 slide-in-from-bottom-8">
              <div className="bg-gray-950 p-8 text-white">
                 <div className="flex justify-between items-center mb-4">
                    <div>
                       <h3 className="text-2xl font-black uppercase tracking-tighter">Size Guide</h3>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">UK TO CM Conversion</p>
                    </div>
                    <button onClick={() => setIsSizeGuideOpen(false)} className="size-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#ff3366] transition-colors">
                       <Icons.X size={20} />
                    </button>
                 </div>
              </div>
              <div className="p-8">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                       <tr>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">UK Size</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Heel-to-Toe (CM)</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">EU Size</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {[
                          { uk: '6', cm: '24.5', eu: '40' },
                          { uk: '7', cm: '25.4', eu: '41' },
                          { uk: '8', cm: '26.2', eu: '42' },
                          { uk: '9', cm: '27.1', eu: '43' },
                          { uk: '10', cm: '28.0', eu: '44' },
                          { uk: '11', cm: '28.8', eu: '45' },
                       ].map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                             <td className="p-4 text-sm font-black text-gray-900">UK {row.uk}</td>
                             <td className="p-4 text-sm font-bold text-gray-600">{row.cm} cm</td>
                             <td className="p-4 text-sm font-bold text-gray-400">{row.eu}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
