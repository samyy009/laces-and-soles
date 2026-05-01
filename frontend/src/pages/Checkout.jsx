import { useState, useEffect } from 'react';
import { useShop, API } from '../context/ShopContext';
import * as Icons from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import UiballLoader from '../components/premium/UiballLoader';
import LottieAnimation from '../components/premium/LottieAnimation';
import hubliLocations from '../hubli_locations.json';

export default function Checkout() {
  const { cartItems, getCartTotal, getProductById, clearCart, formatImageUrl } = useShop();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Checkout State
  const [step, setStep] = useState(1); // 1: Shipping, 2: KYC, 3: Payment, 4: Success
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [shippingData, setShippingData] = useState({ name: '', phone: '', address: '', city: '', state: '', pincode: '' });

  // Discount & Promo State
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState({ percent: 0, active: false, msg: '' });

  // KYC State
  const [kycData, setKycData] = useState({ pan: localStorage.getItem('mock_kyc_pan') || '', verified: !!localStorage.getItem('mock_kyc_pan') });

  // Pre-fill shipping data from saved user address
  useEffect(() => {
    if (user) {
      setShippingData({
        name: user.full_name || '',
        phone: '', // Phone is not stored in user profile yet
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.zip_code || ''
      });
    }
  }, [user]);

  useEffect(() => {
    const orderId = searchParams.get('id');
    if (orderId && !confirmedOrderId) {
      setStep(4);
      setConfirmedOrderId(orderId);
      const recoverOrder = async () => {
        try {
          const res = await axios.get(`${API}/api/track/${orderId}`);
          setConfirmedOrder(res.data);
        } catch (err) {
          console.error("Order recovery failed:", err);
        }
      };
      recoverOrder();
    }
  }, [searchParams]);

  const subtotal = getCartTotal();
  const shipping = 15.00;
  const discountAmount = discount.active ? (subtotal * (discount.percent / 100)) : 0;
  const total = (subtotal - discountAmount) + shipping;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.warn("Please enter a promo code.");
      return;
    }
    try {
      const res = await axios.post(`${API}/api/validate_coupon`, { code: promoCode });
      if (res.data.valid) {
        setDiscount({ percent: res.data.discount_percentage, active: true, msg: res.data.message });
        toast.success(res.data.message);
      }
    } catch {
      setDiscount({ percent: 0, active: false, msg: 'Invalid Promo Code' });
      toast.error('Invalid or expired promo code.');
    }
  };

  const verifyKYC = () => {
    // Regex for basic Indian PAN card format simulation (5 letters, 4 numbers, 1 letter)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
    if (panRegex.test(kycData.pan)) {
      toast.success("KYC Verified Successfully via NSDL Simulator.");
      setKycData({ ...kycData, verified: true });
      localStorage.setItem('mock_kyc_pan', kycData.pan);
      setStep(3);
    } else {
      toast.error("Invalid PAN Format. E.g. ABCDE1234F");
    }
  };

  const handleCheckout = async () => {
    // Hubli Pincode Validation
    const hubliPincodes = hubliLocations.map(l => l.pincode);
    if (!hubliPincodes.includes(shippingData.pincode)) {
      toast.error(`Sorry! We only deliver to Hubli right now. Pincode ${shippingData.pincode} is outside our delivery zone.`);
      setStep(1);
      return;
    }

    setIsProcessing(true);
    
    // Final Stock Check before Payment
    try {
      for (const item of cartItems) {
        const prodCheck = await axios.get(`${API}/api/products/${item.product_id}`);
        if (prodCheck.data.product.stock < item.quantity) {
          toast.error(`Sorry! ${prodCheck.data.product.title} just went out of stock.`);
          setIsProcessing(false);
          return;
        }
      }
    } catch (err) {
      console.error("Stock check failed:", err);
    }
    
    try {
      // Simulation Mode Bypass
      if (import.meta.env.VITE_MOCK_PAYMENT === 'true') {
        toast.info("Simulation Mode: Processing Demo Payment...");
        const mockResponse = {
          razorpay_order_id: "order_MOCK_" + Math.random().toString(36).substring(7),
          razorpay_payment_id: "pay_MOCK_" + Math.random().toString(36).substring(7),
          razorpay_signature: "MOCK_SIGNATURE"
        };
        
        try {
          const verifyRes = await axios.post(`${API}/api/razorpay/verify-payment`, {
            ...mockResponse,
            shipping_details: shippingData
          }, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
          });

          if (verifyRes.data.success) {
            const firstOrder = verifyRes.data.orders[0];
            setConfirmedOrderId(firstOrder.tracking_id);
            setConfirmedOrder(firstOrder);
            setStep(4);
            setSearchParams({ id: firstOrder.tracking_id }, { replace: true });
            clearCart();
            toast.success("Demo Payment Successful!");
          }
        } catch (err) {
          console.error("Mock Verify Error:", err);
          toast.error("Simulation failed. Check backend.");
        } finally {
          setIsProcessing(false);
        }
        return;
      }

      // 1. Create Order on Backend (Real Flow)
      const orderRes = await axios.post(`${API}/api/razorpay/create-order`, {}, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });

      const { razorpay_order_id, amount, currency } = orderRes.data;

      // 2. Configure Razorpay Options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder', 
        amount: amount * 100,
        currency: currency,
        name: "Laces & Soles",
        description: "Secure Footwear Purchase",
        order_id: razorpay_order_id,
        handler: async function (response) {
          // 3. Verify Payment on Success
          try {
            setIsProcessing(true);
            const verifyRes = await axios.post(`${API}/api/razorpay/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              shipping_details: shippingData
            }, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
            });

            if (verifyRes.data.success) {
              const firstOrder = verifyRes.data.orders[0];
              setConfirmedOrderId(firstOrder.tracking_id);
              setConfirmedOrder(firstOrder);
              setStep(4);
              setSearchParams({ id: firstOrder.tracking_id }, { replace: true });
              clearCart();
              toast.success("Payment Successful! Order Placed.");
            }
          } catch (err) {
            console.error("Verification Error:", err);
            toast.error("Payment verification failed. Please contact support.");
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: shippingData.name,
          email: user?.email,
          contact: shippingData.phone
        },
        theme: {
          color: "#1A73E8"
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error("RAZORPAY ERROR:", err);
      toast.error(err.response?.data?.error || "Could not initiate payment. Check console.");
      setIsProcessing(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!confirmedOrder) return;

    try {
      const doc = new jsPDF();
      const order = confirmedOrder;
      
      // Header Section
      doc.setFillColor(255, 51, 102); // #ff3366 Professional Red-Pink
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
      
      // Left side: Billing
      doc.setFont("helvetica", "bold");
      doc.text("BILL TO", 10, 55);
      doc.setFont("helvetica", "normal");
      doc.text(user?.full_name || "Customer", 10, 62);
      doc.text(user?.email || "", 10, 68);

      // Right side: Order Details
      let y = 55;
      const rightX = 140;
      const labels = [
        ["Invoice No.", `INV-${new Date().getFullYear()}-${String(order.id).padStart(5, '0')}`],
        ["Invoice Date", new Date().toLocaleDateString('en-GB')],
        ["Order ID", `#${order.id}`],
        ["Tracking ID", order.tracking_id],
        ["Payment", "Paid (Simulation)"]
      ];

      labels.forEach(([label, val]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, rightX, y);
        doc.setFont("helvetica", "normal");
        doc.text(val, rightX + 30, y);
        y += 7;
      });

      // Table for items
      const itemsList = order.items || [];
      const tableData = itemsList.map((item, index) => {
        const itemPrice = Number(item.price || item.unit_price || item.product?.price || 0);
        const itemQty = Number(item.quantity || 1);
        return [
          index + 1,
          `${item.product?.title || 'Unknown Product'}\n${item.product?.brand || ''}`,
          itemQty,
          `INR ${itemPrice.toFixed(2)}`,
          `INR ${(itemPrice * itemQty).toFixed(2)}`
        ];
      });

      autoTable(doc, {
        startY: 100,
        head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [26, 40, 61], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 15, halign: 'center' },
          3: { cellWidth: 35, halign: 'right' },
          4: { cellWidth: 35, halign: 'right' },
        },
        styles: { fontSize: 9 }
      });

      // Totals - Corrected calculations and spacing
      const shippingAmount = 15.00;
      const subtotalAmount = order.total_amount - shippingAmount;
      const finalY = (doc).lastAutoTable.finalY + 10;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      
      // Subtotal
      doc.text("Subtotal", rightX, finalY);
      doc.setTextColor(0, 0, 0);
      doc.text(`INR ${subtotalAmount.toFixed(2)}`, rightX + 55, finalY, { align: 'right' });
      
      // Shipping
      doc.setTextColor(100, 100, 100);
      doc.text("Shipping & Handling", rightX, finalY + 7);
      doc.setTextColor(0, 0, 0);
      doc.text(`INR ${shippingAmount.toFixed(2)}`, rightX + 55, finalY + 7, { align: 'right' });

      // Visual Divider
      doc.setDrawColor(200, 200, 200);
      doc.line(rightX - 5, finalY + 10, rightX + 55, finalY + 10);

      // Grand Total Box
      doc.setFillColor(26, 40, 61);
      doc.rect(rightX - 5, finalY + 13, 65, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("GRAND TOTAL", rightX, finalY + 21);
      doc.text(`INR ${order.total_amount.toFixed(2)}`, rightX + 55, finalY + 21, { align: 'right' });

      doc.save(`Invoice_${order.tracking_id}.pdf`);
      toast.success("Invoice Downloaded!");
    } catch (err) {
      console.error("PDF GEN ERROR:", err);
      alert("Could not generate invoice. " + err.message);
    }
  };

  if (!user) {
    return (
      <div className="py-32 text-center">
        <h2 className="text-3xl font-black uppercase tracking-tighter">Sign In Required</h2>
        <p className="mt-4 text-gray-500">Please sign in or create an account to proceed with checkout.</p>
        <Link to="/login" className="mt-8 inline-block bg-rose-500 text-white px-10 py-4 text-xs font-black uppercase tracking-widest hover:bg-black transition-colors">
          Register / Sign In
        </Link>
      </div>
    );
  }

  if (cartItems.length === 0 && step !== 4) {
    return (
      <div className="py-32 text-center">
        <div className="size-24 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-8">
          <Icons.ShoppingCart size={40} />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter">Your cart is empty</h2>
        <Link to="/store" className="mt-8 inline-block bg-black text-white px-10 py-4 text-xs font-black uppercase tracking-widest hover:bg-rose-500 transition-colors">
          Go to Store
        </Link>
      </div>
    );
  }

  // Visual Step Array
  const steps = [
    { id: 1, name: 'Shipping' },
    { id: 2, name: 'KYC Verification' },
    { id: 3, name: 'Payment' }
  ];

  return (
    <div className="pb-24 min-h-screen bg-[#F6F9FC]">
      {/* Checkout Navbar Segment */}
      <section className="bg-white py-8 border-b shadow-sm sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/store" className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all mr-2 group">
               <Icons.ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
               <Icons.Lock size={20} className="text-green-500" /> Secure Checkout
            </h1>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            {steps.map((s, index) => (
              <div key={s.id} className="flex items-center gap-3">
                <div className={`flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest ${step >= s.id ? 'text-blue-600' : 'text-gray-400'}`}>
                   <span className={`size-6 rounded-full flex items-center justify-center text-white ${step >= s.id ? 'bg-blue-600 shadow-md' : 'bg-gray-300'}`}>
                     {step > s.id ? <Icons.Check size={12} strokeWidth={4} /> : s.id}
                   </span>
                   {s.name}
                </div>
                {index < steps.length - 1 && <div className={`w-8 h-px ${step > s.id ? 'bg-blue-600' : 'bg-gray-300'}`} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 mx-auto max-w-7xl px-4">
        {step === 4 ? (
          <div className="text-center py-16 bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden relative max-w-4xl mx-auto">
            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-600"></div>
            
            <div className="relative">
              <div className="mx-auto mb-10 w-48 h-48">
                <LottieAnimation 
                  src="https://assets10.lottiefiles.com/packages/lf20_5tkzkblw.json" 
                  loop={false}
                />
              </div>
            </div>

            <h2 className="text-5xl font-black uppercase tracking-tighter text-gray-900 mb-4">Order Confirmed!</h2>
            <p className="text-gray-500 max-w-lg mx-auto text-sm font-medium leading-relaxed mb-6">
              Your payment has been successfully processed via the Laces & Soles secure gateway. Thank you for your purchase!
            </p>

            {/* Tracking ID Box - Compact */}
            <div className="bg-[#F8FAFC] border border-gray-200 p-4 rounded-3xl inline-block mb-6 shadow-inner">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Tracking ID</p>
               <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-xl border border-gray-100 shadow-sm">
                 <p className="text-2xl font-black text-blue-600 tracking-wider select-all">{confirmedOrderId}</p>
                 <button 
                  onClick={() => {
                    navigator.clipboard.writeText(confirmedOrderId);
                    toast.info("Tracking ID copied to clipboard!");
                  }}
                  className="text-gray-300 hover:text-blue-500 transition-colors"
                  title="Copy Tracking ID"
                 >
                   <Icons.Copy size={18} />
                 </button>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-8">
              <button 
                onClick={handleDownloadInvoice}
                className="group w-full sm:w-auto bg-[#111111] text-white px-8 py-4 text-xs font-black uppercase tracking-[0.15em] hover:bg-black shadow-lg shadow-gray-100 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Icons.Download size={18} className="group-hover:translate-y-0.5 transition-transform" /> 
                Invoice
              </button>
              
              <Link 
                to={`/track?id=${confirmedOrderId}`} 
                className="group w-full sm:w-auto bg-blue-600 text-white px-8 py-4 text-xs font-black uppercase tracking-[0.15em] hover:bg-blue-700 shadow-lg shadow-blue-50 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Icons.Package size={18} className="group-hover:scale-110 transition-transform" />
                Track Order
              </Link>
              
              <Link 
                to="/" 
                className="w-full sm:w-auto bg-white text-gray-900 border-2 border-gray-100 px-8 py-4 text-xs font-black uppercase tracking-[0.15em] hover:bg-gray-50 hover:border-gray-200 rounded-xl transition-all"
              >
                Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Form Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* STEP 1: SHIPPING */}
              <div className={`bg-white rounded-[24px] p-6 border shadow-sm transition-all ${step !== 1 && 'opacity-60 grayscale'}`}>
                <div className="flex items-center justify-between pointer-events-none">
                  <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-3">
                    <span className="size-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">1</span>
                    Shipping Information
                  </h3>
                  {step > 1 && <button onClick={() => setStep(1)} className="text-[10px] text-blue-600 font-bold uppercase pointer-events-auto">Edit</button>}
                </div>
                
                {step === 1 && (
                  <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-4">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">First Name</label>
                         <input type="text" className="w-full bg-[#f6f9fc] border border-gray-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                           defaultValue={user.full_name?.split(' ')[0] || ''}
                           onChange={e => setShippingData(p => {
                             const parts = (p.name || user.full_name || '').split(' ');
                             return { ...p, name: e.target.value + ' ' + (parts.slice(1).join(' ') || '') };
                           })}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Last Name</label>
                         <input type="text" className="w-full bg-[#f6f9fc] border border-gray-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                           defaultValue={user.full_name?.split(' ').slice(1).join(' ') || ''}
                           onChange={e => setShippingData(p => {
                             const parts = (p.name || user.full_name || '').split(' ');
                             return { ...p, name: (parts[0] || '') + ' ' + e.target.value };
                           })}
                         />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1">
                           Phone Number <span className="text-rose-500">*</span>
                        </label>
                        <input type="tel" 
                          required
                          className="w-full bg-[#f6f9fc] border border-gray-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" 
                          placeholder="+91 98765 43210"
                          value={shippingData.phone}
                          onChange={e => setShippingData(p => ({ ...p, phone: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1">
                           Pincode <span className="text-rose-500">*</span>
                        </label>
                        <input type="text" 
                          required
                          maxLength="6"
                          className="w-full bg-[#f6f9fc] border border-gray-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" 
                          placeholder="400001"
                          value={shippingData.pincode}
                          onChange={e => setShippingData(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '') }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1">
                          Full Address <span className="text-rose-500">*</span>
                       </label>
                       <input type="text" 
                         required
                         className="w-full bg-[#f6f9fc] border border-gray-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" 
                         placeholder="123 Street Name, Flat 4B"
                         value={shippingData.address}
                         onChange={e => setShippingData(p => ({ ...p, address: e.target.value }))}
                       />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">City</label>
                         <input type="text" className="w-full bg-[#f6f9fc] border border-gray-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Mumbai"
                          value={shippingData.city}
                          onChange={e => setShippingData(p => ({ ...p, city: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">State</label>
                         <input type="text" className="w-full bg-[#f6f9fc] border border-gray-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Maharashtra"
                          value={shippingData.state}
                          onChange={e => setShippingData(p => ({ ...p, state: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => {
                           const { phone, pincode, address } = shippingData;
                           if (!phone || !pincode || !address) {
                              toast.error("Please fill all mandatory fields (Phone, Pincode, Address)");
                              return;
                           }
                           if (pincode.length !== 6) {
                              toast.error("Pincode must be exactly 6 digits.");
                              return;
                           }
                           setStep(2);
                        }} 
                        className="w-full bg-blue-600 text-white py-4 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all"
                      >
                        Continue to KYC
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: KYC Verification */}
              <div className={`bg-white rounded-[24px] p-6 border shadow-sm transition-all ${step !== 2 && 'opacity-60 grayscale'}`}>
                 <div className="flex items-center justify-between pointer-events-none">
                  <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-3">
                    <span className="size-8 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">2</span>
                    Govt. KYC Verification
                  </h3>
                   {step > 2 && <span className="text-[10px] text-green-500 font-bold uppercase flex items-center gap-1"><Icons.ShieldCheck size={14}/> Verified</span>}
                </div>

                {step === 2 && (
                  <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-4">
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex gap-4 text-purple-800 text-sm">
                       <Icons.Info size={24} className="flex-shrink-0" />
                       <p>As per RBI guidelines for large e-commerce transactions, please verify your identity using a valid PAN Card.</p>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Permanent Account Number (PAN)</label>
                        <input 
                          type="text" 
                          value={kycData.pan}
                          onChange={(e) => setKycData({...kycData, pan: e.target.value.toUpperCase()})}
                          className="w-full bg-[#f6f9fc] border border-gray-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none uppercase" 
                          placeholder="ABCDE1234F" 
                        />
                    </div>
                    <div className="flex gap-4">
                      <button onClick={verifyKYC} className="w-full bg-purple-600 text-white py-4 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-all">
                        Verify Identity
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 3: Razorpay Payment Simulation */}
              <div className={`bg-white rounded-[24px] overflow-hidden border shadow-sm transition-all ${step !== 3 && 'opacity-60 grayscale'}`}>
                 <div className="p-6 border-b flex items-center justify-between bg-blue-900 text-white">
                  <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-3">
                    <span className="size-8 bg-blue-800 text-white rounded-full flex items-center justify-center">3</span>
                    Secure Payment
                  </h3>
                  <span className="text-[10px] uppercase font-black tracking-widest text-blue-200 flex items-center gap-1"><Icons.ShieldCheck size={12}/> Razorpay Secured</span>
                </div>

                {step === 3 && (
                  <div className="p-8 animate-in fade-in slide-in-from-top-4 text-center">
                    <div className="mb-8">
                       <div className="size-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                         <Icons.CreditCard size={32} />
                       </div>
                       <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Ready to Secure Your Style?</h4>
                       <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                         Click below to open the secure Razorpay window. You can pay via **UPI (GPay/PhonePe), Credit/Debit Cards, or NetBanking**.
                       </p>
                    </div>

                    <div className="space-y-4 max-w-sm mx-auto">
                      <button 
                        onClick={handleCheckout} 
                        disabled={isProcessing}
                        className="w-full bg-[#1A73E8] text-white py-5 text-sm flex items-center justify-center gap-3 font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all disabled:opacity-70 active:scale-95"
                      >
                        {isProcessing ? <UiballLoader size={24} color="#ffffff" /> : <Icons.Lock size={18} />}
                        {isProcessing ? 'Waiting for Payment...' : `Pay ₹${total.toFixed(2)} Now`}
                      </button>

                      <div className="flex items-center justify-center gap-4 py-2 opacity-50 grayscale hover:grayscale-0 transition-all">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/UPI-Logo-vector.svg" alt="UPI" className="h-4" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-3" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-5" />
                      </div>

                      <button 
                        onClick={() => setStep(1)}
                        className="w-full text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        ← Back to Shipping
                      </button>
                    </div>

                    <div className="mt-12 pt-6 border-t border-gray-50 flex items-center justify-center gap-2">
                       <Icons.Lock size={12} className="text-green-500" />
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SSL Encrypted 256-bit Connection</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Summary */}
            <div className="space-y-6">
              <div className="bg-white rounded-[24px] p-6 border shadow-sm sticky top-32">
                <h4 className="text-sm font-black uppercase tracking-widest border-b border-gray-100 pb-4 mb-6">Order Details</h4>
                
                <div className="space-y-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar-light mb-6">
                  {cartItems.map(item => {
                    const product = getProductById(item.id);
                    if (!product) return null;
                    return (
                      <div key={`${item.id}-${item.size}`} className="flex justify-between gap-4">
                        <div className="flex gap-4">
                          <div className="relative">
                            <img src={formatImageUrl(product.image)} className="size-16 object-contain bg-gray-50 rounded-xl p-2 border border-gray-100" alt="" />
                            <span className="absolute -top-2 -right-2 bg-gray-900 text-white size-5 rounded-full flex items-center justify-center text-[10px] font-bold">{item.quantity}</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold line-clamp-2 text-gray-800 leading-tight">{product.title}</p>
                            <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-wider">{product.brand}</p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-gray-900">₹{(product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Promo Code System */}
                <div className="py-4 border-y border-gray-100 mb-4 space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block">Promo Code</label>
                   <div className="flex gap-2">
                     <input 
                        type="text" 
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        className="flex-1 bg-[#f6f9fc] border border-gray-100 rounded-xl p-3 text-xs font-bold outline-none uppercase" 
                        placeholder="FLIPKART10" 
                        disabled={discount.active}
                     />
                     {!discount.active ? (
                       <button onClick={handleApplyPromo} className="bg-gray-900 text-white px-4 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-500 transition-colors">Apply</button>
                     ) : (
                       <button onClick={() => setDiscount({percent:0, active:false, msg:''})} className="bg-red-50 text-red-600 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-red-100 transition-colors"><Icons.X size={14}/></button>
                     )}
                   </div>
                   {discount.msg && (
                     <p className={`text-[10px] font-bold ${discount.active ? 'text-green-600' : 'text-red-500'}`}>{discount.msg}</p>
                   )}
                </div>

                {/* Totals */}
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>Subtotal</span>
                    <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discount.active && (
                    <div className="flex justify-between text-xs font-bold text-green-600">
                      <span>Discount ({discount.percent}%)</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>Shipping fee</span>
                    <span className="text-gray-900">₹{shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black pt-4 border-t border-gray-100 mt-4">
                    <span>Total</span>
                    <span className="text-blue-600">₹{total.toFixed(2)}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
