import { createContext, useContext, useState, useEffect } from 'react';
import content from '../content.json';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';

const ShopContext = createContext();
export const API = 'http://localhost:5000';

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};

// Always get fresh headers from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const ShopProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState(content.products.items);

  // Fetch live products
  useEffect(() => {
    fetch(`${API}/api/products?limit=1000`)
      .then(res => res.json())
      .then(data => {
        if (data.products && data.products.length > 0) setProducts(data.products);
      })
      .catch(err => console.warn("Live DB fetch failed, using static JSON:", err));
  }, []);

  // Real-time Socket.IO Logic
  useEffect(() => {
    const socket = io(API);

    socket.on('inventory_updated', (data) => {
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === data.product_id ? { ...p, stock: data.new_stock } : p
        )
      );
    });

    socket.on('new_purchase', (data) => {
      // Find the product in our local state to get the image
      // We look it up by ID if possible, otherwise use the title from data
      
      if (user?.full_name !== data.user_name) {
        toast.info(
          <div className="flex items-center gap-4">
            <div className="size-12 bg-white rounded-xl p-1 flex-shrink-0 animate-pulse border border-gray-100">
                <img 
                  src={data.product_image} 
                  alt="" 
                  className="size-full object-contain"
                />
            </div>
            <div>
              <span className="font-black text-rose-500 uppercase tracking-widest text-[10px] block mb-1">Live Purchase! 👟</span>
              <p className="text-xs font-bold leading-tight">
                <span className="text-black">{data.user_name}</span> just scooped up the <span className="text-black font-black">{data.product_title}</span>!
              </p>
              <p className="text-[9px] text-gray-400 mt-1 uppercase font-black tracking-widest">Verified Transaction · 1s ago</p>
            </div>
          </div>,
          {
            position: "bottom-left",
            autoClose: 6000,
            icon: false // We use our custom icon/image layout
          }
        );
      }
    });

    return () => socket.disconnect();
  }, [user]);

  // Load user's cart + wishlist from DB whenever user logs in
  useEffect(() => {
    if (user) {
      const config = getAuthHeaders();
      
      const syncAndFetchCart = async () => {
        // 1. If we have local items, sync them to the DB first
        // We do this BEFORE fetching to ensure we merge
        if (cartItems.length > 0) {
          try {
            for (const item of cartItems) {
              await axios.post(`${API}/api/cart`, { 
                product_id: parseInt(item.id), 
                quantity: item.quantity 
              }, config);
            }
          } catch (err) {
            console.warn("Pre-login cart sync failed:", err);
          }
        }

        // 2. Fetch the final consolidated cart from DB
        try {
          const res = await axios.get(`${API}/api/cart`, config);
          if (res.data.cart) {
            const formatted = res.data.cart.map(c => ({ 
              id: c.product.id.toString(), 
              quantity: c.quantity, 
              size: '10' 
            }));
            setCartItems(formatted);
          }
        } catch (err) {
          console.error("Failed to fetch cart after login:", err);
        }
      };

      syncAndFetchCart();
      
      axios.get(`${API}/api/wishlist`, config)
        .then(res => {
          if (res.data.wishlist) {
            const formatted = res.data.wishlist.map(w => w.product.id.toString());
            setWishlistItems(formatted);
          }
        }).catch(() => {});
    } else {
      // User logged out — clear everything
      setCartItems([]);
      setWishlistItems([]);
    }
    // We only want to run this when the user identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const addToCart = async (productId, quantity = 1, size = '10') => {
    if (!user) {
      toast.warning("Please sign in or create an account before adding to cart!");
      navigate('/login', { state: { from: location } });
      return;
    }

    const targetProduct = getProductById(productId);
    if (!targetProduct) return;

    // Check if adding this will exceed stock
    const existingInCart = cartItems.find(item => item.id === productId && item.size === size);
    const newTotalQty = (existingInCart ? existingInCart.quantity : 0) + quantity;

    if (newTotalQty > targetProduct.stock) {
      toast.error(`Only ${targetProduct.stock} left in stock!`, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    // Update local state immediately
    setCartItems(prev => {
      if (existingInCart) {
        return prev.map(item => item.id === productId && item.size === size ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { id: productId, quantity, size }];
    });
    setIsCartOpen(true);
    toast.success("Added to cart! 🛒");

    // Sync to database
    try {
      await axios.post(`${API}/api/cart`, { product_id: parseInt(productId), quantity }, getAuthHeaders());
    } catch (err) {
      console.warn("Failed to sync cart to backend:", err);
    }
  };

  const removeFromCart = async (productId, size) => {
    setCartItems(prev => prev.filter(item => !(item.id === productId && item.size === size)));
    try {
      await axios.delete(`${API}/api/cart?product_id=${productId}`, getAuthHeaders());
    } catch (err) {}
  };

  const updateQuantity = (productId, size, delta) => {
    const targetProduct = getProductById(productId);
    if (!targetProduct) return;

    setCartItems(prev => prev.map(item => {
      if (item.id === productId && item.size === size) {
        const newQty = item.quantity + delta;
        if (newQty > targetProduct.stock && delta > 0) {
           toast.warning(`Cannot exceed stock limit (${targetProduct.stock})`);
           return item;
        }
        return { ...item, quantity: Math.max(1, newQty) };
      }
      return item;
    }));
  };

  const clearCart = () => setCartItems([]);

  const isInWishlist = (productId) => {
    return wishlistItems.some(id => id?.toString() === productId?.toString());
  };

  const toggleWishlist = async (productId) => {
    if (!user) {
      toast.warning("Please sign in or create an account to save to Wishlist!");
      navigate('/login', { state: { from: location } });
      return;
    }
    
    const isAlreadyIn = isInWishlist(productId);
    const isAdding = !isAlreadyIn;
    
    // Update local state immediately
    setWishlistItems(prev => {
      if (isAlreadyIn) {
        return prev.filter(id => id?.toString() !== productId?.toString());
      }
      return [...prev, productId];
    });

    // Sync to database
    try {
      if (isAdding) {
        await axios.post(`${API}/api/wishlist`, { product_id: parseInt(productId) }, getAuthHeaders());
        toast.success("Added to Wishlist ❤️");
      } else {
        await axios.delete(`${API}/api/wishlist?product_id=${productId}`, getAuthHeaders());
        toast.info("Removed from Wishlist");
      }
    } catch (err) {
      console.warn("Failed to sync wishlist to backend:", err);
    }
  };

  const getProductById = (id) => products.find(p => p.id?.toString() === id?.toString());

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const product = getProductById(item.id);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const getCartCount = () => cartItems.reduce((count, item) => count + item.quantity, 0);

  const formatImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800'; // Fallback
    if (url.startsWith('http')) {
      // Normalize any 127.0.0.1 to localhost for browser compatibility
      return url.replace('127.0.0.1', 'localhost');
    }
    // If it's a frontend public asset (e.g. /assets/products/... or assets/products/...)
    if (url.startsWith('/assets') || url.startsWith('assets/')) {
      return url.startsWith('/') ? url : `/${url}`; 
    }
    // Otherwise, assume it's a backend upload
    return `${API}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const value = {
    cartItems, wishlistItems, isCartOpen, setIsCartOpen,
    addToCart, removeFromCart, updateQuantity, clearCart,
    toggleWishlist, isInWishlist, getCartTotal, getCartCount, getProductById, products, setProducts,
    formatImageUrl
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

