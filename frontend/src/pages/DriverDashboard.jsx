import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import * as Icons from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { API } from '../context/ShopContext';

export default function DriverDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    fetchOrders();
    // Connect to socket
    socketRef.current = io(API);
    
    socketRef.current.on('connect', () => {
      console.log("Connected to server socket");
    });

    socketRef.current.on('connect_error', (err) => {
      console.error("Socket connection error:", err);
      toast.error("Real-time connection failed. Live tracking may be disabled.");
    });

    const interval = setInterval(fetchOrders, 30000); // Auto-refresh every 30s
    fetchOrders();

    return () => {
      clearInterval(interval);
      if (socketRef.current) socketRef.current.disconnect();
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/driver/orders`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      setOrders(res.data.orders);
    } catch (err) {
      console.error("Failed to load assigned orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Remove this order from your dashboard?")) return;
    try {
      const res = await fetch(`${API}/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (res.ok) {
        setOrders(orders.filter(o => o.id !== orderId));
        toast.success("Order removed from view");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to remove order");
      }
    } catch (err) {
      toast.error("Error removing order");
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await axios.patch(`${API}/api/driver/orders/${orderId}/status`, { status: newStatus }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      toast.success(res.data.message || `Order marked as ${newStatus}`);
      fetchOrders();
      
      if (newStatus === 'Delivered') {
        stopTracking();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Status update failed");
    }
  };

  const startTracking = (orderId) => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by this browser");
      return;
    }

    setActiveOrderId(orderId);
    setIsTracking(true);
    updateStatus(orderId, 'Out for Delivery');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        socketRef.current.emit('update_driver_location', {
          order_id: orderId,
          lat: latitude,
          lng: longitude
        });
      },
      (err) => {
        toast.error("GPS Signal lost. Please check permissions.");
        setIsTracking(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setActiveOrderId(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Icons.Loader2 className="animate-spin text-rose-500" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-['Inter']">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400">
              DRIVER DASHBOARD
            </h1>
            <p className="text-gray-500 text-sm font-medium mt-1">Logged in as {user?.full_name}</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-full flex items-center gap-2">
                <div className={`size-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-zinc-700'}`}></div>
                <span className="text-xs font-bold uppercase tracking-widest">{isTracking ? 'Live Tracking Active' : 'Offline'}</span>
             </div>
             <button 
               onClick={() => {
                 localStorage.removeItem('token');
                 localStorage.removeItem('user');
                 window.location.href = '/login';
               }}
               className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-rose-500 hover:border-rose-500 transition-all text-zinc-400 hover:text-white"
             >
               <Icons.LogOut size={20} />
             </button>
          </div>
        </header>

        <div className="grid gap-6">
          {orders.length === 0 ? (
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-20 text-center">
              <Icons.PackageOpen size={64} className="mx-auto text-zinc-700 mb-4" />
              <h2 className="text-xl font-bold text-zinc-400">No active deliveries assigned</h2>
              <p className="text-zinc-600 mt-2">Wait for the admin to assign you new orders.</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase">Order ID</span>
                    <h3 className="text-xl font-black mt-1">#{order.tracking_id}</h3>
                  </div>
                   <div className="flex items-center gap-3">
                    <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      order.status === 'Delivered' ? 'bg-green-500/10 text-green-500' : 
                      order.status === 'Out for Delivery' ? 'bg-rose-500/10 text-rose-500' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {order.status}
                    </div>
                    <button 
                      onClick={() => handleDeleteOrder(order.id)}
                      className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                    >
                      <Icons.Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mb-8 bg-zinc-950/30 p-4 rounded-2xl border border-zinc-800/50">
                   <div className="flex justify-between items-center mb-2">
                      <p className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">Customer Details</p>
                      <div className="flex items-center gap-2">
                         <Icons.Navigation size={12} className="text-rose-500" />
                         <span className="text-[10px] font-black text-rose-500 uppercase">{order.distance_km} KM AWAY</span>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                         <div className="p-2 bg-rose-500/10 rounded-lg">
                            <Icons.Phone size={14} className="text-rose-500" />
                         </div>
                         <div>
                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">Phone</p>
                            <p className="text-xs font-bold text-white">{order.customer_phone || 'Not Provided'}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                         <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Icons.Mail size={14} className="text-blue-500" />
                         </div>
                         <div className="min-w-0">
                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">Email</p>
                            <p className="text-xs font-bold text-white truncate">{order.customer_email}</p>
                         </div>
                      </div>
                   </div>
                   <div className="mt-2 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter mb-1">Shipping Address</p>
                      <p className="text-xs font-medium text-zinc-300 line-clamp-2 leading-relaxed">{order.shipping_address}</p>
                   </div>
                </div>

                <div className="flex flex-col gap-3 mb-8 bg-zinc-950/30 p-4 rounded-2xl border border-zinc-800/50">
                   <p className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">Delivery Items</p>
                   <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-4 bg-zinc-900/80 p-3 rounded-2xl min-w-[280px] border border-zinc-800">
                           <div className="size-20 bg-white rounded-xl p-2 flex items-center justify-center shrink-0 shadow-xl">
                              <img src={item.product?.image} alt="" className="max-w-full max-h-full object-contain" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">{item.product?.brand}</p>
                              <h4 className="text-sm font-black text-white uppercase truncate">{item.product?.title}</h4>
                              <div className="flex items-center gap-3 mt-2">
                                 <span className="text-[10px] font-bold text-zinc-500 uppercase">Qty: {item.quantity}</span>
                                 <div className="size-1 bg-zinc-700 rounded-full"></div>
                                 <span className="text-[10px] font-black text-zinc-300 uppercase tracking-tighter">₹{item.price.toLocaleString()}</span>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  {order.status === 'Packed' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'Shipped')}
                      className="flex-1 bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <Icons.Truck size={18} /> MARK AS SHIPPED
                    </button>
                  )}

                  {order.status === 'Shipped' && (
                    <button 
                      onClick={() => startTracking(order.id)}
                      className="flex-1 bg-rose-600 text-white font-black py-4 rounded-2xl hover:bg-rose-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20"
                    >
                      <Icons.MapPin size={18} /> START DELIVERY & TRACKING
                    </button>
                  )}

                    <div className="w-full space-y-4">
                      <div className="flex gap-4">
                        <button 
                          onClick={() => {
                            const reason = window.prompt("Reason for failure (e.g. User not available, Locked house):");
                            if (reason) {
                              axios.patch(`${API}/api/driver/orders/${order.id}/fail`, { reason }, {
                                headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
                              }).then(() => {
                                toast.warning("Delivery marked as failed");
                                fetchOrders();
                              });
                            }
                          }}
                          className="px-6 bg-zinc-800 text-rose-500 border border-rose-500/30 font-black py-4 rounded-2xl hover:bg-rose-500/10 transition-all flex items-center justify-center gap-2"
                        >
                           <Icons.XCircle size={18} /> FAIL
                        </button>

                        {!order.delivery_otp ? (
                          <button 
                            onClick={async () => {
                              try {
                                const res = await axios.post(`${API}/api/driver/orders/${order.id}/send-otp`, {}, {
                                  headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
                                });
                                toast.info(`OTP sent to customer: ${res.data.otp}`);
                                fetchOrders();
                              } catch (err) {
                                toast.error("Failed to send OTP");
                              }
                            }}
                            className="flex-1 bg-zinc-800 text-white font-black py-4 rounded-2xl hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <Icons.Send size={18} /> SEND VERIFICATION OTP
                          </button>
                        ) : !order.is_otp_verified ? (
                          <div className="flex-1 bg-zinc-800/50 border border-zinc-700 p-4 rounded-2xl">
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-3 text-center">Verify Delivery Code</p>
                            <div className="flex gap-2">
                               <input 
                                 type="text" 
                                 placeholder="Enter 6-digit OTP" 
                                 id={`otp-${order.id}`}
                                 className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm font-black text-center tracking-[0.5em] outline-none focus:border-rose-500"
                               />
                               <button 
                                 onClick={async () => {
                                   const otp = document.getElementById(`otp-${order.id}`).value;
                                   try {
                                     await axios.post(`${API}/api/driver/orders/${order.id}/verify-otp`, { otp }, {
                                       headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
                                     });
                                     toast.success("OTP Verified Successfully!");
                                     fetchOrders();
                                   } catch (err) {
                                     toast.error("Invalid OTP Code");
                                   }
                                 }}
                                 className="px-6 bg-rose-600 text-white font-black rounded-xl hover:bg-rose-500 transition-colors"
                               >
                                 VERIFY
                               </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex gap-4">
                            <button 
                              onClick={() => updateStatus(order.id, 'Delivered')}
                              className="flex-1 bg-green-600 text-white font-black py-4 rounded-2xl hover:bg-green-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                            >
                              <Icons.CheckCircle size={18} /> COMPLETE DELIVERY
                            </button>
                            <button 
                              onClick={() => stopTracking()}
                              className="px-6 bg-zinc-800 text-white font-black py-4 rounded-2xl hover:bg-zinc-700 transition-colors"
                            >
                              PAUSE
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                  
                  {order.status === 'Delivered' && (
                    <div className="w-full py-4 text-center text-green-500 font-bold bg-green-500/5 rounded-2xl border border-green-500/20 flex items-center justify-center gap-2">
                       <Icons.CheckCheck size={18} /> DELIVERY COMPLETED
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
