import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useShop, API } from '../context/ShopContext';
import { toast } from 'react-toastify';
import ConfirmModal from '../components/ConfirmModal';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function UserDashboard() {
  const { user, logout, loading, updateUser } = useAuth();
  const { wishlistItems, formatImageUrl } = useShop();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('orders');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', showInput: false, placeholder: '', defaultValue: '', onConfirm: null });

  // Address Form States
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressData, setAddressData] = useState({
    full_name: user?.full_name || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zip_code: user?.zip_code || ''
  });

  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await axios.post(`${API}/api/user/update`, addressData, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      updateUser(res.data.user);
      setIsEditingAddress(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update profile");
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'driver') {
        navigate('/driver', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && activeTab === 'orders') {
      axios.get(`${API}/api/orders`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => {
        setOrders(res.data.orders || []);
      })
      .catch(err => console.error("Failed to fetch orders:", err));
    }
  }, [user, activeTab]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const cancelOrder = async (trackingId) => {
    try {
      await axios.post(`${API}/api/orders/${trackingId}/cancel`, {}, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success("Order cancelled");
      // Refresh orders
      const res = await axios.get(`${API}/api/orders`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setOrders(res.data.orders);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to cancel order");
    }
  };

  const deleteOrder = (orderId) => {
    setConfirmModal({
      isOpen: true,
      title: "Remove Order History",
      message: "Are you sure you want to permanently remove this order from your history?",
      showInput: false,
      onConfirm: async () => {
        try {
          await axios.delete(`${API}/api/orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          setOrders(orders.filter(o => o.id !== orderId));
          toast.success("Order removed.");
        } catch (err) {
          toast.error("Failed to delete order.");
        }
      }
    });
  };

  const requestReturn = (tracking_id) => {
    setConfirmModal({
      isOpen: true,
      title: "Request Return",
      message: "Please specify the reason for return below:",
      showInput: true,
      placeholder: "e.g. Wrong Size, Damaged, Don't want it anymore",
      defaultValue: "",
      onConfirm: async (reason) => {
        if (!reason || !reason.trim()) {
          toast.error("A return reason is required.");
          return;
        }
        try {
          await axios.post(`${API}/api/orders/${tracking_id}/return`, { reason }, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          toast.success("Return request submitted.");
          // Refresh orders
          const res = await axios.get(`${API}/api/orders`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          setOrders(res.data.orders);
        } catch (err) {
          toast.error(err.response?.data?.error || "Failed to submit return request");
        }
      }
    });
  };

  const handleDownloadInvoice = (order) => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(255, 51, 102);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("LACES & SOLES", 10, 25);
      
      doc.setFontSize(14);
      doc.text("TAX INVOICE", 160, 20);

      doc.setTextColor(40, 40, 40);
      doc.setFontSize(10);
      doc.text("BILL TO", 10, 55);
      doc.text(user?.full_name || "Customer", 10, 62);
      doc.text(user?.email || "", 10, 68);

      let y = 55;
      const rightX = 140;
      const labels = [
        ["Invoice Date", new Date().toLocaleDateString('en-GB')],
        ["Order ID", `#${order.id}`],
        ["Tracking ID", order.tracking_id],
        ["Status", order.status]
      ];

      labels.forEach(([label, val]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, rightX, y);
        doc.setFont("helvetica", "normal");
        doc.text(String(val), rightX + 30, y);
        y += 7;
      });

      const tableData = order.items.map((item, index) => [
        index + 1,
        `${item.product?.title || 'Product'}\n${item.product?.brand || ''}`,
        item.quantity || 1,
        `INR ${(item.price || 0).toFixed(2)}`,
        `INR ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: 100,
        head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [26, 40, 61] }
      });

      const finalY = (doc).lastAutoTable.finalY + 10;
      doc.setFont("helvetica", "bold");
      doc.text("GRAND TOTAL", rightX, finalY);
      doc.text(`INR ${order.total_amount.toFixed(2)}`, rightX + 55, finalY, { align: 'right' });

      doc.save(`Invoice_${order.tracking_id}.pdf`);
      toast.success("Invoice Downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate invoice");
    }
  };

  return (
    <div className="pt-20 sm:pt-24 pb-12 bg-gray-50/50 min-h-screen mesh-gradient">
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100/80 sticky top-[64px] sm:top-[72px] z-30 shadow-sm transition-all duration-300">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase text-gray-900 tracking-tight font-heading flex items-center gap-3">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-pink-600">My Dashboard</span>
              </h1>
              <p className="mt-1 text-xs font-black uppercase tracking-wider text-gray-400">Welcome back, {user.full_name}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="px-5 py-2.5 sm:px-6 sm:py-3 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white hover:bg-gradient-to-r hover:from-rose-500 hover:to-pink-600 hover:border-transparent hover:shadow-[0_4px_15px_rgba(244,63,94,0.3)] transition-all duration-350 flex items-center gap-2 relative z-50 cursor-pointer active:scale-95"
            >
              <Icons.LogOut size={14} className="transition-transform group-hover:translate-x-1" /> Logout
            </button>
          </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid lg:grid-cols-[220px_1fr] gap-6 sm:gap-8">
          
          {/* Sidebar — scrollable tabs on mobile, fixed sidebar on lg+ */}
          <aside>
            {/* Mobile: Horizontal scroll tabs */}
            <div className="flex lg:hidden overflow-x-auto gap-2 pb-2 no-scrollbar mb-4">
             {[
                { id: 'orders', icon: Icons.Package, label: 'Orders' },
                { id: 'wishlist', icon: Icons.Heart, label: 'Wishlist', action: () => navigate('/wishlist') },
                { id: 'settings', icon: Icons.Settings, label: 'Settings' },
                { id: 'addresses', icon: Icons.MapPin, label: 'Addresses' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={tab.action || (() => setActiveTab(tab.id))}
                  className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                    activeTab === tab.id 
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md' 
                      : 'text-gray-500 bg-white border border-gray-100'
                  }`}
                >
                  <tab.icon size={14} /> 
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
            {/* Desktop: Vertical sidebar */}
            <div className="hidden lg:flex flex-col space-y-2.5">
             {[
                { id: 'orders', icon: Icons.Package, label: 'My Orders' },
                { id: 'wishlist', icon: Icons.Heart, label: 'Wishlist', action: () => navigate('/wishlist') },
                { id: 'settings', icon: Icons.Settings, label: 'Account Settings' },
                { id: 'addresses', icon: Icons.MapPin, label: 'Addresses' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={tab.action || (() => setActiveTab(tab.id))}
                  className={`w-full flex items-center gap-4 text-left px-5 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 transform active:scale-95 cursor-pointer ${
                    activeTab === tab.id 
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-[0_6px_20px_rgba(244,63,94,0.25)] border border-rose-400/10 scale-[1.02]' 
                      : 'text-gray-500 bg-white/60 hover:bg-white hover:text-rose-500 hover:shadow-md border border-transparent'
                  }`}
                >
                  <tab.icon size={16} className={`transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`} /> 
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
             {activeTab === 'orders' && (
                <div>
                   <h2 className="text-base font-black text-gray-900 uppercase tracking-tighter mb-3">Active Shipments</h2>
                   
                   {orders.filter(o => o.status !== 'Delivered' && !o.status?.includes('Cancelled')).length === 0 ? (
                      <div className="text-center py-4 bg-gray-50 rounded-xl mb-4 border border-dashed border-gray-200">
                         <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">No active shipments</h3>
                      </div>
                   ) : (
                      <div className="space-y-3 mb-6">
                         {orders.filter(o => o.status !== 'Delivered' && !o.status?.includes('Cancelled')).map(order => (
                            <div key={order.id} className="border border-gray-100 rounded-xl p-3 relative bg-white shadow-sm hover:shadow-md transition-all">
                               <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-gray-100 pb-3">
                                  <div className="flex items-center gap-4">
                                     <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tracking ID</p>
                                        <p className="text-sm font-black text-gray-950 mt-1">#{order.tracking_id}</p>
                                     </div>
                                     <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Placed On</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1">
                                           {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(order.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                        </p>
                                     </div>
                                     <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total</p>
                                        <p className="text-sm font-black text-rose-500 mt-1">₹{order.total_amount.toLocaleString()}</p>
                                     </div>
                                  </div>
                                  <div className="flex flex-wrap items-center justify-end gap-3">
                                     <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shrink-0 ${
                                        order.status === 'Out for Delivery' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                                     }`}>
                                        {order.status}
                                     </span>
                                     
                                     {order.status === 'Out for Delivery' && order.delivery_otp && (
                                       <div className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white px-4 py-1.5 rounded-full shadow-md">
                                          <Icons.ShieldCheck size={14} className="animate-pulse" />
                                          <span className="text-xs font-black uppercase tracking-wider">Active OTP: {order.delivery_otp}</span>
                                       </div>
                                     )}

                                     <Link to={`/track?id=${order.tracking_id}`} className="px-5 py-2 bg-gray-900 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-gradient-to-r hover:from-rose-500 hover:to-pink-600 hover:shadow-[0_4px_15px_rgba(244,63,94,0.35)] transition-all duration-300 whitespace-nowrap active:scale-95">
                                        Track Live
                                     </Link>

                                  </div>
                               </div>
                               <div className="flex flex-wrap gap-3">
                                  {order.items.map(item => (
                                     <div key={item.id} className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center p-1 border border-gray-100">
                                           <img src={formatImageUrl(item.product?.image)} alt="" className="max-w-full max-h-full object-contain animate-pulse-gentle" />
                                        </div>
                                        <div>
                                           <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.product?.title}</p>
                                           <p className="text-xs font-bold text-gray-400">Qty: {item.quantity}</p>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                               {order.status === 'Processing' && (
                                  <button onClick={() => cancelOrder(order.tracking_id)} className="mt-4 text-xs font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest transition-colors cursor-pointer active:scale-95">
                                     Cancel Order
                                  </button>
                               )}
                            </div>
                         ))}
                      </div>
                   )}

                   <h2 className="text-base font-black text-gray-900 uppercase tracking-tighter mb-3 mt-5">Past Orders</h2>
                   {orders.filter(o => ['Delivered', 'Return Requested', 'Returned'].includes(o.status) || o.status?.includes('Cancelled')).length === 0 ? (
                      <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                         <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">No past orders yet</h3>
                      </div>
                   ) : (
                      <div className="space-y-2 opacity-80 hover:opacity-100 transition-opacity">
                         {orders.filter(o => ['Delivered', 'Return Requested', 'Returned'].includes(o.status) || o.status?.includes('Cancelled')).map(order => (
                            <div key={order.id} className="border border-gray-100 rounded-xl p-3 relative bg-gray-50">
                               <div className="flex flex-wrap items-center justify-between gap-2 mb-2 border-b border-gray-200 pb-2">
                                  <div className="flex items-center gap-4">
                                     <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tracking ID</p>
                                        <p className="text-sm font-black text-gray-600 mt-1">#{order.tracking_id}</p>
                                     </div>
                                     <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Placed On</p>
                                        <p className="text-sm font-bold text-gray-600 mt-1">
                                           {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(order.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                        </p>
                                     </div>
                                  </div>
                                  <div className="flex flex-wrap items-center justify-end gap-3">
                                     <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shrink-0 ${
                                        order.status === 'Delivered' ? 'bg-green-50 text-green-600 border-green-100' :
                                        order.status === 'Returned' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                        order.status === 'Return Requested' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                        'bg-red-50 text-red-600 border-red-100'
                                     }`}>
                                        {order.status}
                                     </span>
                                                                        {order.status === 'Delivered' && (
                                        <button 
                                          onClick={() => requestReturn(order.tracking_id)} 
                                          className="px-4 py-2 bg-gray-900 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-orange-500 hover:shadow-[0_4px_12px_rgba(249,115,22,0.25)] transition-all duration-300 transform active:scale-95 cursor-pointer"
                                        >
                                           Return Order
                                        </button>
                                     )}

                                     <button 
                                       onClick={() => handleDownloadInvoice(order)} 
                                       className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all duration-300 cursor-pointer active:scale-90"
                                       title="Download Invoice"
                                     >
                                        <Icons.FileText size={18} />
                                     </button>
 
                                     <button 
                                       onClick={() => deleteOrder(order.id)} 
                                       className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50/50 rounded-xl transition-all duration-300 cursor-pointer active:scale-90"
                                       title="Remove from history"
                                     >
                                        <Icons.Trash2 size={18} />
                                     </button>
                                  </div>
                               </div>
                               <div className="flex flex-wrap gap-3">
                                  {order.items.map(item => (
                                     <div key={item.id} className="flex items-center gap-4">
                                        <div className="w-8 h-8 bg-white border border-gray-100 rounded-md flex items-center justify-center p-1 filter grayscale">
                                           <img src={formatImageUrl(item.product?.image)} alt="" className="max-w-full max-h-full object-contain" />
                                        </div>
                                        <div>
                                           <p className="text-xs font-black text-gray-600 uppercase">{item.product?.title}</p>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             )}

             {activeTab === 'settings' && (
                <div>
                   <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-4">Account Settings</h2>
                   <div className="max-w-md space-y-6">
                      <div>
                         <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                         <input type="text" value={addressData.full_name} onChange={(e) => setAddressData({...addressData, full_name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#ff3366]" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                         <input type="email" defaultValue={user.email} disabled className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-500" />
                      </div>
                      <button onClick={handleUpdateProfile} className="bg-gray-900 text-white px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#ff3366] transition-colors mt-4">
                         Save Changes
                      </button>
                   </div>
                </div>
             )}

             {activeTab === 'addresses' && (
                <div>
                   <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Saved Addresses</h2>
                      {!isEditingAddress && (
                         <button 
                           onClick={() => setIsEditingAddress(true)}
                           className="flex items-center gap-2 text-[#ff3366] font-bold text-xs uppercase tracking-widest hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors"
                         >
                            <Icons.Edit3 size={14} /> Edit Address
                         </button>
                      )}
                   </div>
                   
                   {!isEditingAddress ? (
                      <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50 inline-block min-w-[300px]">
                         <p className="text-sm font-black text-gray-900 uppercase">{user.full_name}</p>
                         <div className="mt-2 text-sm text-gray-500 font-medium">
                            <p>{user.address || 'No address saved'}</p>
                            <p>{user.city}{user.state ? `, ${user.state}` : ''}</p>
                            <p>{user.zip_code}{user.zip_code ? ', India' : ''}</p>
                         </div>
                      </div>
                   ) : (
                      <form onSubmit={handleUpdateProfile} className="max-w-xl space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                         <div className="grid md:grid-cols-2 gap-4">
                            <div>
                               <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Full Name</label>
                               <input 
                                 type="text" 
                                 value={addressData.full_name}
                                 onChange={(e) => setAddressData({...addressData, full_name: e.target.value})}
                                 className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-[#ff3366]" 
                               />
                            </div>
                            <div>
                               <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Street Address</label>
                               <input 
                                 type="text" 
                                 value={addressData.address}
                                 onChange={(e) => setAddressData({...addressData, address: e.target.value})}
                                 className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-[#ff3366]" 
                               />
                            </div>
                            <div>
                               <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">City</label>
                               <input 
                                 type="text" 
                                 value={addressData.city}
                                 onChange={(e) => setAddressData({...addressData, city: e.target.value})}
                                 className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-[#ff3366]" 
                               />
                            </div>
                            <div>
                               <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">State</label>
                               <input 
                                 type="text" 
                                 value={addressData.state}
                                 onChange={(e) => setAddressData({...addressData, state: e.target.value})}
                                 className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-[#ff3366]" 
                               />
                            </div>
                            <div>
                               <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">ZIP Code</label>
                               <input 
                                 type="text" 
                                 value={addressData.zip_code}
                                 onChange={(e) => setAddressData({...addressData, zip_code: e.target.value})}
                                 className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-[#ff3366]" 
                               />
                            </div>
                         </div>
                         <div className="flex gap-3 pt-2">
                            <button type="submit" className="bg-gray-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-gradient-to-r hover:from-rose-500 hover:to-pink-600 hover:shadow-[0_4px_15px_rgba(244,63,94,0.3)] transition-all duration-300 transform active:scale-95 cursor-pointer">
                               Save Address
                            </button>
                            <button type="button" onClick={() => setIsEditingAddress(false)} className="bg-white border border-gray-200 text-gray-500 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-gray-50 hover:text-gray-900 transition-all duration-300 transform active:scale-95 cursor-pointer">
                               Cancel
                            </button>
                         </div>
                      </form>
                   )}
                </div>
             )}
          </div>

        </div>
      </div>
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        showInput={confirmModal.showInput}
        placeholder={confirmModal.placeholder}
        defaultValue={confirmModal.defaultValue}
      />
    </div>
  );
}

