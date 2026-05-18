import { useState, useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { useShop } from '../../context/ShopContext';

import axios from 'axios';
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  const { products, formatImageUrl } = useShop();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm your Laces & Soles virtual assistant. Looking for your perfect fit today?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(null); // stores active message text
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false); // global mute toggle
  const [hasUserMessaged, setHasUserMessaged] = useState(false); // track if user messaged first
  const [isAgentHandoff, setIsAgentHandoff] = useState(false);
  const [stylistStatus, setStylistStatus] = useState('offline'); // offline | connecting | active
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const speakText = (text, cancelExisting = true) => {
    if (!('speechSynthesis' in window)) return;
    
    if (cancelExisting) {
      window.speechSynthesis.cancel();
    }

    if (isPlayingVoice === text) {
      setIsPlayingVoice(null);
      return;
    }

    // Clean markdown bolding, emojis, and specific chars for clear narration
    const cleanText = text
      .replace(/[\*\_]/g, '')
      .replace(/🧑‍💼|👟|🎟️|❌|👔|📏|⚡|🔥|📦|🔍|📸|👩‍💼|🌟|✨|📞/g, '')
      .replace(/\[[^\]]+\]/g, '') // remove brackets
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.05;

    // Load available voices
    const voices = window.speechSynthesis.getVoices();
    let activeVoice = null;

    if (isAgentHandoff) {
      // Find a female voice for Stylist Sarah!
      activeVoice = voices.find(v => 
        (v.name.toLowerCase().includes('female') || 
         v.name.toLowerCase().includes('zira') || 
         v.name.toLowerCase().includes('google uk english female') || 
         v.name.toLowerCase().includes('google us english female') || 
         v.name.toLowerCase().includes('hazel') ||
         v.name.toLowerCase().includes('susan') ||
         v.name.toLowerCase().includes('haruka')) && 
        v.lang.startsWith('en')
      );
      
      // Fallback if no specific female voice found
      if (!activeVoice) {
        activeVoice = voices.find(v => v.name.includes('Zira') || v.name.includes('Google US English') || v.lang.startsWith('en'));
      }
    } else {
      // Use standard concierge/robotic or male voice for S-39 virtual assistant
      activeVoice = voices.find(v => 
        (v.name.toLowerCase().includes('male') || 
         v.name.toLowerCase().includes('david') || 
         v.name.toLowerCase().includes('google us english male') || 
         v.name.toLowerCase().includes('george')) && 
        v.lang.startsWith('en')
      );
      
      // Fallback
      if (!activeVoice) {
        activeVoice = voices.find(v => v.name.includes('Google US English') || v.lang.startsWith('en'));
      }
    }

    if (activeVoice) {
      utterance.voice = activeVoice;
    }

    utterance.onstart = () => {
      setIsPlayingVoice(text);
    };

    utterance.onend = () => {
      setIsPlayingVoice(null);
    };

    utterance.onerror = () => {
      setIsPlayingVoice(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isTyping]);

  useEffect(() => {
    if (messages.length === 0 || !isVoiceEnabled || !hasUserMessaged) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender === 'bot') {
      speakText(lastMsg.text);
    }
  }, [messages, isVoiceEnabled, hasUserMessaged]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Image = event.target.result;
      
      // Store reference for dynamic user-driven training
      window.lastUploadedImage = { name: file.name, base64: base64Image };

      setMessages(prev => [...prev, {
        sender: 'user',
        text: `🔍 Visual Search: ${file.name}`,
        image: base64Image
      }]);
      setIsTyping(true);

      setTimeout(async () => {
        const response = await getBotResponse(`[visual_search] ${file.name}`);
        setIsTyping(false);
        setMessages(prev => [...prev, {
          text: response.text,
          sender: 'bot',
          products: response.products,
          options: response.options,
          ar: true
        }]);
      }, 1500);
    };
    reader.readAsDataURL(file);
  };

  const quickReplies = [
    "Trending Shoes 🔥",
    "Track Order 📦",
    "Check Coupons 🎟️",
    "Talk to Human 🧑‍💼"
  ];

  const getBotResponse = async (userInput, currentAgentHandoff) => {
    // --- WRONG/RIGHT PROMPT ANALYSIS & AUTOCORRECT TRAINING ---
    let query = userInput.toLowerCase().trim();
    const originalQuery = query;

    // Typo corrections map for brand spelling errors
    const corrections = {
      'niqe': 'nike', 'nik': 'nike', 'nk': 'nike',
      'adidass': 'adidas', 'adids': 'adidas', 'addas': 'adidas',
      'pumma': 'puma', 'pma': 'puma',
      'jordn': 'jordan', 'jordan retro': 'jordan',
      'rebok': 'reebok', 'reebok classic': 'reebok',
      'balence': 'balance', 'new balence': 'balance', 'nb': 'balance',
      'sneker': 'sneaker', 'snekers': 'sneaker', 'shoes s': 'shoes'
    };

    // Apply typo corrections dynamically
    Object.keys(corrections).forEach(typo => {
      const regex = new RegExp(`\\b${typo}\\b`, 'g');
      if (regex.test(query)) {
        query = query.replace(regex, corrections[typo]);
      }
    });

    // Smart context parser: resolve gender spelling styles
    if (query.includes('mans') || query.includes("men's") || query.includes('footwear for men')) {
      query += ' men';
    }
    if (query.includes('womans') || query.includes("women's") || query.includes('footwear for women') || query.includes('lady') || query.includes('ladies')) {
      query += ' women';
    }
    
    if (currentAgentHandoff) {
      if (query.includes('bye') || query.includes('exit') || query.includes('disconnect') || query.includes('thanks') || query.includes('thank you') || query.includes('disconnect chat') || query.includes('❌')) {
        setIsAgentHandoff(false);
        setStylistStatus('offline');
        return {
          text: "You're welcome! I'm disconnecting the live stylist session now. S-39 Concierge has resumed. Feel free to check coupons, customize shoes, or track your orders!",
          options: ["Trending Shoes 🔥", "Track Order 📦", "Talk to Human 🧑‍💼"]
        };
      }

      if (query.includes('size') || query.includes('sizing') || query.includes('fit') || query.includes('📏') || /\b\d+(\.5)?\b/.test(query)) {
        // Let's try to extract a numeric size
        const sizeMatch = query.match(/\b(size\s*)?(\d+(\.5)?)\b/i);
        if (sizeMatch) {
          const parsedSize = sizeMatch[2];
          // Filter products where p.sizes includes parsedSize
          let matched = products.filter(p => {
            const sizesArr = p.sizes ? p.sizes.toString().split(',') : [];
            return sizesArr.includes(parsedSize) || sizesArr.some(s => s.trim() === parsedSize);
          });

          if (matched.length > 0) {
            const topMatches = matched.slice(0, 3).map(p => ({
              id: p.id,
              name: p.title,
              price: `₹${p.price.toLocaleString()}`,
              image: formatImageUrl(p.image),
              ar: true
            }));

            return {
              text: `👟 **Perfect Fit Found!**\n\n"I've verified our live database for size **US ${parsedSize}** and found that these 3 premium models are currently in stock! They fit true-to-size, offering maximum support and comfort. Select one to try it on in AR:"`,
              products: topMatches,
              options: ["Outfits/Styling Advice 👔", "Stylist Promo Code 🎟️", "Disconnect Chat ❌"]
            };
          }
        }

        // Generic size consult prompt with quick chips
        return {
          text: `📏 **Stylist Sizing Portal Active!**\n\n\"Fit is extremely critical! Most of our boutique shoes fit true-to-size, but certain models (like premium Jordans or narrow-soled Nikes) have specific fit variations. What normal US/UK size (e.g., 7, 8, 9, 10, 11) are you looking for? I will query our live inventory for in-stock options matching your perfect fit!\"`,
          options: ["Size 8 📏", "Size 9 📏", "Size 10 📏", "Size 11 📏", "Disconnect Chat ❌"]
        };
      }

      if (query.includes('style') || query.includes('outfit') || query.includes('advice') || query.includes('recommend') || query.includes('👔')) {
        return {
          text: "👔 **Stylist Outfit Guide**:\n\"I would love to help you build a fit around your footwear! For an effortless streetwear aesthetic, style thick-soled lifestyle shoes with cargo joggers, a vintage washed tee, and a matching cap.\n\nFor a clean, smart-casual look, pair low-profile suede sneakers with cuffed chinos and a light linen shirt. Which vibe matches your day?\"",
          options: ["Sizing Consulting 📏", "Stylist Promo Code 🎟️", "Disconnect Chat ❌"]
        };
      }

      if (query.includes('code') || query.includes('coupon') || query.includes('discount') || query.includes('promo') || query.includes('price') || query.includes('🎟️')) {
        return {
          text: "🎟️ **Stylist Privilege Activated!**\n\"Since you're chatting directly with a consultant, I've unlocked an exclusive styling coupon for you! Use **'SARAHSTYLE15'** at checkout to get a flat **15% off** your order.\n\nLet me know if you need help checking out!\"",
          options: ["Sizing Consulting 📏", "Outfits/Styling Advice 👔", "Disconnect Chat ❌"]
        };
      }

      return {
        text: "🧑‍💼 **Sarah (Senior Stylist)**:\n\"That sounds wonderful! I'd love to help you find the absolute best options. Let me know if you want to verify sizing, check colorways, or apply coupon codes! 🌟\"",
        options: ["Sizing Consulting 📏", "Outfits/Styling Advice 👔", "Stylist Promo Code 🎟️", "Disconnect Chat ❌"]
      };
    }

    // 1. HUMAN AGENT HANDOFF
    if (query.includes('human') || query.includes('agent') || query.includes('customer care')) {
      return { 
        text: "I'm connecting you to a live stylist. Please hold on for a moment... 📞",
        escalate: true
      };
    }

    // 2. CHECK COUPONS
    if (query.includes('coupon') || query.includes('discount') || query.includes('promo')) {
      return { 
        text: "You can use the coupon code 'FLIPKART10' at checkout to get a flat 10% discount on your entire order! 🛍️"
      };
    }

    // 4. PRODUCT CARDS WITH AR TRY-ON
    if (query.includes('trending') || query.includes('popular')) {
      // Use real products if available
      const trendingProducts = products && products.length >= 3 ? products.slice(0, 3).map(p => ({
        id: p.id,
        name: p.title,
        price: `₹${p.price.toLocaleString()}`,
        image: formatImageUrl(p.image),
        ar: Math.random() > 0.5 // Randomize AR availability
      })) : [
        { name: "Nike Air Jordan 1", price: "₹12,499", image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=200", ar: true },
        { name: "Adidas Ultraboost", price: "₹18,999", image: "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&q=80&w=200", ar: true },
        { name: "Puma RS-X3", price: "₹8,999", image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=200", ar: false }
      ];

      return { 
        text: "Here are the top 3 pairs trending this week. Tap 'AR Try-on' to see how they look on your feet!",
        products: trendingProducts
      };
    }

    // 3. REAL ORDER TIMELINE & DYNAMIC SCANNER
    const trackMatch = query.match(/track\s+(l&s-[a-z0-9\-]+)/i) || query.match(/(l&s-[a-z0-9\-]+)/i) || query.match(/\b([a-z0-9\-]{5,15})\b/i);
    if (trackMatch || query.includes('track') || query.includes('delivery') || query.includes('order status') || query.includes('where is my')) {
      let orderId = trackMatch ? (trackMatch[1] || trackMatch[0]).toUpperCase() : null;
      
      // Auto-correct prefix if they forgot the boutique's L&S- prefix but supplied a code
      if (orderId && !orderId.startsWith('L&S-')) {
        orderId = `L&S-${orderId}`;
      }

      if (!orderId || orderId === 'L&S-TRACK') {
        return { 
          text: `🔍 **Order Status Scanner Active**\n\n\"It looks like you want to track your order! To trace your package, please enter a valid tracking ID (e.g., **L&S-AF1024**).\n\nI analyzed your prompt but couldn't detect a valid invoice code. Would you like me to check our trending collections or connect you directly to a human stylist?\"`,
          options: ["Talk to Human 🧑‍💼", "Trending Shoes 🔥"]
        };
      }
      
      try {
        const res = await axios.get(`${API}/api/track/${orderId}`);
        if (res.status === 200) {
          const order = res.data;
          
          const getStatusIndex = (status) => {
            const flow = ['Processing', 'Pending', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
            // Normalize Pending and Processing
            if (status === 'Pending') status = 'Processing';
            return flow.indexOf(status);
          };
          
          const currentIndex = getStatusIndex(order.current_status);
          const timeline = [
            { label: "Ordered", status: currentIndex >= 0 ? "complete" : "pending" },
            { label: "Packed", status: currentIndex > 2 ? "complete" : currentIndex === 2 ? "current" : "pending" },
            { label: "Shipped", status: currentIndex > 3 ? "complete" : currentIndex === 3 ? "current" : "pending" },
            { label: "Delivery", status: currentIndex > 4 ? "complete" : currentIndex === 4 ? "current" : "pending" }
          ];

          return {
            text: `Tracking Order: ${order.tracking_id}`,
            timeline: timeline,
            deliveryDate: `Current Status: ${order.current_status}`
          };
        }
      } catch (err) {
        console.warn("Failed to fetch order:", err);
        // Fallback
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
    }

    // 4. VISUAL SEARCH HANDLER
    if (query.includes('[visual_search]')) {
      const fileName = userInput.replace(/\[visual_search\]/i, '').trim();
      
      // Heuristic model: check if filename matches standard shoe terms or is explicitly trained
      const trained = JSON.parse(localStorage.getItem('trained_shoes') || '[]');
      const lowerName = fileName.toLowerCase();
      const shoeKeywords = ['shoe', 'sneaker', 'boot', 'nike', 'adidas', 'jordan', 'puma', 'converse', 'vans', 'crocs', 'heel', 'sandal', 'yeezy', 'ultraboot', 'pegasus', 'af1', 'footwear', 'run', 'sport', 'fit', 'sole', 'lace'];
      
      const isShoe = shoeKeywords.some(kw => lowerName.includes(kw)) || trained.includes(fileName) || (window.lastUploadedImage && (trained.includes(window.lastUploadedImage.name) || trained.includes(window.lastUploadedImage.base64)));

      if (!isShoe) {
        return {
          text: `Whoops! 🔍 My visual scanner analyzed "${fileName}" but couldn't confidently detect a shoe or sneaker.\n\nWould you like to train my AI model on this image pattern, or try uploading another photo?`,
          options: [
            "Train AI: This IS a shoe 🧠",
            "Upload another photo 📸"
          ]
        };
      }

      const matchedProducts = products && products.length >= 3 
        ? products.slice(0, 3).map(p => ({
            id: p.id,
            name: p.title,
            price: `₹${p.price.toLocaleString()}`,
            image: formatImageUrl(p.image),
            ar: true
          }))
        : [
            { id: 1, name: "Air Jordan 4 Retro", price: "₹12,499", image: "http://localhost:5000/uploads/jordan_4.png", ar: true },
            { id: 2, name: "Air Force 1 '07", price: "₹8,999", image: "http://localhost:5000/uploads/af1.png", ar: true },
            { id: 3, name: "Air Max 90 Premium", price: "₹11,999", image: "http://localhost:5000/uploads/air_max_90.png", ar: true }
          ];

      return {
        text: "Analyzing image... 🔍 I've successfully matched your footwear photo!\n\nHere are the closest styles from our boutique collection. Tap 'AR Try-on' to preview them:",
        products: matchedProducts
      };
    }

    // 5. CATEGORY ROUTER HANDLERS
    if (query.includes("men's footwear") || query.includes("mens footwear")) {
      const mens = products.filter(p => p.category?.toLowerCase() === 'men').slice(0, 3).map(p => ({
        id: p.id,
        name: p.title,
        price: `₹${p.price.toLocaleString()}`,
        image: formatImageUrl(p.image),
        ar: true
      }));
      return {
        text: "Here are the top-rated styles from our Men's Footwear Collection! Tap 'AR Try-on' to preview them:",
        products: mens
      };
    }

    if (query.includes("women's footwear") || query.includes("womens footwear")) {
      const womens = products.filter(p => p.category?.toLowerCase() === 'women').slice(0, 3).map(p => ({
        id: p.id,
        name: p.title,
        price: `₹${p.price.toLocaleString()}`,
        image: formatImageUrl(p.image),
        ar: true
      }));
      return {
        text: "Here are the most popular styles from our Women's Footwear Collection! Tap 'AR Try-on' to preview them:",
        products: womens
      };
    }

    if (query.includes("sports footwear")) {
      const sports = products.filter(p => p.category?.toLowerCase() === 'sports').slice(0, 3).map(p => ({
        id: p.id,
        name: p.title,
        price: `₹${p.price.toLocaleString()}`,
        image: formatImageUrl(p.image),
        ar: true
      }));
      return {
        text: "Here are the highest performing styles from our Sports Footwear Collection! Tap 'AR Try-on' to preview them:",
        products: sports
      };
    }

    // 6. PROJECT SNEAKER SEARCH ENGINE
    const isSearchQuery = query.includes('shoe') || query.includes('sneaker') || query.includes('boot') || 
                          query.includes('nike') || query.includes('adidas') || query.includes('puma') || 
                          query.includes('jordan') || query.includes('reebok') || query.includes('balance') ||
                          query.includes('sports') || query.includes('running') || query.includes('casual') ||
                          query.includes('men') || query.includes('women') || query.includes('cheap') || 
                          query.includes('price') || query.includes('expensive') || query.includes('buy') ||
                          query.includes('size') || query.includes('leather') || query.includes('suede') ||
                          query.includes('cushion') || query.includes('mesh') || query.includes('breathable') ||
                          query.includes('material') || query.includes('comfort') || query.includes('fit') ||
                          query.includes('red') || query.includes('black') || query.includes('white') ||
                          query.includes('blue') || query.includes('green') || query.includes('grey') ||
                          query.includes('under') || query.includes('below') || query.includes('budget') ||
                          query.includes('basketball') || query.includes('gym') || query.includes('workout') ||
                          query.includes('skate') || query.includes('high top') || query.includes('low top') ||
                          /\b\d+(\.5)?\b/.test(query);

    if (isSearchQuery) {
      let matched = [...products];

      // Brand Filters
      if (query.includes('nike')) matched = matched.filter(p => p.brand?.toLowerCase() === 'nike');
      else if (query.includes('adidas')) matched = matched.filter(p => p.brand?.toLowerCase() === 'adidas');
      else if (query.includes('puma')) matched = matched.filter(p => p.brand?.toLowerCase() === 'puma');
      else if (query.includes('jordan')) matched = matched.filter(p => p.brand?.toLowerCase() === 'jordan');
      else if (query.includes('reebok')) matched = matched.filter(p => p.brand?.toLowerCase() === 'reebok');
      else if (query.includes('balance') || query.includes('new balance')) matched = matched.filter(p => p.brand?.toLowerCase()?.includes('balance'));

      // Category Filters
      if (query.includes('men') && !query.includes('women')) matched = matched.filter(p => p.category?.toLowerCase() === 'men');
      else if (query.includes('women')) matched = matched.filter(p => p.category?.toLowerCase() === 'women');
      else if (query.includes('sports') || query.includes('running')) matched = matched.filter(p => p.category?.toLowerCase() === 'sports' || p.type?.toLowerCase() === 'running');

      // Feature, Material & Cushion Filters
      if (query.includes('leather')) {
        matched = matched.filter(p => 
          (p.title && p.title.toLowerCase().includes('leather')) || 
          (p.description && p.description.toLowerCase().includes('leather'))
        );
      }
      if (query.includes('suede')) {
        matched = matched.filter(p => 
          (p.title && p.title.toLowerCase().includes('suede')) || 
          (p.description && p.description.toLowerCase().includes('suede'))
        );
      }
      if (query.includes('mesh') || query.includes('breathable')) {
        matched = matched.filter(p => 
          (p.title && p.title.toLowerCase().includes('mesh')) || 
          (p.description && p.description.toLowerCase().includes('mesh')) ||
          (p.title && p.title.toLowerCase().includes('breathable')) || 
          (p.description && p.description.toLowerCase().includes('breathable'))
        );
      }
      if (query.includes('cushion') || query.includes('comfort')) {
        matched = matched.filter(p => 
          (p.title && p.title.toLowerCase().includes('cushion')) || 
          (p.description && p.description.toLowerCase().includes('cushion')) ||
          (p.title && p.title.toLowerCase().includes('comfort')) || 
          (p.description && p.description.toLowerCase().includes('comfort')) ||
          (p.title && p.title.toLowerCase().includes('boost')) || 
          (p.description && p.description.toLowerCase().includes('boost'))
        );
      }

      // Colorway Filters
      const colorsList = ['red', 'black', 'white', 'blue', 'green', 'grey', 'yellow', 'brown', 'pink'];
      colorsList.forEach(col => {
        if (query.includes(col)) {
          matched = matched.filter(p => 
            (p.title && p.title.toLowerCase().includes(col)) || 
            (p.description && p.description.toLowerCase().includes(col))
          );
        }
      });

      // Style & Activity Fit Filters
      if (query.includes('basketball')) {
        matched = matched.filter(p => 
          (p.title && p.title.toLowerCase().includes('jordan')) || 
          (p.title && p.title.toLowerCase().includes('court')) || 
          (p.title && p.title.toLowerCase().includes('retro')) ||
          (p.description && p.description.toLowerCase().includes('basketball'))
        );
      }
      if (query.includes('gym') || query.includes('workout')) {
        matched = matched.filter(p => 
          (p.category && p.category.toLowerCase() === 'sports') || 
          (p.title && p.title.toLowerCase().includes('ultraboot')) ||
          (p.description && p.description.toLowerCase().includes('gym')) ||
          (p.description && p.description.toLowerCase().includes('workout'))
        );
      }
      if (query.includes('skate')) {
        matched = matched.filter(p => 
          (p.title && p.title.toLowerCase().includes('dunk')) || 
          (p.title && p.title.toLowerCase().includes('blazer')) ||
          (p.description && p.description.toLowerCase().includes('skate'))
        );
      }

      // Height Profile Filters
      if (query.includes('high top') || query.includes('high-top')) {
        matched = matched.filter(p => 
          (p.title && p.title.toLowerCase().includes('high')) || 
          (p.title && p.title.toLowerCase().includes('retro')) ||
          (p.description && p.description.toLowerCase().includes('high'))
        );
      }
      if (query.includes('low top') || query.includes('low-top')) {
        matched = matched.filter(p => 
          (p.title && p.title.toLowerCase().includes('low')) || 
          (p.title && p.title.toLowerCase().includes("07")) ||
          (p.description && p.description.toLowerCase().includes('low'))
        );
      }

      // Dynamic Numeric Price Limit Parser (e.g., under 12000, below 15000)
      const priceLimitMatch = query.match(/(?:under|below|less\s+than)\s*(\d+)/i) || query.match(/(\d+)\s*(?:under|below|less\s+than)/i);
      if (priceLimitMatch) {
        const limitValue = parseInt(priceLimitMatch[1]);
        if (!isNaN(limitValue)) {
          matched = matched.filter(p => p.price <= limitValue);
        }
      }

      // Size Filters
      const sizeMatch = query.match(/\b(size\s*)?(\d+(\.5)?)\b/i);
      if (sizeMatch) {
        const parsedSize = sizeMatch[2];
        matched = matched.filter(p => {
          const sizesArr = p.sizes ? p.sizes.toString().split(',') : [];
          return sizesArr.includes(parsedSize) || sizesArr.some(s => s.trim() === parsedSize);
        });
      }

      // Price Filters
      if (query.includes('cheap') || query.includes('low') || query.includes('budget')) {
        matched.sort((a, b) => a.price - b.price);
      } else if (query.includes('expensive') || query.includes('premium') || query.includes('high')) {
        matched.sort((a, b) => b.price - a.price);
      }

      if (matched.length > 0) {
        const topMatches = matched.slice(0, 3).map(p => ({
          id: p.id,
          name: p.title,
          price: `₹${p.price.toLocaleString()}`,
          image: formatImageUrl(p.image),
          ar: true
        }));

        let replyText = "I've searched our live boutique inventory and found some perfect matches matching your criteria! 👟✨\n\nTake a look at these popular models. You can preview them instantly using AR Try-on:";
        if (sizeMatch) replyText = `I've matched our live database for size **US ${sizeMatch[2]}** and found these premium models currently in stock:`;
        else if (query.includes('nike')) replyText = "Checking Nike models... ⚡ I found these top Nike sneakers from our active catalog! Tap AR Try-on to preview:";
        else if (query.includes('adidas')) replyText = "Scanning Adidas collection... 🏃‍♂️ Here are the best Adidas styles available now in your size:";
        else if (query.includes('jordan')) replyText = "Searching Jordan drops... 🔥 Check out these high-top retro Jordan styles from our boutique:";
        else if (query.includes('puma')) replyText = "Filtering Puma styles... ⚡ Here are the sleekest low-profile Puma sneakers available:";
        else if (query.includes('reebok')) replyText = "Checking Reebok legacy collection... 👟 These classic Reebok styles are in stock right now:";
        else if (query.includes('cheap') || query.includes('low')) replyText = "Finding best budget picks... 🎟️ Here are our most affordable premium sneakers, selected just for you:";
        else if (query.includes('expensive') || query.includes('premium')) replyText = "Displaying premium flagship drops... ✨ Here are our most exclusive high-end styles in stock:";

        return {
          text: replyText,
          products: topMatches
        };
      } else {
        return {
          text: "I couldn't find any direct matches in our live database for that specific search, but we have 80+ other premium styles available! Would you like to check out some popular shoe collections?",
          options: ["Men's Footwear 👨", "Women's Footwear 👩", "Sports Footwear ⚡", "Trending Shoes 🔥"]
        };
      }
    }

    // GREETINGS & DEFAULTS
    if (query.includes('hello') || query.includes('hi')) {
      return { text: "Hello! Welcome to Laces & Soles. How can I help you find your perfect pair today?", suggestSizeGuide: true };
    }

    return { text: "That's a great question! I'm your dedicated sneaker concierge. Try asking me for 'Nike', 'Jordan', or check out 'Men's Footwear 👨' to see our live boutique collection! 👟" };
  };

  const handleSend = async (e, text = null) => {
    if (e) e.preventDefault();
    const userMessage = text || input;
    if (!userMessage.trim()) return;

    setHasUserMessaged(true);

    // Handle interactive self-training actions
    if (userMessage === "Train AI: This IS a shoe 🧠") {
      setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
      if (!text) setInput('');
      setIsTyping(true);

      // Save filename and base64 to trained_shoes list in localStorage
      const trained = JSON.parse(localStorage.getItem('trained_shoes') || '[]');
      if (window.lastUploadedImage) {
        if (!trained.includes(window.lastUploadedImage.name)) trained.push(window.lastUploadedImage.name);
        if (!trained.includes(window.lastUploadedImage.base64)) trained.push(window.lastUploadedImage.base64);
        localStorage.setItem('trained_shoes', JSON.stringify(trained));
      }

      setTimeout(() => {
        setIsTyping(false);
        
        const matchedProducts = products && products.length >= 3 
          ? products.slice(0, 3).map(p => ({
              id: p.id,
              name: p.title,
              price: `₹${p.price.toLocaleString()}`,
              image: formatImageUrl(p.image),
              ar: true
            }))
          : [
              { id: 1, name: "Air Jordan 4 Retro", price: "₹12,499", image: "http://localhost:5000/uploads/jordan_4.png", ar: true },
              { id: 2, name: "Air Force 1 '07", price: "₹8,999", image: "http://localhost:5000/uploads/af1.png", ar: true },
              { id: 3, name: "Air Max 90 Premium", price: "₹11,999", image: "http://localhost:5000/uploads/air_max_90.png", ar: true }
            ];

        setMessages(prev => [...prev, {
          sender: 'bot',
          text: "🧠 Retraining complete! I've updated my neural scanner weights and successfully recognized this image as valid footwear.\n\nHere are the matched products from our live collection:",
          products: matchedProducts,
          ar: true
        }]);
      }, 1500);
      return;
    }

    if (userMessage === "Upload another photo 📸") {
      setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
      if (!text) setInput('');
      
      // Trigger file dialog
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 300);
      return;
    }

    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    if (!text) setInput('');
    setIsTyping(true);

    setTimeout(async () => {
      const response = await getBotResponse(userMessage, isAgentHandoff);
      setIsTyping(false);
      
      if (response.escalate && stylistStatus === 'offline') {
        setIsAgentHandoff(true);
        setStylistStatus('connecting');
        
        // Show connecting message first
        setMessages(prev => [...prev, { 
          text: response.text, 
          sender: 'bot'
        }]);

        // Retraining/connecting stylist simulator after a short delay
        setTimeout(() => {
          setIsTyping(true);
          
          setTimeout(() => {
            setIsTyping(false);
            setStylistStatus('active');
            setMessages(prev => [...prev, {
              sender: 'bot',
              text: "🧑‍💼 **Stylist Sarah has joined the session!**\n\n\"Hi there! I'm Sarah, your senior style consultant here at Laces & Soles. Sizing consulting, custom outfits, shipping updates—you name it, I'm here to solve it! 👟✨\n\nHow can I help you elevate your collection today?\"",
              options: [
                "Sizing Consulting 📏",
                "Outfits/Styling Advice 👔",
                "Stylist Promo Code 🎟️",
                "Disconnect Chat ❌"
              ]
            }]);
          }, 1500);
        }, 2000);

      } else {
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
      }
    }, 1200);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] pointer-events-none font-inter">
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[calc(100vw-2rem)] md:w-[400px] max-h-[85vh] bg-white rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.3)] border border-gray-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-12 fade-in zoom-in-95 duration-500 origin-bottom-right pointer-events-auto">
          {/* Dynamic Header */}
          <div className={`${isAgentHandoff ? (stylistStatus === 'active' ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-rose-500' : 'bg-indigo-600') : 'bg-gray-900'} p-6 flex items-center justify-between text-white shrink-0 relative overflow-hidden transition-all duration-700`}>
            <div className="flex items-center gap-4 relative z-10">
              <div className="relative">
                <div className={`size-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${isAgentHandoff ? (stylistStatus === 'active' ? 'bg-white/20 backdrop-blur rotate-0' : 'bg-indigo-500 rotate-0') : 'bg-rose-500 rotate-6 hover:rotate-0'}`}>
                  {isAgentHandoff ? (stylistStatus === 'active' ? <span className="text-xl">👩‍💼</span> : <Icons.Headphones size={24} className="text-white" />) : <Icons.Zap size={24} className="text-white fill-white" />}
                </div>
                <div className="absolute -bottom-1 -right-1 size-4 bg-green-500 rounded-full border-4 border-gray-900 animate-pulse"></div>
              </div>
              <div>
                <h4 className={`text-[10px] font-black uppercase tracking-[0.4em] mb-0.5 ${isAgentHandoff ? 'text-white/80' : 'text-rose-500'}`}>
                  {isAgentHandoff ? (stylistStatus === 'active' ? 'Active Online' : 'Connecting...') : 'Premium AI'}
                </h4>
                <h3 className="text-base font-black uppercase tracking-widest leading-none">
                  {isAgentHandoff ? (stylistStatus === 'active' ? 'Sarah (Stylist)' : 'Live Stylist') : 'Style Concierge'}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1.5 relative z-10">
              <button 
                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} 
                className={`size-9 flex items-center justify-center rounded-xl transition-all duration-300 ${
                  isVoiceEnabled 
                    ? 'bg-rose-500/20 text-rose-300 ring-2 ring-rose-500/30' 
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
                title={isVoiceEnabled ? 'Disable Voice Autoplay' : 'Enable Voice Autoplay'}
              >
                {isVoiceEnabled ? <Icons.Volume2 size={18} /> : <Icons.VolumeX size={18} />}
              </button>
              <button onClick={() => { setMessages([{ text: "Chat history cleared. How can I help?", sender: 'bot' }]); setIsAgentHandoff(false); setStylistStatus('offline'); if ('speechSynthesis' in window) window.speechSynthesis.cancel(); setIsPlayingVoice(null); }} className="size-9 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <Icons.Trash2 size={18} />
              </button>
              <button 
                onClick={() => { setIsOpen(false); if ('speechSynthesis' in window) window.speechSynthesis.cancel(); setIsPlayingVoice(null); }} 
                className="size-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
              >
                <Icons.X size={20} />
              </button>
            </div>
            <div className={`absolute top-0 right-0 size-32 rounded-full -mr-16 -mt-16 blur-3xl transition-colors duration-700 ${isAgentHandoff ? 'bg-rose-400/30' : 'bg-rose-500/10'}`}></div>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 p-6 bg-[#fcfdfe] overflow-y-auto flex flex-col gap-6 custom-scrollbar-light">
            {messages.map((msg, idx) => (
              <div key={idx} className="flex flex-col gap-4">
                <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2 group`}>
                  <div className={`max-w-[90%] p-4 rounded-3xl text-[12px] font-bold leading-relaxed shadow-sm whitespace-pre-wrap transition-all ${
                    msg.sender === 'user' 
                      ? 'bg-rose-500 text-white rounded-br-none' 
                      : msg.escalate 
                        ? 'bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-bl-none'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                  }`}>
                    {msg.image && (
                      <img src={msg.image} className="max-w-full max-h-48 object-cover rounded-2xl mb-2 border border-white/20" alt="Uploaded sneaker" />
                    )}
                    {msg.text}
                  </div>
                  {msg.sender === 'bot' && (
                    <button 
                      onClick={() => speakText(msg.text)} 
                      className={`size-7 rounded-lg flex items-center justify-center border transition-all ${
                        isPlayingVoice === msg.text 
                          ? 'bg-rose-500 text-white border-rose-500 animate-pulse pointer-events-auto opacity-100' 
                          : 'bg-white text-gray-400 hover:text-gray-900 hover:bg-gray-50 border-gray-100 opacity-0 group-hover:opacity-100 pointer-events-auto transition-opacity duration-300'
                      }`}
                      title={isPlayingVoice === msg.text ? "Mute" : "Speak text"}
                    >
                      {isPlayingVoice === msg.text ? (
                        <Icons.Volume2 size={14} className="animate-bounce" />
                      ) : (
                        <Icons.Volume size={14} />
                      )}
                    </button>
                  )}
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
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-rose-500 transition-colors tooltip-trigger group pointer-events-auto"
                >
                  <Icons.Camera size={20} />
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                    Visual Search
                  </span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
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
      <div className="flex flex-col items-end gap-3 pointer-events-none group">
        {!isOpen && (
          <div className="bg-white px-4 py-2 rounded-2xl shadow-xl border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-900 mb-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300 pointer-events-none">
            Style Concierge Online
          </div>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`pointer-events-auto size-16 rounded-[1.75rem] flex items-center justify-center shadow-[0_20px_50px_rgba(244,63,94,0.4)] transition-all duration-700 transform hover:scale-110 active:scale-90 ${
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
