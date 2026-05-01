import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import LottieAnimation from '../components/premium/LottieAnimation';
import axios from 'axios';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { API } from '../context/ShopContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

// Fix Leaflet marker icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Driver Icon
const driverIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
});

// Custom User Icon
const userMarkerIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1077/1077063.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

// Shop Icon
const shopIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/619/619153.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
});

// Home Icon
const homeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/25/25694.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

const shopCoords = [15.3784, 75.1274]; // Hubballi Shop Location

// Helper component to center map when coordinates change
function RecenterMap({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView(coords, 15);
  }, [coords, map]);
  return null;
}

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trackingId, setTrackingId] = useState('');
  const [orderInfo, setOrderInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [driverLocations, setDriverLocations] = useState({}); // { order_id: [lat, lng] }
  const [userCoords, setUserCoords] = useState(null);
  const [homeCoords, setHomeCoords] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const socketRef = useRef(null);

  useEffect(() => {
    if (orderInfo?.shipping_address) {
       const geocodeHome = async () => {
          try {
             const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(orderInfo.shipping_address)}&limit=1`);
             if (res.data && res.data.length > 0) {
                setHomeCoords([parseFloat(res.data[0].lat), parseFloat(res.data[0].lon)]);
             }
          } catch (err) {
             console.error("Geocoding error:", err);
          }
       };
       geocodeHome();
    }
  }, [orderInfo]);

  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        setLocationPermission(result.state);
        result.onchange = () => setLocationPermission(result.state);
      });
    }

    const id = searchParams.get('id');
    if (id) {
      setTrackingId(id);
      fetchOrder(id);
    }

    socketRef.current = io(API, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 5,
      timeout: 10000
    });

    socketRef.current.on('connect_error', (err) => {
       console.error("Socket Error:", err);
    });

    socketRef.current.on('location_broadcast', (data) => {
       console.log("Location received:", data);
       setDriverLocations(prev => ({ ...prev, [data.order_id]: [data.lat, data.lng] }));
    });

    socketRef.current.on('status_updated', (data) => {
       toast.info(`Order status updated to: ${data.status}`);
       if (orderInfo && orderInfo.items.some(i => i.order_id === data.order_id)) {
         fetchOrder(trackingId);
       }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [searchParams]);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = [position.coords.latitude, position.coords.longitude];
          setUserCoords(coords);
          setLocationPermission('granted');
          toast.success("Location enabled! We've found your position.");
        },
        () => {
          setLocationPermission('denied');
          toast.error("Location permission denied. Please check your browser settings and allow location access for this site.");
        }
      );
    }
  };

  const fetchOrder = async (tid) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await axios.get(`${API}/api/track/${tid.toUpperCase()}`);
      setOrderInfo(res.data);
      
      if (socketRef.current && res.data.items) {
        const orderIds = [...new Set(res.data.items.map(item => item.order_id))];
        orderIds.forEach(oid => {
           socketRef.current.emit('join_order_tracking', { order_id: oid });
        });
      }

      if (res.data.active_drivers) {
        const locations = {};
        res.data.active_drivers.forEach(d => {
           if (d.driver_lat && d.driver_lng) {
              locations[d.order_id] = [d.driver_lat, d.driver_lng];
           }
        });
        setDriverLocations(locations);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Tracking ID not found.');
      setOrderInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    fetchOrder(trackingId);
  };

  const statuses = [
    { key: 'ordered', label: 'Ordered', icon: Icons.ShoppingCart, desc: 'Your order is placed' },
    { key: 'packed', label: 'Packed', icon: Icons.Package, desc: 'Items are being packed' },
    { key: 'shipped', label: 'Shipped', icon: Icons.Truck, desc: 'On the way to you' },
    { key: 'delivered', label: 'Delivered', icon: Icons.Home, desc: 'Delivered successfully' }
  ];

  const getStatusIndex = (status) => {
    switch (status) {
      case 'Ordered': return 0;
      case 'Packed': return 1;
      case 'Shipped': return 2;
      case 'Out for Delivery': return 2.5;
      case 'Delivered': return 3;
      default: return 0;
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const handleDownloadInvoice = () => {
    if (!orderInfo) return;

    try {
      const doc = new jsPDF();
      const order = orderInfo;
      
      // Header Section
      doc.setFillColor(255, 51, 102); // #ff3366
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("LACES & SOLES", 10, 25);
      
      doc.setFontSize(14);
      doc.text("TAX INVOICE", 160, 20);
      doc.setFontSize(9);
      doc.text("lacesandsoles.in | support@lacesandsoles.in", 140, 30);

      // Order info columns
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(10);
      
      doc.setFont("helvetica", "bold");
      doc.text("BILL TO", 10, 55);
      doc.setFont("helvetica", "normal");
      doc.text(user?.full_name || "Customer", 10, 62);
      doc.text(user?.email || "", 10, 68);

      let y = 55;
      const rightX = 140;
      const labels = [
        ["Invoice No.", `INV-${new Date().getFullYear()}-${order.tracking_id.slice(-5)}`],
        ["Invoice Date", new Date().toLocaleDateString('en-GB')],
        ["Tracking ID", order.tracking_id],
        ["Total Orders", String(order.orders_count || 1)],
        ["Status", order.current_status]
      ];

      labels.forEach(([label, val]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, rightX, y);
        doc.setFont("helvetica", "normal");
        doc.text(val, rightX + 30, y);
        y += 7;
      });

      const tableData = order.items.map((item, index) => [
        index + 1,
        `${item.title}\n${item.brand || ''}`,
        item.quantity || 1,
        `INR ${(item.price || 0).toFixed(2)}`,
        `INR ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: 100,
        head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [26, 40, 61] },
        styles: { fontSize: 9 }
      });

      const finalY = (doc).lastAutoTable.finalY + 10;
      doc.setFont("helvetica", "bold");
      doc.text("GRAND TOTAL", rightX, finalY);
      doc.text(`INR ${order.total_amount.toFixed(2)}`, rightX + 55, finalY, { align: 'right' });

      doc.save(`Invoice_${order.tracking_id}.pdf`);
      toast.success("Invoice Downloaded!");
    } catch (err) {
      console.error("PDF GEN ERROR:", err);
      toast.error("Could not generate invoice.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] font-['Inter']">
      {/* Header with Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-[100] px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
           <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-rose-500 transition-colors">
              <Icons.ArrowLeft size={20} />
              <span className="text-sm font-black uppercase tracking-widest">Back</span>
           </button>
           
           <div className="flex flex-col items-end gap-2">
              <Link to="/login" className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-500 transition-all shadow-lg">
                 <Icons.User size={14} /> Driver Login
              </Link>
              {orderInfo && (
                <button 
                  onClick={handleDownloadInvoice}
                  className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                >
                   <Icons.Download size={12} /> Download Invoice
                </button>
              )}
           </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* Search Header */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-blue-500/10 p-10 text-center border border-gray-100 relative overflow-hidden">
           <div className="relative z-10 space-y-6">
              <div className="w-56 h-56 mx-auto -mb-4">
                <LottieAnimation src="/animations/delivery-bike.json" />
              </div>
              <h1 className="text-4xl font-black text-gray-950 uppercase tracking-tighter leading-tight">
                TRACK YOUR <span className="text-blue-500">FLASH SPEED</span> DELIVERY
              </h1>
              <p className="text-gray-400 font-bold max-w-md mx-auto">Enter your tracking number to see your order's real-time journey.</p>
              
              <form onSubmit={handleTrack} className="flex bg-gray-50 rounded-2xl p-2 max-w-xl mx-auto border border-gray-100 focus-within:border-blue-500 transition-all">
                <input 
                  type="text" 
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  placeholder="FKT5962053774"
                  className="flex-1 bg-transparent px-6 font-bold text-gray-900 outline-none placeholder:text-gray-300"
                />
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-blue-500 text-white px-8 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center min-w-[120px]"
                >
                  {loading ? <Icons.Loader2 className="animate-spin" /> : 'TRACK NOW'}
                </button>
              </form>
           </div>
        </div>

        {error && (
          <div className="bg-white p-10 rounded-3xl text-center border border-rose-50 shadow-xl">
            <div className="w-48 h-48 mx-auto">
              <LottieAnimation src="/animations/not-found.json" loop={false} />
            </div>
            <h2 className="text-2xl font-black text-gray-950 uppercase tracking-tighter -mt-4">ID NOT FOUND</h2>
            <p className="text-gray-400 mt-2 font-medium">{error}</p>
          </div>
        )}

        {orderInfo && (
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Left Side: Status & Map */}
            <div className="space-y-8">
               {/* Order Info Card */}
               <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                   <div className="flex justify-between items-center mb-6">
                      <div>
                         <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Estimated Arrival</p>
                         <p className="text-2xl font-black text-gray-950 uppercase tracking-tight">
                            {orderInfo.current_status === 'Out for Delivery' ? 'Arriving Soon' : 'Scheduled'}
                         </p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Global Status</p>
                         <span className="px-4 py-1.5 bg-green-50 text-green-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">{orderInfo.current_status}</span>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Items in this Tracking ID</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {orderInfo.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-lg transition-all group">
                               <div className="size-16 bg-white rounded-xl flex items-center justify-center p-2 shadow-sm shrink-0">
                                  <img src={item.image} alt="" className="max-w-full max-h-full object-contain" />
                               </div>
                               <div className="flex-1 min-w-0">
                                  <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-0.5">{item.brand}</p>
                                  <h4 className="text-xs font-black text-gray-950 uppercase truncate">{item.title}</h4>
                                  <div className="flex items-center gap-3 mt-1.5">
                                     <span className="text-[9px] font-bold text-gray-400 uppercase">Qty: {item.quantity}</span>
                                     <div className="size-1 bg-gray-200 rounded-full"></div>
                                     <span className={`text-[9px] font-black uppercase tracking-widest ${
                                        item.status === 'Delivered' ? 'text-green-500' : 
                                        item.status === 'Out for Delivery' ? 'text-[#ff3366]' : 'text-blue-500'
                                     }`}>{item.status}</span>
                                  </div>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                   <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{orderInfo.orders_count} Order{orderInfo.orders_count > 1 ? 's' : ''} Linked to this ID</p>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Grand Total</p>
                         <p className="text-3xl font-black text-[#ff3366] tracking-tighter">₹{orderInfo.total_amount.toLocaleString()}</p>
                      </div>
                   </div>
                </div>

               {/* Special Status Alerts */}
               {orderInfo.current_status === 'Delivery Attempt Failed' && (
                 <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex items-start gap-4">
                    <div className="size-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0">
                       <Icons.AlertTriangle size={20} />
                    </div>
                    <div>
                       <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Delivery Attempt Failed</h4>
                       <p className="text-xs text-amber-700 font-medium mt-1">
                          Our driver tried to deliver but: <span className="font-bold underline">{orderInfo.failure_reason || 'Customer not available'}</span>. 
                          We will re-attempt delivery within 24 hours.
                       </p>
                    </div>
                 </div>
               )}

               {orderInfo.current_status === 'Return Requested' && (
                 <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex items-start gap-4">
                    <div className="size-10 bg-rose-500 text-white rounded-xl flex items-center justify-center shrink-0">
                       <Icons.RotateCcw size={20} />
                    </div>
                    <div>
                       <h4 className="text-sm font-black text-rose-900 uppercase tracking-tight">Return in Progress</h4>
                       <p className="text-xs text-rose-700 font-medium mt-1">
                          Reason: <span className="font-bold underline">{orderInfo.return_reason}</span>. 
                          Our executive will visit your address for pickup soon.
                       </p>
                    </div>
                 </div>
               )}

               {/* Order Actions */}
               <div className="flex flex-wrap gap-4">
                 {(['Processing', 'Packed', 'Pending'].includes(orderInfo.current_status)) && (
                   <button 
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to cancel this order?")) {
                        try {
                          await axios.post(`${API}/api/orders/${orderInfo.tracking_id}/cancel`, {}, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                          });
                          toast.success("Order Cancelled Successfully");
                          fetchOrder(orderInfo.tracking_id);
                        } catch (err) {
                          toast.error(err.response?.data?.error || "Cancellation failed");
                        }
                      }
                    }}
                    className="flex-1 bg-white border-2 border-rose-500 text-rose-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/10"
                   >
                     Cancel Entire Order
                   </button>
                 )}

                 {orderInfo.current_status === 'Delivered' && (
                    <button 
                      onClick={async () => {
                        const reason = window.prompt("Please enter the reason for return (e.g. Wrong Size, Damaged):");
                        if (reason) {
                          try {
                            await axios.post(`${API}/api/orders/${orderInfo.tracking_id}/return`, { reason }, {
                              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                            });
                            toast.success("Return request submitted!");
                            fetchOrder(orderInfo.tracking_id);
                          } catch (err) {
                            toast.error(err.response?.data?.error || "Return failed");
                          }
                        }
                      }}
                      className="flex-1 bg-white border-2 border-blue-500 text-blue-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-blue-500/10"
                    >
                      Request Return
                    </button>
                 )}
               </div>

               {/* MAP SECTION */}
               <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-950/5 border border-gray-100 overflow-hidden relative">
                  <div className="absolute top-6 left-6 right-6 z-[99] flex justify-between items-center pointer-events-none">
                     <div className="px-5 py-3 bg-gray-950/90 backdrop-blur-md text-white rounded-2xl flex items-center gap-3 shadow-2xl pointer-events-auto">
                        <div className="size-2 bg-rose-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Tracking</span>
                     </div>
                     
                     {locationPermission !== 'granted' && (
                        <button 
                          onClick={requestLocation}
                          className="px-5 py-3 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl pointer-events-auto hover:bg-blue-600 transition-all animate-bounce"
                        >
                          Enable My Location
                        </button>
                     )}
                  </div>                   <div className="h-[500px] w-full bg-gray-100 flex items-center justify-center">
                    {(orderInfo.current_status === 'Out for Delivery' || userCoords) ? (
                       <MapContainer 
                        center={Object.values(driverLocations)[0] || userCoords || shopCoords} 
                        zoom={15} 
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={true}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {/* Static Shop Marker */}
                        <Marker position={shopCoords} icon={shopIcon}>
                           <Popup>
                              <div className="font-bold">Laces & Soles Shop</div>
                              <div className="text-xs">Hubballi, Karnataka</div>
                           </Popup>
                        </Marker>

                        {homeCoords && (
                           <Marker position={homeCoords} icon={homeIcon}>
                              <Popup>
                                 <div className="font-bold">Your Home Address</div>
                                 <div className="text-xs">{orderInfo.shipping_address}</div>
                              </Popup>
                           </Marker>
                        )}

                        {Object.values(driverLocations).map((coords, idx) => (
                           <Marker key={`driver-${idx}`} position={coords} icon={driverIcon} />
                        ))}

                        {userCoords && (
                           <Marker position={userCoords} icon={userMarkerIcon} />
                        )}

                        {/* Tracking Path Lines (one for each driver) */}
                        {Object.values(driverLocations).map((coords, idx) => (
                           <Polyline 
                             key={`path-${idx}`}
                             positions={[
                                shopCoords, 
                                coords, 
                                homeCoords || userCoords || shopCoords
                             ].filter(c => c)} 
                             color="#f43f5e" 
                             weight={4} 
                             opacity={0.6} 
                             dashArray="10, 10"
                           />
                        ))}
                        
                        {/* Fallback Polyline if no drivers are active yet */}
                        {Object.keys(driverLocations).length === 0 && (
                           <Polyline 
                             positions={[
                                shopCoords, 
                                homeCoords || userCoords || shopCoords
                             ].filter(c => c)} 
                             color="#f43f5e" 
                             weight={4} 
                             opacity={0.6} 
                             dashArray="10, 10"
                           />
                        )}

                        <RecenterMap coords={Object.values(driverLocations)[0] || userCoords || homeCoords} />
                      </MapContainer>
                    ) : (
                       <div className="text-center p-8 flex flex-col items-center">
                          <div className="w-48 h-48">
                            <LottieAnimation src="/animations/map-wait.json" />
                          </div>
                          <h3 className="text-xl font-black text-gray-950 uppercase tracking-tight mb-2">Map will activate shortly</h3>
                          <p className="text-sm text-gray-400 font-bold max-w-xs">Live tracking becomes available once your order is <span className="text-rose-500">Out for Delivery</span>.</p>
                       </div>
                    )}
                  </div>

                  {/* Driver Footer Card on Map */}
                  {orderInfo.current_status === 'Out for Delivery' && (
                    <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-2xl flex items-center justify-between gap-6 z-[99]">
                       <div className="flex items-center gap-4">
                          <div className="size-14 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                             <Icons.User size={30} />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Delivery Partner(s)</p>
                             <p className="text-lg font-black text-gray-950 uppercase tracking-tight">
                                {Object.keys(driverLocations).length > 1 
                                   ? `${Object.keys(driverLocations).length} Drivers En Route` 
                                   : 'Assigned Driver'}
                             </p>
                             <div className="flex items-center gap-2 mt-1">
                                <Icons.Star size={10} className="text-yellow-400 fill-yellow-400" />
                                <span className="text-[10px] font-black text-gray-900">4.9 (1k+ deliveries)</span>
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <button className="size-12 rounded-2xl bg-gray-950 text-white flex items-center justify-center hover:bg-rose-500 transition-all shadow-lg" title="Message Driver">
                             <Icons.MessageCircle size={20} />
                          </button>
                          <button className="size-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-all shadow-lg" title="Call Driver">
                             <Icons.Phone size={20} />
                          </button>
                       </div>
                    </div>
                  )}
               </div>
            </div>

            {/* Right Side: Timeline */}
            <div className="space-y-6">
               <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-black text-gray-950 uppercase tracking-tighter mb-8 flex items-center gap-3">
                     <Icons.History size={20} className="text-blue-500" />
                     Tracking Timeline
                  </h3>
                  
                  <div className="space-y-10 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                     {statuses.map((s, idx) => {
                        const statusIdx = getStatusIndex(orderInfo.current_status);
                        const isActive = statusIdx >= idx;
                        const isCurrent = Math.floor(statusIdx) === idx;
                        const timestamp = orderInfo.milestones[s.key];
                        const Icon = s.icon;
                        
                        return (
                          <div key={s.key} className="flex gap-6 relative">
                             <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 z-10 transition-all duration-500 ${
                                isActive ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-white text-gray-200 border border-gray-100'
                             }`}>
                                <Icon size={18} />
                             </div>
                             
                             <div className="pt-1">
                                <p className={`text-sm font-black uppercase tracking-widest ${isActive ? 'text-gray-950' : 'text-gray-300'}`}>{s.label}</p>
                                <p className="text-[10px] text-gray-400 font-bold mt-1">{s.desc}</p>
                                {timestamp && (
                                   <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-2">{formatDate(timestamp)}</p>
                                )}
                             </div>

                             {isCurrent && (
                                <div className="absolute left-[19px] top-4 size-2 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                             )}
                          </div>
                        );
                     })}
                  </div>
               </div>

               <div className="bg-gray-950 rounded-[32px] p-8 text-white relative overflow-hidden">
                  <div className="relative z-10">
                     <Icons.ShieldCheck size={32} className="text-blue-400 mb-4" />
                     <h4 className="text-lg font-black uppercase tracking-tighter mb-2">SECURE DELIVERY</h4>
                     <p className="text-xs text-gray-400 font-medium leading-relaxed">Your shipment is protected by Laces & Soles transit insurance. Contact support for any issues.</p>
                     <button className="mt-6 w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Support Center</button>
                  </div>
                  <Icons.Zap size={160} className="absolute bottom-[-40px] right-[-40px] opacity-10 rotate-12" />
               </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
