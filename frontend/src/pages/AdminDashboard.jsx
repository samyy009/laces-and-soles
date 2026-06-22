import { useState, useEffect } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import ZoneSelector from '../components/ZoneSelector';
import ConfirmModal from '../components/ConfirmModal';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { products, setProducts, formatImageUrl } = useShop(); 
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({ total_users: 0, active_accounts: 0, total_products: 0, total_revenue: 0, total_orders: 0 });
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [newsletterData, setNewsletterData] = useState({ subject: '', message: '' });
  const [activeTab, setActiveTab] = useState('overview');
  const [activeOrderSubTab, setActiveOrderSubTab] = useState('active');
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  // ── Email Logs state ──
  const [emailLogs, setEmailLogs] = useState([]);
  const [emailStats, setEmailStats] = useState({ total_sent: 0, total_failed: 0, by_type: {} });
  const [emailLogFilter, setEmailLogFilter] = useState({ type: '', status: '' });
  const [isLive, setIsLive] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newProduct, setNewProduct] = useState({ title: '', price: '', oldPrice: '', brand: '', image: null, badge: '' });
  const [editProductForm, setEditProductForm] = useState({ title: '', price: '', brand: '', image: null });
  const [bulkData, setBulkData] = useState({ 
    basePrice: '2499', 
    randomize: true, 
    category: 'men',
    collection: 'urban-explorer',
    files: null 
  });
  const [newCoupon, setNewCoupon] = useState({ code: '', discount_percentage: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const authHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` });

  const fetchMetrics = () => {
    fetch(`${API}/api/admin/metrics?period=${selectedPeriod}`, { headers: authHeaders() })
      .then(res => res.json()).then(setMetrics).catch(() => {});
  };

  const fetchEmailLogs = (filters = emailLogFilter) => {
    let url = `${API}/api/admin/email-logs?per_page=100`;
    if (filters.type) url += `&type=${filters.type}`;
    if (filters.status) url += `&status=${filters.status}`;
    fetch(url, { headers: authHeaders() })
      .then(res => res.json())
      .then(data => setEmailLogs(data.logs || []))
      .catch(() => {});
    fetch(`${API}/api/admin/email-stats`, { headers: authHeaders() })
      .then(res => res.json())
      .then(data => setEmailStats(data))
      .catch(() => {});
  };

  const fetchAllData = () => {
    const h = authHeaders();
    fetch(`${API}/api/admin/dashboard-all?period=${selectedPeriod}`, { headers: h })
      .then(res => res.json())
      .then(data => {
        if (data.metrics) setMetrics(data.metrics);
        if (data.users) setUsers(data.users);
        if (data.orders) setOrders(data.orders);
        if (data.drivers) setDrivers(data.drivers);
        if (data.coupons) setCoupons(data.coupons);
        if (data.subscribers) setSubscribers(data.subscribers);
        if (data.email_logs) setEmailLogs(data.email_logs);
        if (data.email_stats) setEmailStats(data.email_stats);
        setLastRefresh(new Date());
      })
      .catch((err) => console.error("Failed to load dashboard all data:", err));
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAllData();

      // ── Realtime: poll every 30 seconds ──
      const pollInterval = setInterval(() => {
        setIsLive(true);
        fetchAllData();
        setTimeout(() => setIsLive(false), 1500);
      }, 30000);

      // ── Socket.io for instant order events ──
      const socket = io(API);
      socket.on('order_placed', () => { fetchAllData(); });
      socket.on('status_updated', () => { fetchAllData(); });

      return () => { socket.disconnect(); clearInterval(pollInterval); };
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

  const handleDeleteProduct = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Product",
      message: "Are you sure you want to permanently delete this product?",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API}/api/products/${id}`, { 
            method: 'DELETE', 
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` } 
          });
          if (res.ok) {
            setProducts(products.filter(p => p.id !== id));
            toast.success("Product deleted successfully");
          } else {
            toast.error("Failed to delete product");
          }
        } catch (err) {
          toast.error("Error deleting product");
        }
      }
    });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    if (editProductForm.title) formData.append('title', editProductForm.title);
    if (editProductForm.price) formData.append('price', editProductForm.price);
    if (editProductForm.brand) formData.append('brand', editProductForm.brand);
    if (editProductForm.image) formData.append('image', editProductForm.image);

    try {
      const res = await fetch(`${API}/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(products.map(p => p.id === editingProduct.id ? data.product : p));
        setEditingProduct(null);
        toast.success("Product updated successfully!");
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Failed to update product");
      }
    } catch (err) {
      toast.error("An error occurred while updating");
    }
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
      const res = await fetch(`${API}/api/admin/bulk-import`, {
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

  const handleApproveReturn = async (orderId) => {
    try {
      const res = await fetch(`${API}/api/admin/orders/${orderId}/approve-return`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (res.ok) {
        toast.success("Return approved and items restocked");
        fetch(`${API}/api/admin/orders`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` } })
        .then(res => res.json()).then(data => setOrders(data.orders || []));
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to approve return");
      }
    } catch (err) {
      toast.error("Error approving return");
    }
  };

  const handleDeleteOrder = (orderId) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Order",
      message: "Are you sure you want to permanently delete this order?",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API}/api/orders/${orderId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (res.ok) {
            setOrders(orders.filter(o => o.id !== orderId));
            toast.success("Order deleted");
          } else {
            toast.error("Failed to delete order");
          }
        } catch (err) {
          toast.error("Error deleting order");
        }
      }
    });
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



  const handleAddCoupon = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/admin/coupons`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCoupon)
      });
      if (res.ok) {
        toast.success("Coupon created successfully");
        setNewCoupon({ code: '', discount_percentage: '' });
        fetch(`${API}/api/admin/coupons`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` } })
          .then(res => res.json()).then(data => setCoupons(data.coupons || []));
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create coupon");
      }
    } catch (err) {
      toast.error("Error creating coupon");
    }
  };

  const handleDeleteCoupon = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Coupon",
      message: "Are you sure you want to permanently delete this coupon code?",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API}/api/admin/coupons/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
          });
          if (res.ok) {
            toast.success("Coupon deleted");
            setCoupons(coupons.filter(c => c.id !== id));
          } else {
            toast.error("Failed to delete coupon");
          }
        } catch (err) {
          toast.error("Error deleting coupon");
        }
      }
    });
  };

  const handleSendBlast = async (e) => {
    e.preventDefault();
    if (!newsletterData.subject || !newsletterData.message) return toast.error("Fill all fields");
    setIsProcessing(true);
    try {
      const res = await fetch(`${API}/api/admin/subscribers/blast`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newsletterData)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setNewsletterData({ subject: '', message: '' });
      } else {
        toast.error(data.error || "Failed to send blast");
      }
    } catch (err) {
      toast.error("Error sending newsletter");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateUserZone = async (userId, zones) => {
    try {
      const res = await fetch(`${API}/api/admin/users/${userId}`, {
        method: 'PATCH',
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

  const handleDeleteUser = (id, role) => {
    setConfirmModal({
      isOpen: true,
      title: role === 'driver' ? "Delete Driver" : "Delete User",
      message: role === 'driver'
        ? "Are you sure you want to permanently delete this driver?"
        : "Are you sure you want to permanently delete this user? This will also delete their order history, cart, wishlist, and reviews.",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API}/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: authHeaders()
          });
          if (res.ok) {
            toast.success(`${role === 'driver' ? 'Driver' : 'User'} deleted successfully`);
            setUsers(users.filter(u => u.id !== id));
            if (role === 'driver') {
              setDrivers(drivers.filter(d => d.id !== id));
            }
          } else {
            const data = await res.json();
            toast.error(data.error || "Failed to delete user");
          }
        } catch (err) {
          toast.error("Error deleting user");
        }
      }
    });
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

      <section className="relative pt-6 pb-4 sm:pb-6 border-b border-gray-200 bg-white z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-rose-50 rounded-2xl">
                <Icons.LayoutDashboard size={20} className="text-rose-500 sm:w-6 sm:h-6" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] sm:tracking-[0.5em] font-heading">System Overview</span>
              {/* ── Live indicator ── */}
              <div className="flex items-center gap-1.5 ml-2">
                <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-emerald-500 animate-ping' : 'bg-emerald-400'}`} />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Live</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter font-heading leading-tight">
              ADMIN <span className="text-gray-300">DASHBOARD</span>
            </h1>
            {lastRefresh && (
              <p className="text-[9px] text-gray-400 font-bold mt-1">Last updated: {lastRefresh.toLocaleTimeString()}</p>
            )}
          </div>
          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <button onClick={() => { setIsLive(true); fetchAllData(); setTimeout(() => setIsLive(false), 1500); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border border-emerald-200">
              <Icons.RefreshCw size={14} className={isLive ? 'animate-spin' : ''} /> Refresh
            </button>
            <div className="text-right hidden sm:block">
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Session Active</p>
               <p className="text-sm font-bold text-gray-950">{user.full_name}</p>
            </div>
            <button onClick={() => { logout(); navigate('/admin-login'); }} className="flex items-center gap-2 sm:gap-4 px-5 sm:px-8 py-3 sm:py-4 bg-gray-900 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-[20px] transition-all hover:-translate-y-1 active:scale-95 font-heading shrink-0 whitespace-nowrap">
              <Icons.LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-8 relative z-10">
        <aside className="lg:col-span-1">
          <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-y-auto lg:sticky lg:top-6 gap-3 pb-3 lg:pb-0 scrollbar-hide lg:max-h-[calc(100vh-100px)]">
            {[
              { id: 'overview', label: 'Overview', icon: Icons.BarChart2 }, 
              { id: 'inventory', label: 'Products', icon: Icons.Package }, 
              { id: 'orders', label: 'Orders', icon: Icons.ShoppingCart },
              { id: 'users', label: 'Users', icon: Icons.Users },
              { id: 'coupons', label: 'Coupons', icon: Icons.Ticket },
              { id: 'newsletter', label: 'Newsletter', icon: Icons.Mail },
              { id: 'email-logs', label: 'Email Logs', icon: Icons.Send }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => { setActiveTab(tab.id); if (tab.id === 'email-logs') fetchEmailLogs(); }} 
                className={`flex items-center justify-between p-4 lg:p-5 rounded-[20px] lg:rounded-[24px] transition-all group active:scale-95 shrink-0 whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-lg border border-gray-100' : 'text-gray-400 hover:text-gray-900 hover:bg-white'}`}
              >
                <div className="flex items-center gap-4">
                  <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={activeTab === tab.id ? 'text-rose-500' : 'text-gray-400 group-hover:text-rose-500'} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] font-heading">{tab.label}</span>
                </div>
                {activeTab === tab.id && <div className="h-1.5 w-1.5 bg-rose-500 rounded-full hidden lg:block" />}
              </button>
            ))}
          </div>
        </aside>

        <main className="lg:col-span-4 space-y-6 sm:space-y-10">
          {activeTab === 'overview' && (
            <div className="space-y-6 sm:space-y-10">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {[
                  { label: 'Revenue', value: `₹${(metrics.total_revenue || 0).toLocaleString()}`, icon: Icons.IndianRupee, color: 'rose' },
                  { label: 'Orders', value: metrics.total_orders || 0, icon: Icons.ShoppingBag, color: 'blue' },
                  { label: 'Users', value: metrics.total_users || 0, icon: Icons.Users, color: 'emerald' },
                  { label: 'Products', value: metrics.total_products || 0, icon: Icons.Package, color: 'violet' }
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white border border-gray-100 rounded-[20px] sm:rounded-[32px] p-4 sm:p-6 shadow-xl hover:-translate-y-1 transition-transform">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-${color}-50 text-${color}-500`}>
                        <Icon size={16} className="sm:w-5 sm:h-5" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-black text-emerald-500 bg-emerald-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg">+12%</span>
                    </div>
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                    <p className="text-lg sm:text-2xl font-black text-gray-950">{value}</p>
                  </div>
                ))}
              </div>

              {/* Main Charts Row */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <div className="xl:col-span-2 bg-white border border-gray-100 rounded-[40px] p-8 shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Revenue Growth</h3>
                    <div className="flex gap-2">
                      {['7d', '6m'].map(p => (
                        <button key={p} onClick={() => setSelectedPeriod(p)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${selectedPeriod === p ? 'bg-rose-500 text-white' : 'bg-gray-50 text-gray-400'}`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight={700} stroke="#94a3b8" />
                        <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight={700} stroke="#94a3b8" />
                        <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                        <Area type="monotone" dataKey="revenue" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#revGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Category Pie Chart */}
                <div className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-2xl">
                   <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8">Sales by Category</h3>
                   <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={metrics.category_distribution || [{name: 'Loading', value: 1}]}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {(metrics.category_distribution || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#f43f5e', '#3b82f6', '#10b981', '#8b5cf6'][index % 4]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                   </div>
                </div>
              </div>

              {/* Bottom Row: Top Selling & Activity Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Selling Products */}
                <div className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-2xl">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8">Top Selling Products</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metrics.top_selling || []}>
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <Tooltip />
                        <Bar dataKey="value" fill="#f43f5e" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-3">
                    {(metrics.top_selling || []).map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-600 truncate max-w-[200px]">{item.name}</span>
                        <span className="text-xs font-black text-rose-500">{item.value} Sold</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white border border-gray-100 rounded-[40px] p-8 shadow-2xl">
                   <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mb-8">Recent Activity</h3>
                   <div className="space-y-6">
                      {(metrics.recent_activity || []).map((act) => (
                        <div key={act.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                               <Icons.ShoppingBag size={18} className="text-rose-500" />
                            </div>
                            <div>
                               <p className="text-sm font-black uppercase tracking-tight">{act.customer}</p>
                               <p className="text-[10px] text-gray-400 font-bold">Ordered shoes for ₹{act.amount}</p>
                            </div>
                          </div>
                          <p className="text-[10px] font-black text-gray-400 uppercase">{act.time}</p>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6 sm:space-y-8">
              <div className="flex flex-col gap-4 bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-gray-100 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tight font-heading">Inventory</h2>
                    <div className="flex gap-3">
                        <button onClick={() => { setIsBulkAdding(!isBulkAdding); setIsAdding(false); }} className="bg-rose-50 text-rose-500 px-5 sm:px-8 py-3 sm:py-4 rounded-[18px] sm:rounded-[22px] text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Bulk Import</button>
                        <button onClick={() => { setIsAdding(!isAdding); setIsBulkAdding(false); }} className="bg-gray-950 text-white px-5 sm:px-8 py-3 sm:py-4 rounded-[18px] sm:rounded-[22px] text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Add Product</button>
                    </div>
                  </div>
                  <div className="relative">
                      <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search products by title or brand..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                      />
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

              {isBulkAdding && (
                <form onSubmit={handleBulkImport} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-gray-400">Base Price</label>
                     <input type="number" value={bulkData.basePrice} onChange={e => setBulkData({...bulkData, basePrice: e.target.value})} className="w-full bg-gray-50 rounded-xl p-4 text-sm font-bold" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-gray-400">Category</label>
                     <select value={bulkData.category} onChange={e => setBulkData({...bulkData, category: e.target.value})} className="w-full bg-gray-50 rounded-xl p-4 text-sm font-bold">
                        <option value="men">Men</option>
                        <option value="women">Women</option>
                        <option value="kids">Kids</option>
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-gray-400">Select ZIP/Images</label>
                     <input required type="file" multiple onChange={e => setBulkData({...bulkData, files: e.target.files})} className="w-full bg-gray-50 rounded-xl p-4 text-sm font-bold" />
                   </div>
                   <div className="flex items-end">
                     <button type="submit" disabled={isProcessing} className="w-full bg-rose-500 text-white p-4 rounded-xl uppercase font-black text-[10px] tracking-widest flex items-center justify-center gap-2">
                       {isProcessing ? <Icons.Loader className="animate-spin" size={16} /> : <><Icons.UploadCloud size={16} /> Start Import</>}
                     </button>
                   </div>
                </form>
              )}

              {editingProduct && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                  <div className="bg-white rounded-[40px] p-8 w-full max-w-xl shadow-2xl relative">
                    <button onClick={() => setEditingProduct(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900">
                       <Icons.X size={24} />
                    </button>
                    <h3 className="text-2xl font-black uppercase tracking-tight mb-6">Edit Product</h3>
                    <form onSubmit={handleUpdateProduct} className="grid grid-cols-2 gap-6">
                       <div className="col-span-2 flex items-center gap-4 p-4 bg-gray-50 rounded-2xl mb-2">
                          <img src={formatImageUrl(editingProduct.image)} className="w-16 h-16 object-contain bg-white rounded-xl shadow-sm" />
                          <div>
                            <p className="text-[10px] font-black uppercase text-gray-400">Current Image</p>
                            <p className="text-sm font-bold truncate max-w-[200px]">{editingProduct.title}</p>
                          </div>
                       </div>
                       
                       <input placeholder="Title" value={editProductForm.title} onChange={e => setEditProductForm({...editProductForm, title: e.target.value})} className="col-span-2 bg-gray-50 rounded-2xl p-5 text-sm font-bold border border-gray-100" />
                       <input placeholder="Brand" value={editProductForm.brand} onChange={e => setEditProductForm({...editProductForm, brand: e.target.value})} className="bg-gray-50 rounded-2xl p-5 text-sm font-bold border border-gray-100" />
                       <input type="number" placeholder="Price" value={editProductForm.price} onChange={e => setEditProductForm({...editProductForm, price: e.target.value})} className="bg-gray-50 rounded-2xl p-5 text-sm font-bold border border-gray-100" />
                       
                       <div className="col-span-2">
                         <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">Upload New Image (Optional)</label>
                         <input type="file" onChange={e => setEditProductForm({...editProductForm, image: e.target.files[0]})} className="w-full bg-gray-50 rounded-2xl p-5 text-sm font-bold border border-gray-100" />
                       </div>

                       <button type="submit" className="col-span-2 bg-blue-500 text-white p-6 rounded-[24px] uppercase font-black text-[11px] tracking-widest hover:bg-blue-600 transition-colors">Update Product</button>
                    </form>
                  </div>
                </div>
              )}

              <div className="bg-white border border-gray-100 rounded-[24px] sm:rounded-[40px] shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-gray-50">
                    <tr><th className="p-4 sm:p-6 lg:p-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Details</th><th className="p-4 sm:p-6 lg:p-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Stock</th><th className="p-4 sm:p-6 lg:p-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Price</th><th className="p-4 sm:p-6 lg:p-8"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.filter(p => 
                      p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      p.brand.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map(p => {
                      const isNew = p.created_at && new Date(p.created_at) > new Date(Date.now() - 10 * 60 * 1000);
                      return (
                      <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${isNew ? 'bg-emerald-50/30' : ''}`}>
                        <td className="p-4 sm:p-6 lg:p-8">
                          <div className="flex items-center gap-3 sm:gap-6">
                           <div className="relative shrink-0">
                              <img src={formatImageUrl(p.image)} className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />
                              {isNew && <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black">NEW</span>}
                           </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-black uppercase truncate max-w-[120px] sm:max-w-[200px]">{p.title}</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase">{p.brand}</p>
                          </div>
                          </div>
                        </td>
                        <td className="p-4 sm:p-6 lg:p-8"><span className="text-[10px] font-black uppercase">{p.stock} Units</span></td>
                        <td className="p-4 sm:p-6 lg:p-8 font-black text-sm">₹{p.price.toLocaleString()}</td>
                        <td className="p-4 sm:p-6 lg:p-8">
                          <div className="flex gap-3 justify-end items-center">
                          <button onClick={() => {
                             setEditingProduct(p);
                             setEditProductForm({ title: p.title, brand: p.brand, price: p.price, image: null });
                          }} className="text-gray-400 hover:text-blue-500 transition-colors"><Icons.Edit2 size={18} /></button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="text-gray-400 hover:text-rose-500 transition-colors"><Icons.Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6 sm:space-y-12">
              <div className="flex flex-col gap-4 bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-gray-100 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tight font-heading">Orders</h2>
                      <div className="flex gap-2 sm:gap-4 mt-3 sm:mt-4 flex-wrap">
                        <button 
                          onClick={() => setActiveOrderSubTab('active')} 
                          className={`px-4 sm:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeOrderSubTab === 'active' ? 'bg-rose-500 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                        >
                          Active Shipments
                        </button>
                        <button 
                          onClick={() => setActiveOrderSubTab('history')} 
                          className={`px-4 sm:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeOrderSubTab === 'history' ? 'bg-rose-500 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                        >
                          Orders History
                        </button>
                      </div>
                    </div>
                    <div className="relative w-full sm:max-w-sm">
                        <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                          type="text" 
                          placeholder="Search by Customer or Tracking ID..." 
                          value={orderSearchTerm}
                          onChange={(e) => setOrderSearchTerm(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
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
                    className="bg-blue-600 text-white px-8 py-5 rounded-[22px] text-[10px] font-black uppercase tracking-widest flex items-center gap-4 whitespace-nowrap"
                  >
                    <Icons.Zap size={18} /> {isProcessing ? 'Processing...' : 'Flash Speed'}
                  </button>
              </div>

              <div className="bg-white border border-gray-100 rounded-[24px] sm:rounded-[40px] shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-gray-50">
                    <tr><th className="p-4 sm:p-6 lg:p-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Order ID</th><th className="p-4 sm:p-6 lg:p-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</th><th className="p-4 sm:p-6 lg:p-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th><th className="p-4 sm:p-6 lg:p-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Assign</th><th className="p-4 sm:p-6 lg:p-8"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders
                      .filter(o => activeOrderSubTab === 'active' ? !['Delivered', 'Cancelled', 'Returned', 'Cancelled - Refund Initiated'].includes(o.status) : ['Delivered', 'Cancelled', 'Returned', 'Cancelled - Refund Initiated'].includes(o.status))
                      .filter(o => 
                        o.customer_name.toLowerCase().includes(orderSearchTerm.toLowerCase()) || 
                        o.tracking_id.toLowerCase().includes(orderSearchTerm.toLowerCase())
                      )
                      .map(o => {
                      const isNew = o.created_at && new Date(o.created_at) > new Date(Date.now() - 10 * 60 * 1000);
                      return (
                      <tr key={o.id} className={`hover:bg-gray-50 transition-colors ${isNew ? 'bg-rose-50/30' : ''}`}>
                        <td className="p-4 sm:p-6 lg:p-8">
                          <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                           #{o.tracking_id}
                           {isNew && <span className="bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-pulse">NEW</span>}
                          </div>
                        </td>
                        <td className="p-4 sm:p-6 lg:p-8"><p className="text-xs sm:text-sm font-bold">{o.customer_name}</p></td>
                        <td className="p-4 sm:p-6 lg:p-8">
                           <span className="px-2 sm:px-4 py-1 sm:py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full bg-blue-50 text-blue-500 border border-blue-100 whitespace-nowrap">{o.status}</span>
                        </td>
                        <td className="p-4 sm:p-6 lg:p-8">
                          {['Delivered', 'Cancelled', 'Returned', 'Cancelled - Refund Initiated'].includes(o.status) ? (
                            <span className="text-[10px] font-black uppercase text-gray-700">{o.driver_name || 'Unassigned'}</span>
                          ) : (
                            <select value={o.driver_id || ''} onChange={(e) => handleAssignDriver(o.id, e.target.value)} className="bg-gray-50 border border-gray-100 rounded-xl px-2 sm:px-4 py-2 text-[10px] font-black">
                              <option value="">Unassigned</option>
                              {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                            </select>
                          )}
                        </td>
                        <td className="p-4 sm:p-6 lg:p-8">
                          <div className="flex gap-2 justify-end">
                           {o.status === 'Return Requested' && (
                             <button onClick={() => handleApproveReturn(o.id)} className="bg-orange-100 text-orange-600 px-2 sm:px-3 py-1 rounded-lg text-xs font-bold hover:bg-orange-200 transition-colors" title="Approve Return & Restock">
                               Approve
                             </button>
                           )}
                           <button onClick={() => handleDownloadInvoice(o)} className="text-gray-400 hover:text-blue-500"><Icons.FileText size={16} /></button>
                           <button onClick={() => handleDeleteOrder(o.id)} className="text-gray-400 hover:text-rose-500"><Icons.Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6 sm:space-y-12">
               <h2 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tight font-heading">Users</h2>
               <div className="bg-white border border-gray-100 rounded-[24px] sm:rounded-[40px] shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 sm:p-6 lg:p-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Identity</th>
                      <th className="p-4 sm:p-6 lg:p-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Role</th>
                      <th className="p-4 sm:p-6 lg:p-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Zones</th>
                      <th className="p-4 sm:p-6 lg:p-8 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u, idx) => {
                      const isNew = u.created_at && new Date(u.created_at) > new Date(Date.now() - 10 * 60 * 1000);
                      const isLast = idx === users.length - 1;
                      return (
                      <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${isNew ? 'bg-blue-50/30' : ''}`}>
                        <td className={`p-4 sm:p-6 lg:p-8 ${isLast ? 'rounded-bl-[40px]' : ''}`}>
                           <div className="flex items-center gap-2 sm:gap-3">
                              <p className="text-xs sm:text-sm font-black uppercase">{u.full_name}</p>
                              {isNew && <span className="bg-blue-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black">NEW USER</span>}
                           </div>
                           <p className="text-[10px] text-gray-400 font-black">{u.email}</p>
                        </td>
                        <td className="p-4 sm:p-6 lg:p-8"><span className="px-3 sm:px-6 py-1.5 sm:py-2 text-[9px] font-black uppercase rounded-full bg-gray-50 border border-gray-100">{u.role}</span></td>
                        <td className="p-4 sm:p-6 lg:p-8">
                          {u.role === 'driver' ? (
                            <ZoneSelector currentZones={u.delivery_zones} onUpdate={(newZones) => handleUpdateUserZone(u.id, newZones)} />
                          ) : <span className="text-[10px] text-gray-300 italic">N/A</span>}
                        </td>
                        <td className={`p-4 sm:p-6 lg:p-8 text-right ${isLast ? 'rounded-br-[40px]' : ''}`}>
                          {u.id !== user.id ? (
                            <button onClick={() => handleDeleteUser(u.id, u.role)} className="p-3 hover:bg-rose-50 hover:text-rose-500 rounded-xl text-gray-400 transition-colors" title="Delete User">
                              <Icons.Trash2 size={18} />
                            </button>
                          ) : <span className="text-[10px] text-gray-300 italic">Current User</span>}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'coupons' && (
            <div className="space-y-6 sm:space-y-8">
              <div className="flex items-center justify-between bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-gray-100 shadow-xl">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tight font-heading">Promo Codes</h2>
              </div>
              
              <form onSubmit={handleAddCoupon} className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Coupon Code</label>
                  <input required placeholder="e.g. SUMMER20" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} className="w-full bg-gray-50 rounded-2xl p-5 text-sm font-bold outline-none uppercase" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Discount %</label>
                  <input required type="number" min="1" max="100" placeholder="e.g. 20" value={newCoupon.discount_percentage} onChange={e => setNewCoupon({...newCoupon, discount_percentage: e.target.value})} className="w-full bg-gray-50 rounded-2xl p-5 text-sm font-bold outline-none" />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-white p-5 rounded-[24px] uppercase font-black text-[11px] tracking-widest transition-colors flex items-center justify-center gap-2">
                    <Icons.Plus size={16} /> Create Code
                  </button>
                </div>
              </form>

              <div className="bg-white border border-gray-100 rounded-[40px] shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Code</th>
                      <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Discount</th>
                      <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                      <th className="p-8 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {coupons.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-8">
                          <span className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-xs font-black tracking-widest border border-rose-100">{c.code}</span>
                        </td>
                        <td className="p-8 text-sm font-bold text-gray-900">{c.discount_percentage}% OFF</td>
                        <td className="p-8">
                          <span className="flex items-center gap-2 text-xs font-bold text-emerald-500"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Active</span>
                        </td>
                        <td className="p-8 text-right">
                          <button onClick={() => handleDeleteCoupon(c.id)} className="p-3 hover:bg-rose-50 hover:text-rose-500 rounded-xl text-gray-400 transition-colors">
                            <Icons.Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {coupons.length === 0 && (
                      <tr>
                        <td colSpan="4" className="p-12 text-center text-gray-400 font-bold text-sm">No promo codes generated yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'newsletter' && (
            <div className="space-y-6 sm:space-y-8">
              <div className="flex items-center justify-between bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-gray-100 shadow-xl">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tight font-heading">Newsletter</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Send Blast Form */}
                <form onSubmit={handleSendBlast} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl space-y-6">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Send Email Blast</h3>
                  <input 
                    required placeholder="Subject (e.g. 50% Off Flash Sale!)" 
                    value={newsletterData.subject} 
                    onChange={e => setNewsletterData({...newsletterData, subject: e.target.value})} 
                    className="w-full bg-gray-50 rounded-2xl p-5 text-sm font-bold outline-none" 
                  />
                  <textarea 
                    required placeholder="Write your marketing message here..." rows="6"
                    value={newsletterData.message} 
                    onChange={e => setNewsletterData({...newsletterData, message: e.target.value})} 
                    className="w-full bg-gray-50 rounded-2xl p-5 text-sm font-bold outline-none resize-none" 
                  />
                  <button type="submit" disabled={isProcessing} className="w-full bg-rose-500 hover:bg-rose-600 text-white p-5 rounded-[24px] uppercase font-black text-[11px] tracking-widest transition-colors flex items-center justify-center gap-2">
                    {isProcessing ? <Icons.Loader className="animate-spin" size={16} /> : <><Icons.Send size={16} /> Send to {subscribers.length} Subscribers</>}
                  </button>
                </form>

                {/* Subscribers List */}
                <div className="bg-white border border-gray-100 rounded-[40px] overflow-hidden shadow-xl flex flex-col h-[500px]">
                  <div className="p-8 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Active Subscribers</h3>
                    <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-xs font-black">{subscribers.length} Total</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {subscribers.map((sub, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100">
                        <div className="size-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                          <Icons.Mail size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{sub.email}</p>
                          <p className="text-[10px] font-black uppercase text-gray-400">Joined: {new Date(sub.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                    {subscribers.length === 0 && (
                      <div className="h-full flex items-center justify-center text-gray-400 font-bold text-sm">
                        No subscribers yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Email Logs Tab ── */}
          {activeTab === 'email-logs' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Sent', value: emailStats.total_sent || 0, icon: Icons.CheckCircle, color: 'emerald' },
                  { label: 'Failed', value: emailStats.total_failed || 0, icon: Icons.XCircle, color: 'rose' },
                  { label: 'OTP Emails', value: (emailStats.by_type?.otp?.sent || 0), icon: Icons.KeyRound, color: 'blue' },
                  { label: 'Orders', value: (emailStats.by_type?.order?.sent || 0), icon: Icons.ShoppingBag, color: 'violet' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm hover:-translate-y-1 transition-transform">
                    <div className={`p-2 rounded-xl bg-${color}-50 text-${color}-500 w-fit mb-3`}><Icon size={16} /></div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                    <p className="text-2xl font-black text-gray-900">{value}</p>
                  </div>
                ))}
              </div>

              {/* Filter Bar */}
              <div className="bg-white border border-gray-100 rounded-[28px] p-5 shadow-sm flex flex-wrap gap-3 items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Filter:</span>
                {['', 'otp', 'order', 'delivery_otp', 'newsletter'].map(t => (
                  <button key={t || 'all'}
                    onClick={() => { const f = {...emailLogFilter, type: t}; setEmailLogFilter(f); fetchEmailLogs(f); }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                      emailLogFilter.type === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {t || 'All Types'}
                  </button>
                ))}
                <div className="w-px h-5 bg-gray-200 mx-1" />
                {['', 'sent', 'failed'].map(s => (
                  <button key={s || 'all-status'}
                    onClick={() => { const f = {...emailLogFilter, status: s}; setEmailLogFilter(f); fetchEmailLogs(f); }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                      emailLogFilter.status === s
                        ? s === 'failed' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {s || 'All Status'}
                  </button>
                ))}
                <button onClick={() => fetchEmailLogs(emailLogFilter)}
                  className="ml-auto flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">
                  <Icons.RefreshCw size={12} /> Refresh
                </button>
              </div>

              {/* Logs Table */}
              <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-xl">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Email Send History</h3>
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-black">{emailLogs.length} Records</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['#', 'Type', 'Recipient', 'Subject', 'Status', 'Time'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {emailLogs.map((log, i) => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 text-xs text-gray-400 font-bold">{i + 1}</td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                              log.email_type === 'order' ? 'bg-violet-100 text-violet-700' :
                              log.email_type === 'otp' ? 'bg-blue-100 text-blue-700' :
                              log.email_type === 'delivery_otp' ? 'bg-orange-100 text-orange-700' :
                              'bg-pink-100 text-pink-700'}`}>
                              {log.email_type}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs font-bold text-gray-700 max-w-[160px] truncate">{log.recipient}</td>
                          <td className="px-5 py-3 text-xs text-gray-500 max-w-[200px] truncate" title={log.subject}>{log.subject}</td>
                          <td className="px-5 py-3">
                            <span className={`flex items-center gap-1.5 w-fit px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                              log.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {log.status === 'sent' ? <Icons.CheckCircle size={10} /> : <Icons.XCircle size={10} />}
                              {log.status}
                            </span>
                            {log.error_msg && <p className="text-[9px] text-rose-400 mt-0.5 max-w-[120px] truncate" title={log.error_msg}>{log.error_msg}</p>}
                          </td>
                          <td className="px-5 py-3 text-[10px] text-gray-400 font-bold whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                          </td>
                        </tr>
                      ))}
                      {emailLogs.length === 0 && (
                        <tr><td colSpan={6} className="px-5 py-16 text-center text-gray-400 font-bold text-sm">
                          No email logs yet. Logs appear here after OTPs, order confirmations, or newsletters are sent.
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
}
