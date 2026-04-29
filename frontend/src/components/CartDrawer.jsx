import * as Icons from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useNavigate } from 'react-router-dom';
import LottieAnimation from './premium/LottieAnimation';

export default function CartDrawer() {
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, getCartTotal, getProductById, formatImageUrl } = useShop();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  const handleStartShopping = () => {
    setIsCartOpen(false);
    navigate('/store');
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500" 
        onClick={() => setIsCartOpen(false)} 
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl transition-all duration-700 ease-out animate-in slide-in-from-right-full">
        <div className="flex h-full flex-col relative">
          {/* Subtle Decorative Gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-[80px] pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-950/5 px-6 py-3 relative z-10">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900  font-heading">
              Your <span className="text-rose-500">Cart</span>
            </h2>
            <button 
              onClick={() => setIsCartOpen(false)}
              className="group rounded-2xl p-3 text-gray-400  transition-all hover:bg-rose-500/10 hover:text-rose-500"
            >
              <Icons.X size={28} className="transition-transform group-hover:rotate-90" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto px-6 py-3 custom-scrollbar relative z-10">
            {cartItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="w-64 h-64 mb-4">
                <LottieAnimation 
                    src="/animations/empty-cart.json" 
                  />
                </div>
                <p className="text-xl font-black text-gray-400  uppercase tracking-[0.2em] font-heading">Empty Collection</p>
                <button 
                  onClick={handleStartShopping}
                  className="mt-10 px-10 py-5 bg-gray-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all hover:bg-rose-500 hover:-translate-y-1 shadow-2xl"
                >
                  Discover Laces & Soles
                </button>
              </div>
            ) : (
              <ul className="space-y-5">
                {cartItems.map((item) => {
                  const product = getProductById(item.id);
                  if (!product) return null;
                  return (
                    <li key={`${item.id}-${item.size}`} className="flex gap-4 group animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="size-20 rounded-2xl bg-white p-3 border border-gray-100 flex-shrink-0 shadow-sm transition-all group-hover:shadow-xl group-hover:scale-105">
                        <img src={formatImageUrl(product.image)} alt={product.title} className="h-full w-full object-contain" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-2">
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1 block">{product.brand}</span>
                              <h4 className="text-lg font-black text-gray-900  group-hover:text-rose-500 transition-colors font-heading leading-tight">{product.title}</h4>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item.id, item.size)}
                              className="rounded-xl p-2 text-gray-300 hover:bg-rose-50 hover:text-rose-500 transition-all"
                            >
                              <Icons.Trash2 size={18} />
                            </button>
                          </div>
                          <p className="text-[10px] font-black text-gray-400  uppercase tracking-widest mt-3 flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Size {item.size}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center bg-gray-900/5 rounded-2xl p-1 gap-4">
                            <button 
                              onClick={() => updateQuantity(item.id, item.size, -1)}
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white  text-gray-900  shadow-sm hover:text-rose-500 transition-all active:scale-90"
                            >
                              <Icons.Minus size={14} strokeWidth={3} />
                            </button>
                            <span className="text-sm font-black text-gray-900  px-1">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.size, 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white  text-gray-900  shadow-sm hover:text-rose-500 transition-all active:scale-90"
                            >
                              <Icons.Plus size={14} strokeWidth={3} />
                            </button>
                          </div>
                          <span className="text-xl font-black text-gray-900  font-heading">₹{(product.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="bg-white border-t border-gray-100 p-6 space-y-4 relative z-10 shadow-[0_-20px_50px_rgba(0,0,0,0.02)]">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400  block mb-1">Final Total</span>
                  <span className="text-sm font-bold text-gray-400  italic">Inclusive of all taxes</span>
                </div>
                <span className="text-3xl font-black text-gray-900  font-heading">₹{getCartTotal().toFixed(2)}</span>
              </div>
              
              <div className="space-y-4">
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-gray-900 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] text-white transition-all hover:bg-rose-500 hover:-translate-y-1 shadow-2xl shadow-gray-900/20 active:scale-95 flex items-center justify-center gap-4"
                >
                  Proceed to Checkout <Icons.ArrowRight size={18} strokeWidth={3} />
                </button>
                <button 
                  onClick={handleStartShopping}
                  className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400  hover:text-gray-900 transition-all"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
