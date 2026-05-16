import { useState, useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';

// --- RICH COMPONENTS ---

const ShoeCustomizer = () => {
  const [color, setColor] = useState('red');
  const images = {
    red: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=300", 
    black: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=300", 
    white: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&q=80&w=300"
  };
  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-3 shadow-xl">
      <div className="relative bg-gray-50 rounded-2xl overflow-hidden mb-4 p-2">
        <span className="absolute top-2 left-2 bg-white/80 backdrop-blur text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-sm z-10 text-gray-900">Live 3D</span>
        <img src={images[color]} className="w-full h-32 object-cover rounded-xl transition-all duration-500 mix-blend-multiply" alt="Custom Shoe" />
      </div>
      <div className="flex gap-3 justify-center mb-4">
        <button onClick={() => setColor('white')} className={`size-8 rounded-full bg-white border-4 shadow-sm transition-all hover:scale-110 ${color === 'white' ? 'border-gray-900' : 'border-gray-200'}`}></button>
        <button onClick={() => setColor('red')} className={`size-8 rounded-full bg-red-500 border-4 shadow-sm transition-all hover:scale-110 ${color === 'red' ? 'border-gray-900' : 'border-transparent'}`}></button>
        <button onClick={() => setColor('black')} className={`size-8 rounded-full bg-gray-900 border-4 shadow-sm transition-all hover:scale-110 ${color === 'black' ? 'border-gray-400' : 'border-transparent'}`}></button>
      </div>
      <button className="w-full bg-gray-900 hover:bg-rose-500 text-white text-[10px] py-3 rounded-xl uppercase tracking-widest font-black transition-colors active:scale-95">
        Save Custom Design
      </button>
    </div>
  );
};

const StoreMap = () => {
  return (
     <div className="bg-white border border-gray-100 rounded-3xl p-2 shadow-xl relative overflow-hidden group">
        <div className="relative">
          <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=400" className="w-full h-32 object-cover rounded-2xl opacity-80 group-hover:opacity-100 transition-opacity sepia-[0.2]" alt="Map" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="relative">
              <Icons.MapPin size={36} className="text-rose-500 drop-shadow-lg relative z-10" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-4 bg-rose-500/50 blur-sm rounded-full animate-ping"></div>
            </div>
          </div>
        </div>
        <div className="p-3 text-center mt-1">
          <h5 className="text-[12px] font-black uppercase text-gray-900 tracking-tight">L&S Flagship Store</h5>
          <p className="text-[10px] font-bold text-gray-500 mb-3">1.2 km away • Open until 9 PM</p>
          <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 text-[10px] py-2.5 rounded-xl uppercase tracking-widest font-black transition-colors flex items-center justify-center gap-2 active:scale-95">
            <Icons.Navigation size={12} /> Get Directions
          </button>
        </div>
     </div>
  );
};

