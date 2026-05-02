import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useShop, API } from '../context/ShopContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function UserDashboard() {
  const { user, logout, loading, updateUser } = useAuth();
  const { wishlistItems, formatImageUrl } = useShop();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('orders');

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
    if (!loading && !user) {
      navigate('/login');
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

  const cancelOrder = async (orderId) => {
    try {
      await axios.patch(`${API}/api/orders/${orderId}/cancel`, {}, {
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

  const deleteOrder = async (orderId) => {
    if(!window.confirm("Permanently remove this order from your history?")) return;
    try {
      await axios.delete(`${API}/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setOrders(orders.filter(o => o.id !== orderId));
      toast.success("Order removed.");
    } catch (err) {
      toast.error("Failed to delete order.");
    }
  };

  const requestReturn = async (tracking_id) => {
    const reason = window.prompt("Please provide a reason for the return:");
    if (!reason) return;
    try {
      await axios.post(`${API}/api/orders/${tracking_id}/return`, { reason }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success("Return requested successfully");
      const res = await axios.get(`${API}/api/orders`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setOrders(res.data.orders);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to request return");
    }
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
        `INR ${(item.product?.price || 0).toFixed(2)}`,
        `INR ${((item.product?.price || 0) * (item.quantity || 1)).toFixed(2)}`
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
    <div className="pb-8 bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-100">
          <div className="max-w-[1400px] mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 pt-0">
            <div>
              <h1 className="text-3xl font-black uppercase text-gray-900 tracking-tighter">My Dashboard</h1>
              <p className="mt-1 text-sm font-bold text-gray-400">Welcome back, {user.full_name}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="px-6 py-3 border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-white hover:bg-[#ff3366] hover:border-[#ff3366] transition-colors flex items-center gap-2 relative z-50"
            >
              <Icons.LogOut size={16} /> Logout
            </button>
          </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <div className="grid lg:grid-cols-[200px_1fr] gap-6">
          
          {/* Sidebar */}
          <aside className="space-y-2">
             {[
                { id: 'orders', icon: Icons.Package, label: 'My Orders' },
                { id: 'wishlist', icon: Icons.Heart, label: 'Wishlist', action: () => navigate('/wishlist') },
                { id: 'settings', icon: Icons.Settings, label: 'Account Settings' },
                { id: 'addresses', icon: Icons.MapPin, label: 'Addresses' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={tab.action || (() => setActiveTab(tab.id))}
                  className={`w-full flex items-center gap-4 text-left px-5 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === tab.id ? 'bg-[#ff3366] text-white shadow-md' : 'text-gray-500 hover:bg-white hover:text-gray-900'}`}
                >
                  <tab.icon size={18} /> {tab.label}
                </button>
             ))}
          </aside>

          {/* Main Content */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
             {activeTab === 'orders' && (
                <div>
                   <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-4">Active Shipments</h2>
                   
                   {orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-2xl mb-8 border border-dashed border-gray-200">
                         <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">No active shipments</h3>
                      </div>
                   ) : (
                      <div className="space-y-6 mb-12">
                         {orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').map(order => (
                            <div key={order.id} className="border border-gray-100 rounded-2xl p-4 relative bg-white shadow-sm hover:shadow-md transition-all">
                               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
                                  <div className="flex items-center gap-6">
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
                                        <p className="text-sm font-black text-[#ff3366] mt-1">₹{order.total_amount.toLocaleString()}</p>
                                     </div>
                                  </div>
                                  <div className="flex flex-wrap items-center justify-end gap-3">
                                     <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shrink-0 ${
                                        order.status === 'Out for Delivery' ? 'bg-rose-50 text-[#ff3366] border-rose-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                                     }`}>
                                        {order.status}
                                     </span>
                                     
                                     {order.status === 'Out for Delivery' && order.delivery_otp && (
                                       <div className="flex items-center gap-2 bg-rose-600 text-white px-4 py-1.5 rounded-full shadow-md">
                                          <Icons.ShieldCheck size={14} className="animate-pulse" />
                                          <span className="text-[10px] font-black uppercase tracking-widest">Active OTP: {order.delivery_otp}</span>
                                       </div>
                                     )}

                                     <Link to={`/track?id=${order.tracking_id}`} className="px-4 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-[#ff3366] transition-colors whitespace-nowrap shadow-md hover:shadow-lg">
                                        Track Live
                                     </Link>

                                  </div>
                               </div>
                               <div className="space-y-4">
                                  {order.items.map(item => (
                                     <div key={item.id} className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center p-2">
                                           <img src={formatImageUrl(item.product?.image)} alt="" className="max-w-full max-h-full object-contain" />
                                        </div>
                                        <div>
                                           <p className="text-sm font-black text-gray-900 uppercase">{item.product?.title}</p>
                                           <p className="text-xs font-bold text-gray-400">Qty: {item.quantity}</p>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                               {order.status === 'Processing' && (
                                  <button onClick={() => cancelOrder(order.id)} className="mt-4 text-xs font-bold text-gray-400 hover:text-[#ff3366] uppercase tracking-widest transition-colors">
                                     Cancel Order
                                  </button>
                               )}
                            </div>
                         ))}
                      </div>
                   )}

                   <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-4 mt-8">Past Orders</h2>
                   {orders.filter(o => ['Delivered', 'Cancelled', 'Return Requested', 'Returned'].includes(o.status)).length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                         <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">No past orders yet</h3>
                      </div>
                   ) : (
                      <div className="space-y-6 opacity-80 hover:opacity-100 transition-opacity">
                         {orders.filter(o => ['Delivered', 'Cancelled', 'Return Requested', 'Returned'].includes(o.status)).map(order => (
                            <div key={order.id} className="border border-gray-100 rounded-2xl p-4 relative bg-gray-50">
                               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-200 pb-4">
                                  <div className="flex items-center gap-6">
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
                                  </div>
                                  <div className="flex flex-wrap items-center justify-end gap-3">
                                     <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shrink-0 ${
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
                                          className="px-4 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-orange-500 transition-colors shadow-sm"
                                        >
                                           Return Order
                                        </button>
                                     )}

                                     <button 
                                       onClick={() => deleteOrder(order.id)} 
                                       className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                       title="Remove from history"
                                     >
                                        <Icons.Trash2 size={18} />
                                     </button>
                                  </div>
                               </div>
                               <div className="space-y-4">
                                  {order.items.map(item => (
                                     <div key={item.id} className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white border border-gray-100 rounded-lg flex items-center justify-center p-2 filter grayscale">
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
                            <button type="submit" className="bg-gray-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#ff3366] transition-colors">
                               Save Address
                            </button>
                            <button type="button" onClick={() => setIsEditingAddress(false)} className="bg-white border border-gray-200 text-gray-500 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-colors">
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
    </div>
  );
}
