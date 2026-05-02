import { useState, useEffect } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import ZoneSelector from '../components/ZoneSelector';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { products, setProducts, formatImageUrl } = useShop(); 
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({ total_users: 0, active_accounts: 0, total_products: 0, total_revenue: 0, total_orders: 0 });
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeOrderSubTab, setActiveOrderSubTab] = useState('active');
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  
  const [isAdding, setIsAdding] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newProduct, setNewProduct] = useState({ title: '', price: '', oldPrice: '', brand: '', image: null, badge: '' });
  const [bulkData, setBulkData] = useState({ 
    basePrice: '2499', 
    randomize: true, 
    category: 'men',
    collection: 'urban-explorer',
    files: null 
  });

  const fetchMetrics = () => {
    const token = localStorage.getItem('token') || '';
    const headers = { 'Authorization': `Bearer ${token}` };
    fetch(`${API}/api/admin/metrics?period=${selectedPeriod}`, { headers })
      .then(res => res.json())
      .then(setMetrics);
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      const token = localStorage.getItem('token') || '';
      const headers = { 'Authorization': `Bearer ${token}` };

      fetchMetrics();

      fetch(`${API}/api/admin/users`, { headers })
        .then(res => res.json())
        .then(data => setUsers(data.users || []));

      fetch(`${API}/api/admin/orders`, { headers })
        .then(res => res.json())
        .then(data => setOrders(data.orders || []));

      fetch(`${API}/api/admin/drivers`, { headers })
        .then(res => res.json())
        .then(data => setDrivers(data.drivers || []));

      const socket = io(API);
      socket.on('order_placed', (data) => {
        setMetrics(prev => ({
          ...prev,
          total_orders: prev.total_orders + 1,
          total_revenue: prev.total_revenue + data.total_amount
        }));
        fetchMetrics();
      });

      return () => socket.disconnect();
    }
  }, [user, selectedPeriod]);

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin-login" replace />;
  }

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', newProduct.title);
    formData.append('price', newProduct.price);
    formData.append('brand', newProduct.brand);
    formData.append('oldPrice', newProduct.oldPrice);
    formData.append('badge', newProduct.badge);
    if (newProduct.image) formData.append('image', newProduct.image);

    try {
      const res = await fetch(`${API}/api/products`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setProducts([...products, data.product]);
        setIsAdding(false);
        setNewProduct({ title: '', price: '', oldPrice: '', brand: '', image: null, badge: '' });
        toast.success("Product added successfully!");
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Failed to add product");
      }
    } catch (err) {
      toast.error("An error occurred while adding the product");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      const res = await fetch(`${API}/api/products/${id}`, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` } 
      });
      if (res.ok) setProducts(products.filter(p => p.id !== id));
    } catch (err) {}
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!bulkData.files) return toast.error("Please select files first");
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('basePrice', bulkData.basePrice);
    formData.append('randomize', bulkData.randomize);
    formData.append('category', bulkData.category);
    formData.append('collection', bulkData.collection);
    for (let i = 0; i < bulkData.files.length; i++) formData.append('files', bulkData.files[i]);

    try {
      const res = await fetch(`${API}/api/products/bulk`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setIsBulkAdding(false);
        fetch(`${API}/api/products?limit=1000`).then(r => r.json()).then(d => setProducts(d.products));
      } else {
        toast.error(data.error || "Bulk import failed");
      }
    } catch (err) {
      toast.error("Import error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssignDriver = async (orderId, driverId) => {
    try {
      const res = await fetch(`${API}/api/admin/orders/${orderId}/assign`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ driver_id: driverId })
      });
      if (res.ok) {
        toast.success("Driver assigned successfully");
        fetch(`${API}/api/admin/orders`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` } })
        .then(res => res.json()).then(data => setOrders(data.orders || []));
      } else {
        const data = await res.json();
        toast.error(data.error || "Assignment failed");
      }
    } catch (err) {
      toast.error("Error assigning driver");
    }
  };

  const handleDownloadInvoice = (order) => {
    try {
      const doc = new jsPDF();
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
      doc.text(order.customer_name || "Customer", 10, 62);
      doc.text(order.customer_email || "", 10, 68);
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
        `${item.title || 'Product'}\n${item.brand || ''}`,
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

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Permanently delete this order?")) return;
    try {
      const res = await fetch(`${API}/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (res.ok) {
        setOrders(orders.filter(o => o.id !== orderId));
        toast.success("Order deleted");
      } else {
        const data = await res.json();
        toast.error(data.error || "Delete failed");
      }
    } catch (err) {
      toast.error("Error deleting order");
    }
  };

  const handleUpdateUserZone = async (userId, zones) => {
    try {
      const res = await fetch(`${API}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ delivery_zones: zones })
      });
      if(res.ok) {
        toast.success("Delivery zones updated");
        fetch(`${API}/api/admin/users`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
          .then(r => r.json()).then(d => setUsers(d.users || []));
      }
    } catch(err) {
      toast.error("Failed to update zones");
    }
  };

  const chartData = metrics.chart_data || [
    { name: 'Mon', revenue: 0 },
    { name: 'Tue', revenue: 0 },
    { name: 'Wed', revenue: 0 },
    { name: 'Thu', revenue: 0 },
    { name: 'Fri', revenue: 0 },
    { name: 'Sat', revenue: 0 },
    { name: 'Sun', revenue: 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-32 overflow-x-hidden selection:bg-rose-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-500/5 blur-[120px] rounded-full" />
      </div>

      <section className="relative pt-0 pb-6 border-b border-gray-200 bg-white z-10">
        <div className="mx-auto max-w-7xl px-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-50 rounded-2xl">
                <Icons.LayoutDashboard size={24} className="text-rose-500" />
              </div>
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.5em] font-heading">System Overview</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter font-heading leading-tight">
              ADMIN <span className="text-gray-300">DASHBOARD</span>
            </h1>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right hidden sm:block">
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Session Active</p>
               <p className="text-sm font-bold text-gray-950">{user.full_name}</p>
            </div>
            <button onClick={() => { logout(); navigate('/admin-login'); }} className="flex items-center gap-4 px-10 py-5 bg-gray-900 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-[20px] transition-all hover:-translate-y-1 active:scale-95 font-heading">
              <Icons.LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-8 mt-6 grid grid-cols-1 lg:grid-cols-5 gap-8 relative z-10">
        <aside className="lg:col-span-1 space-y-4">
          <div className="sticky top-32 space-y-3">
            {[
              { id: 'overview', label: 'Overview', icon: Icons.BarChart2 }, 
              { id: 'inventory', label: 'Products', icon: Icons.Package }, 
              { id: 'orders', label: 'Orders', icon: Icons.ShoppingCart },
              { id: 'users', label: 'Users', icon: Icons.Users }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`w-full flex items-center justify-between p-5 rounded-[24px] transition-all group active:scale-95 ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-xl shadow-gray-200/50 border border-gray-100' : 'text-gray-400 hover:text-gray-900 hover:bg-white'}`}
              >
                <div className="flex items-center gap-4">
                  <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={activeTab === tab.id ? 'text-rose-500' : 'text-gray-400 group-hover:text-rose-500'} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] font-heading">{tab.label}</span>
                </div>
                {activeTab === tab.id && <div className="h-1.5 w-1.5 bg-rose-500 rounded-full" />}
              </button>
            ))}
          </div>
        </aside>

        <main className="lg:col-span-4 space-y-10">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="h-1 w-12 bg-rose-500 rounded-full" />
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight font-heading">Performance Metrics</h2>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Total Revenue',
                    value: `₹${(metrics.total_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
                    icon: Icons.IndianRupee,
                    color: 'rose',
                    bg: 'bg-rose-50',
                    text: 'text-rose-500',
                    border: 'border-rose-100'
                  },
                  {
                    label: 'Total Orders',
                    value: metrics.total_orders || 0,
                    icon: Icons.ShoppingBag,
                    color: 'blue',
                    bg: 'bg-blue-50',
                    text: 'text-blue-500',
                    border: 'border-blue-100'
                  },
                  {
                    label: 'Total Users',
                    value: metrics.total_users || 0,
                    icon: Icons.Users,
                    color: 'emerald',
                    bg: 'bg-emerald-50',
                    text: 'text-emerald-500',
                    border: 'border-emerald-100'
                  },
                  {
                    label: 'Products',
                    value: metrics.total_products || 0,
                    icon: Icons.Package,
                    color: 'violet',
                    bg: 'bg-violet-50',
                    text: 'text-violet-500',
                    border: 'border-violet-100'
                  }
                ].map(({ label, value, icon: Icon, bg, text, border }) => (
                  <div key={label} className={`bg-white border ${border} rounded-[24px] p-6 shadow-lg flex flex-col gap-3`}>
                    <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                      <Icon size={18} className={text} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                      <p className="text-2xl font-black text-gray-900">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Period Switcher + Chart */}
              <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">Revenue Overview</p>
                  <div className="flex gap-2">
                    {[
                      { label: 'Week', value: '7d' },
                      { label: '6 Months', value: '6m' },
                      { label: 'Year', value: '1y' }
                    ].map(({ label, value }) => (
                      <button
                        key={value}
                        onClick={() => setSelectedPeriod(value)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          selectedPeriod === value
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} axisLine={false}
                        tickFormatter={v => v === 0 ? '0' : `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                        contentStyle={{ borderRadius: 12, border: '1px solid #f1f5f9', fontSize: 12 }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#f43f5e" strokeWidth={3} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: '#f43f5e' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl">
                  <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight font-heading">Inventory</h2>
                  <div className="flex gap-4">
                      <button onClick={() => { setIsBulkAdding(!isBulkAdding); setIsAdding(false); }} className="bg-rose-50 text-rose-500 px-8 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-widest">Bulk Import</button>
                      <button onClick={() => { setIsAdding(!isAdding); setIsBulkAdding(false); }} className="bg-gray-950 text-white px-8 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-widest">Add Product</button>
                  </div>
              </div>

              {isAdding && (
                <form onSubmit={handleAddProduct} className="grid grid-cols-2 gap-6 bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl">
                   <input required placeholder="Title" value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} className="bg-gray-50 rounded-2xl p-5 text-sm font-bold" />
                   <input required placeholder="Brand" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} className="bg-gray-50 rounded-2xl p-5 text-sm font-bold" />
                   <input required type="number" placeholder="Price" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="bg-gray-50 rounded-2xl p-5 text-sm font-bold" />
                   <input required type="file" onChange={e => setNewProduct({...newProduct, image: e.target.files[0]})} className="bg-gray-50 rounded-2xl p-5 text-sm font-bold" />
                   <button type="submit" className="col-span-2 bg-rose-500 text-white p-6 rounded-[24px] uppercase font-black text-[11px] tracking-widest">Save Product</button>
                </form>
              )}

              <div className="bg-white border border-gray-100 rounded-[40px] overflow-hidden shadow-xl">
                <table className="w-full text-left">
                  <thead className="bg-gray-50">
                    <tr><th className="p-8">Details</th><th className="p-8">Stock</th><th className="p-8">Price</th><th className="p-8"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map(p => {
                      const isNew = p.created_at && new Date(p.created_at) > new Date(Date.now() - 10 * 60 * 1000);
                      return (
                      <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${isNew ? 'bg-emerald-50/30' : ''}`}>
                        <td className="p-8 flex items-center gap-6">
                           <div className="relative">
                              <img src={formatImageUrl(p.image)} className="w-16 h-16 object-contain" />
                              {isNew && <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black">NEW</span>}
                           </div>
                          <div>
                            <p className="text-sm font-black uppercase">{p.title}</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase">{p.brand}</p>
                          </div>
                        </td>
                        <td className="p-8"><span className="text-[10px] font-black uppercase">{p.stock} Units</span></td>
                        <td className="p-8 font-black">₹{p.price.toLocaleString()}</td>
                        <td className="p-8 text-right">
                          <button onClick={() => handleDeleteProduct(p.id)} className="text-gray-400 hover:text-rose-500 transition-colors"><Icons.Trash2 size={20} /></button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl gap-6">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight font-heading">Orders</h2>
                    <div className="flex gap-4 mt-4">
                      <button 
                        onClick={() => setActiveOrderSubTab('active')} 
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeOrderSubTab === 'active' ? 'bg-rose-500 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                      >
                        Active Shipments
                      </button>
                      <button 
                        onClick={() => setActiveOrderSubTab('history')} 
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeOrderSubTab === 'history' ? 'bg-rose-500 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                      >
                        Orders History
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      setIsProcessing(true);
                      const res = await fetch(`${API}/api/admin/orders/flash-approve`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
                      const data = await res.json();
                      toast.success(data.message);
                      setIsProcessing(false);
                      fetch(`${API}/api/admin/orders`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()).then(d => setOrders(d.orders || []));
                    }}
                    className="bg-blue-600 text-white px-8 py-5 rounded-[22px] text-[10px] font-black uppercase tracking-widest flex items-center gap-4"
                  >
                    <Icons.Zap size={18} /> {isProcessing ? 'Processing...' : 'Flash Speed'}
                  </button>
              </div>

              <div className="bg-white border border-gray-100 rounded-[40px] overflow-hidden shadow-xl">
                 <table className="w-full text-left">
                  <thead className="bg-gray-50">
                    <tr><th className="p-8">Order ID</th><th className="p-8">Customer</th><th className="p-8">Status</th><th className="p-8">Assign</th><th className="p-8"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.filter(o => activeOrderSubTab === 'active' ? !['Delivered', 'Cancelled'].includes(o.status) : ['Delivered', 'Cancelled'].includes(o.status)).map(o => {
                      const isNew = o.created_at && new Date(o.created_at) > new Date(Date.now() - 10 * 60 * 1000);
                      return (
                      <tr key={o.id} className={`hover:bg-gray-50 transition-colors ${isNew ? 'bg-rose-50/30' : ''}`}>
                        <td className="p-8 font-black flex items-center gap-2">
                           #{o.tracking_id}
                           {isNew && <span className="bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-pulse">NEW</span>}
                        </td>
                        <td className="p-8"><p className="text-sm font-bold">{o.customer_name}</p></td>
                        <td className="p-8">
                           <span className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full bg-blue-50 text-blue-500 border border-blue-100">{o.status}</span>
                        </td>
                        <td className="p-8">
                          <select value={o.driver_id || ''} onChange={(e) => handleAssignDriver(o.id, e.target.value)} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-[10px] font-black">
                            <option value="">Unassigned</option>
                            {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                          </select>
                        </td>
                        <td className="p-8 text-right flex gap-2">
                           <button onClick={() => handleDownloadInvoice(o)} className="text-gray-400 hover:text-blue-500"><Icons.FileText size={18} /></button>
                           <button onClick={() => handleDeleteOrder(o.id)} className="text-gray-400 hover:text-rose-500"><Icons.Trash2 size={18} /></button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-12">
               <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight font-heading">Users</h2>
               <div className="bg-white border border-gray-100 rounded-[40px] shadow-xl">
                 <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-8 rounded-tl-[40px]">Identity</th>
                      <th className="p-8">Role</th>
                      <th className="p-8 rounded-tr-[40px]">Zones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u, idx) => {
                      const isNew = u.created_at && new Date(u.created_at) > new Date(Date.now() - 10 * 60 * 1000);
                      const isLast = idx === users.length - 1;
                      return (
                      <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${isNew ? 'bg-blue-50/30' : ''}`}>
                        <td className={`p-8 ${isLast ? 'rounded-bl-[40px]' : ''}`}>
                           <div className="flex items-center gap-3">
                              <p className="text-sm font-black uppercase">{u.full_name}</p>
                              {isNew && <span className="bg-blue-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black">NEW USER</span>}
                           </div>
                           <p className="text-[10px] text-gray-400 font-black uppercase">{u.email}</p>
                        </td>
                        <td className="p-8"><span className="px-6 py-2 text-[9px] font-black uppercase rounded-full bg-gray-50 border border-gray-100">{u.role}</span></td>
                        <td className={`p-8 ${isLast ? 'rounded-br-[40px]' : ''}`}>
                          {u.role === 'driver' ? (
                            <ZoneSelector currentZones={u.delivery_zones} onUpdate={(newZones) => handleUpdateUserZone(u.id, newZones)} />
                          ) : <span className="text-[10px] text-gray-300 italic">N/A</span>}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