// --- MAIN CHAT COMPONENT ---

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm your Laces & Soles virtual assistant. Looking for your perfect fit today?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isAgentHandoff, setIsAgentHandoff] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isTyping]);

  const quickReplies = [
    "Trending Shoes 🔥",
    "Customize Shoe 🎨",
    "Find Store 📍",
    "Talk to Human 🧑‍💼"
  ];

  const getBotResponse = (userInput) => {
    const query = userInput.toLowerCase();
    
    // 1. HUMAN AGENT HANDOFF
    if (query.includes('human') || query.includes('agent') || query.includes('customer care')) {
      setIsAgentHandoff(true);
      return { 
        text: "I'm connecting you to a live stylist. Please hold on for a moment...",
        escalate: true
      };
    }

    // 2. INTERACTIVE CUSTOMIZER
    if (query.includes('customize') || query.includes('design')) {
      return { 
        text: "Try our new Live 3D Customizer! Select a color swatch below to change the shoe material instantly.",
        showCustomizer: true
      };
    }

    // 3. STORE MAP
    if (query.includes('store') || query.includes('location') || query.includes('near me')) {
      return { 
        text: "I found a Laces & Soles boutique right near you!",
        showMap: true
      };
    }

    // 4. PRODUCT CARDS WITH AR TRY-ON
    if (query.includes('trending') || query.includes('popular')) {
      return { 
        text: "Here are the top 3 pairs trending this week. Tap 'AR Try-on' to see how they look on your feet!",
        products: [
          { name: "Nike Air Jordan 1", price: "₹12,499", image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=200", ar: true },
          { name: "Adidas Ultraboost", price: "₹18,999", image: "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&q=80&w=200", ar: true },
          { name: "Puma RS-X3", price: "₹8,999", image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=200", ar: false }
        ]
      };
    }

    // 5. RICH RECEIPT
    if (query.includes('invoice') || query.includes('receipt') || query.includes('bill')) {
      return { 
        text: "Here is the invoice for your latest order (ORD1023):",
        receipt: {
          orderId: "ORD1023",
          date: "May 15, 2026",
          items: [
            { name: "Nike Air Jordan 1 (Size 9)", qty: 1, price: "₹12,499" },
            { name: "Premium Shoe Cleaning Kit", qty: 1, price: "₹999" }
          ],
          subtotal: "₹13,498",
          tax: "₹675",
          total: "₹14,173"
        }
      };
    }

    // 6. ORDER TIMELINE
    if (query.includes('track') || query.includes('ord1023')) {
      return { 
        text: "Tracking Order: ORD1023",
        timeline: [
          { label: "Ordered", status: "complete" },
          { label: "Packed", status: "complete" },
          { label: "Shipped", status: "current" },
          { label: "Delivery", status: "pending" }
        ],
        deliveryDate: "Expected: Tomorrow, 2:00 PM"
      };
    }

    // GREETINGS & DEFAULTS
    if (query.includes('hello') || query.includes('hi')) {
      return { text: "Hello! Welcome to Laces & Soles. How can I help you find your perfect pair today?", suggestSizeGuide: true };
    }

    return { text: "That's a great question! A real stylist will be with you shortly. In the meantime, try asking to 'Customize Shoe' or 'Find Store'." };
  };

  const handleSend = (e, text = null) => {
    if (e) e.preventDefault();
    const userMessage = text || input;
    if (!userMessage.trim()) return;

    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    if (!text) setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const response = getBotResponse(userMessage);
      setMessages(prev => [...prev, { 
        text: response.text, 
        sender: 'bot', 
        suggestSizeGuide: response.suggestSizeGuide,
        products: response.products,
        timeline: response.timeline,
        deliveryDate: response.deliveryDate,
        voiceTip: response.voiceTip,
        options: response.options,
        receipt: response.receipt,
        escalate: response.escalate,
        showCustomizer: response.showCustomizer,
        showMap: response.showMap
      }]);
    }, 1200);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[calc(100vw-2rem)] md:w-[400px] max-h-[85vh] bg-white rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.3)] border border-gray-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-12 fade-in zoom-in-95 duration-500 origin-bottom-right pointer-events-auto">
          {/* Dynamic Header */}
          <div className={`${isAgentHandoff ? 'bg-indigo-600' : 'bg-gray-900'} p-6 flex items-center justify-between text-white shrink-0 relative overflow-hidden transition-colors duration-700`}>
            <div className="flex items-center gap-4 relative z-10">
              <div className="relative">
                <div className={`size-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${isAgentHandoff ? 'bg-indigo-500 rotate-0' : 'bg-rose-500 rotate-6 hover:rotate-0'}`}>
                  {isAgentHandoff ? <Icons.Headphones size={24} className="text-white" /> : <Icons.Zap size={24} className="text-white fill-white" />}
                </div>
                <div className="absolute -bottom-1 -right-1 size-4 bg-green-500 rounded-full border-4 border-gray-900 animate-pulse"></div>
              </div>
              <div>
                <h4 className={`text-[10px] font-black uppercase tracking-[0.4em] mb-0.5 ${isAgentHandoff ? 'text-indigo-200' : 'text-rose-500'}`}>
                  {isAgentHandoff ? 'Connecting...' : 'Premium AI'}
                </h4>
                <h3 className="text-base font-black uppercase tracking-widest leading-none">
                  {isAgentHandoff ? 'Live Stylist' : 'Style Concierge'}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2 relative z-10">
              <button onClick={() => { setMessages([{ text: "Chat history cleared. How can I help?", sender: 'bot' }]); setIsAgentHandoff(false); }} className="size-9 flex items-center justify-center rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <Icons.Trash2 size={18} />
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="size-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
              >
                <Icons.X size={20} />
              </button>
            </div>
            <div className={`absolute top-0 right-0 size-32 rounded-full -mr-16 -mt-16 blur-3xl transition-colors duration-700 ${isAgentHandoff ? 'bg-indigo-400/30' : 'bg-rose-500/10'}`}></div>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 p-6 bg-[#fcfdfe] overflow-y-auto flex flex-col gap-6 custom-scrollbar-light">
            {messages.map((msg, idx) => (
              <div key={idx} className="flex flex-col gap-4">
                <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-4 rounded-3xl text-[12px] font-bold leading-relaxed shadow-sm whitespace-pre-wrap transition-all ${
                    msg.sender === 'user' 
                      ? 'bg-rose-500 text-white rounded-br-none' 
                      : msg.escalate 
                        ? 'bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-bl-none'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>

                {/* RICH COMPONENTS */}
                
                {/* Customizer */}
                {msg.showCustomizer && <ShoeCustomizer />}

                {/* Store Map */}
                {msg.showMap && <StoreMap />}
                
                {/* 1. Product Cards with AR Try-On */}
                {msg.products && (
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x custom-scrollbar-hide">
                    {msg.products.map((p, i) => (
                      <div key={i} className="w-[160px] bg-white border border-gray-100 rounded-2xl p-2 shadow-md snap-center shrink-0 group hover:border-rose-500 transition-colors relative">
                        {p.ar && (
                           <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm text-gray-900 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                             <Icons.Scan size={10} className="text-rose-500" /> AR Try-on
                           </div>
                        )}
                        <img src={p.image} alt={p.name} className="w-full h-28 object-cover rounded-xl mb-3 group-hover:scale-105 transition-transform" />
                        <h5 className="text-[11px] font-black uppercase tracking-tight text-gray-900 truncate">{p.name}</h5>
                        <p className="text-[11px] font-bold text-rose-500 mb-3">{p.price}</p>
                        <button className="w-full py-2 flex items-center justify-center gap-1.5 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 transition-colors">
                          <Icons.ShoppingBag size={12} /> View
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Rich Receipt */}
                {msg.receipt && (
                  <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 bg-green-500 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-sm">
                       Paid
                     </div>
                     <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-4">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Invoice</p>
                          <p className="text-[14px] font-black text-gray-900">{msg.receipt.orderId}</p>
                        </div>
                        <p className="text-[10px] font-bold text-gray-500">{msg.receipt.date}</p>
                     </div>
                     <div className="space-y-3 mb-4">
                       {msg.receipt.items.map((item, i) => (
                         <div key={i} className="flex justify-between items-start text-[11px]">
                           <span className="font-bold text-gray-700 w-2/3">{item.qty}x {item.name}</span>
                           <span className="font-black text-gray-900">{item.price}</span>
                         </div>
                       ))}
                     </div>
                     <div className="border-t border-dashed border-gray-200 pt-3 space-y-1">
                        <div className="flex justify-between text-[11px] text-gray-500 font-bold">
                           <span>Subtotal</span><span>{msg.receipt.subtotal}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-gray-500 font-bold">
                           <span>Tax</span><span>{msg.receipt.tax}</span>
                        </div>
                        <div className="flex justify-between text-[14px] font-black text-gray-900 mt-2 pt-2 border-t border-gray-100">
                           <span>Total</span><span className="text-rose-500">{msg.receipt.total}</span>
                        </div>
                     </div>
                     <button className="w-full mt-5 bg-gray-50 hover:bg-gray-100 text-gray-900 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                       <Icons.Download size={14} /> Download PDF
                     </button>
                  </div>
                )}

                {/* 3. Timeline */}
                {msg.timeline && (
                  <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      {msg.timeline.map((t, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 relative flex-1">
                          <div className={`size-3 rounded-full z-10 ${
                            t.status === 'complete' ? 'bg-green-500' : 
                            t.status === 'current' ? 'bg-rose-500 ring-4 ring-rose-500/20 animate-pulse' : 
                            'bg-gray-200'
                          }`}></div>
                          <span className={`text-[8px] font-black uppercase tracking-widest ${
                            t.status === 'pending' ? 'text-gray-400' : 'text-gray-900'
                          }`}>{t.label}</span>
                          {i < msg.timeline.length - 1 && (
                            <div className={`absolute top-1.5 left-[50%] w-full h-[2px] -z-0 ${
                              msg.timeline[i+1].status !== 'pending' ? 'bg-green-500' : 'bg-gray-100'
                            }`}></div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                      <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{msg.deliveryDate}</p>
                    </div>
                  </div>
                )}

                {/* 4. Voice Tip */}
                {msg.voiceTip && (
                  <button 
                    onClick={() => {
                      setIsPlayingVoice(true);
                      setTimeout(() => setIsPlayingVoice(false), 3000);
                    }}
                    className="flex items-center gap-4 bg-white border border-gray-100 p-4 rounded-3xl shadow-lg hover:border-rose-500 transition-all active:scale-[0.98]"
                  >
                    <div className={`size-10 rounded-full flex items-center justify-center text-white ${isPlayingVoice ? 'bg-rose-500 animate-pulse' : 'bg-gray-900'}`}>
                      {isPlayingVoice ? <Icons.Square size={16} /> : <Icons.Play size={16} className="ml-0.5" />}
                    </div>
                    <div className="flex-1 text-left">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-900">Stylist fit tip</h5>
                      <div className="flex gap-0.5 mt-1">
                        {[1,2,3,4,5,6,7,8].map(i => (
                          <div key={i} className={`w-1 rounded-full bg-gray-200 ${isPlayingVoice ? 'animate-h-bounce' : 'h-3'}`} style={{ height: isPlayingVoice ? undefined : (4 + Math.random()*8) + 'px', animationDelay: i*0.1 + 's' }}></div>
                        ))}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-gray-400">0:24</span>
                  </button>
                )}

                {/* Options / Quiz */}
                {msg.options && (
                  <div className="flex flex-col gap-2">
                    {msg.options.map((opt, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleSend(null, opt)}
                        className="w-full text-left p-3 bg-white border border-gray-100 rounded-2xl text-[11px] font-bold hover:border-rose-500 hover:text-rose-500 transition-all shadow-sm"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {msg.suggestSizeGuide && (
                  <div className="flex justify-start px-2">
                    <button 
                      onClick={() => setShowSizeGuide(true)}
                      className="bg-gray-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all flex items-center gap-2 shadow-xl shadow-gray-900/10 active:scale-95"
                    >
                      <Icons.Ruler size={14} /> Open Size Chart
                    </button>
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className={`border p-4 rounded-3xl rounded-bl-none shadow-sm flex gap-2 ${isAgentHandoff ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-gray-100'}`}>
                  <div className={`size-2 rounded-full animate-bounce ${isAgentHandoff ? 'bg-indigo-500' : 'bg-rose-500'}`}></div>
                  <div className={`size-2 rounded-full animate-bounce ${isAgentHandoff ? 'bg-indigo-500' : 'bg-rose-500'}`} style={{ animationDelay: '0.2s' }}></div>
                  <div className={`size-2 rounded-full animate-bounce ${isAgentHandoff ? 'bg-indigo-500' : 'bg-rose-500'}`} style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length === 1 && !isTyping && (
            <div className="px-6 py-4 bg-gray-50/50 flex flex-wrap gap-2 shrink-0 border-t border-gray-100/50">
               {quickReplies.map((reply, i) => (
                 <button 
                  key={i}
                  onClick={() => handleSend(null, reply)}
                  className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl text-[10px] font-bold hover:border-rose-500 hover:text-rose-500 transition-all active:scale-95 shadow-sm"
                 >
                   {reply}
                 </button>
               ))}
            </div>
          )}

          {/* Input Area with Image Upload Mock */}
          <div className="p-5 bg-white border-t border-gray-100 shrink-0 relative">
            <form onSubmit={handleSend} className="flex gap-3">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask Concierge..." 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-6 py-4 text-[12px] font-bold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5 transition-all"
                />
                <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-rose-500 transition-colors tooltip-trigger group">
                  <Icons.Camera size={20} />
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                    Visual Search
                  </span>
                </button>
              </div>
              <button 
                type="submit" 
                disabled={!input.trim()} 
                className={`text-white size-14 rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 shadow-2xl active:scale-95 ${isAgentHandoff ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/10' : 'bg-gray-900 hover:bg-rose-500 shadow-gray-900/10'}`}
              >
                <Icons.ArrowUp size={24} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <div className="flex flex-col items-end gap-3 pointer-events-auto group">
        {!isOpen && (
          <div className="bg-white px-4 py-2 rounded-2xl shadow-xl border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-900 mb-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
            Style Concierge Online
          </div>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`size-16 rounded-[1.75rem] flex items-center justify-center shadow-[0_20px_50px_rgba(244,63,94,0.4)] transition-all duration-700 transform hover:scale-110 active:scale-90 ${
            isOpen ? 'bg-gray-900 -rotate-90' : 'bg-rose-500 rotate-0'
          }`}
        >
          {isOpen ? <Icons.X size={32} className="text-white" /> : <Icons.MessageCircle size={32} className="text-white" />}
        </button>
      </div>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-xl animate-in fade-in duration-500 pointer-events-auto">
           <div className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-[0_50px_150px_rgba(0,0,0,0.6)] relative animate-in zoom-in-95 slide-in-from-bottom-16 duration-500">
              <div className="bg-gray-900 p-10 text-white flex justify-between items-center relative overflow-hidden">
                 <div className="relative z-10">
                   <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-rose-500 mb-2">Technical Specs</h4>
                   <h3 className="text-2xl font-black uppercase tracking-widest">Sizing Chart</h3>
                 </div>
                 <button onClick={() => setShowSizeGuide(false)} className="size-12 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 transition-colors relative z-10">
                    <Icons.X size={24} />
                 </button>
                 <div className="absolute top-0 right-0 size-48 bg-rose-500/20 rounded-full -mr-24 -mt-24 blur-3xl"></div>
              </div>
              <div className="p-10">
                 <div className="space-y-5">
                    <div className="grid grid-cols-3 gap-4 text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 pb-4 border-b-2 border-gray-100">
                       <span>UK Size</span>
                       <span>Length (CM)</span>
                       <span>EU / US</span>
                    </div>
                    {[
                      { uk: '6', cm: '24.5', eu: '40 / 7' },
                      { uk: '7', cm: '25.4', eu: '41 / 8' },
                      { uk: '8', cm: '26.2', eu: '42 / 9' },
                      { uk: '9', cm: '27.1', eu: '43 / 10' },
                      { uk: '10', cm: '28.0', eu: '44 / 11' },
                      { uk: '11', cm: '28.8', eu: '45 / 12' },
                    ].map((row, i) => (
                      <div key={i} className="grid grid-cols-3 gap-4 text-[13px] font-black text-gray-700 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/80 transition-all rounded-2xl px-2">
                         <span className="text-gray-900">UK {row.uk}</span>
                         <span className="text-rose-500">{row.cm} cm</span>
                         <span className="text-gray-400 font-bold">{row.eu}</span>
                      </div>
                    ))}
                 </div>
                 <div className="mt-10 p-6 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-inner">
                   <p className="text-[11px] font-bold text-gray-500 italic leading-relaxed text-center">
                     Pro Tip: For the most accurate measurement, stand on a piece of paper and mark your heel and longest toe.
                   </p>
                 </div>
                 <button 
                  onClick={() => setShowSizeGuide(false)}
                  className="w-full mt-10 bg-gray-900 text-white py-5 rounded-[1.75rem] text-[12px] font-black uppercase tracking-[0.3em] hover:bg-rose-500 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.2)] active:scale-[0.98]"
                 >
                   Return to Chat
                 </button>
              </div>
           </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .animate-h-bounce {
          animation: h-bounce 0.6s ease-in-out infinite;
        }
        @keyframes h-bounce {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
      `}} />
    </div>
  );
}
