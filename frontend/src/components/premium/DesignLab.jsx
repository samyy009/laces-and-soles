import { useState } from 'react';
import * as Icons from 'lucide-react';

const PARTS = [
  { id: 'upper',  name: 'Upper Body',   icon: 'Sun' },
  { id: 'laces',  name: 'Laces',        icon: 'Spline' },
  { id: 'sole',   name: 'Outsole',      icon: 'Layers' },
  { id: 'lining', name: 'Sock Lining',  icon: 'Maximize' },
  { id: 'accent', name: 'Accents',      icon: 'Sparkles' },
];

const COLORS = [
  { name: 'Rose Red',       value: '#E11D48' },
  { name: 'Neon Pink',      value: '#F43F5E' },
  { name: 'Cyber Blue',     value: '#06B6D4' },
  { name: 'Emerald',        value: '#10B981' },
  { name: 'Electric Gold',  value: '#FBBF24' },
  { name: 'Off-White',      value: '#F3F4F6' },
  { name: 'Obsidian',       value: '#111827' },
  { name: 'Orange',         value: '#F97316' },
  { name: 'Royal Purple',   value: '#8B5CF6' },
  { name: 'Sky Blue',       value: '#38BDF8' },
  { name: 'Lime',           value: '#A3E635' },
  { name: 'Burgundy',       value: '#9F1239' },
];

const MATERIALS = [
  { id: 'leather', name: 'Smooth Nappa Leather',   priceBoost: 1200 },
  { id: 'suede',   name: 'Velvet Brushed Suede',   priceBoost: 1800 },
  { id: 'mesh',    name: 'Hyper-Breathable Mesh',   priceBoost: 800  },
  { id: 'rubber',  name: 'Vulcanized Gum Rubber',   priceBoost: 500  },
  { id: 'knit',    name: 'Engineered Flyknit',      priceBoost: 2200 },
];

const SIZES = ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11', 'UK 12'];

const BASE_PRICE = 8999;

const DEFAULT_SELECTIONS = {
  upper:  { color: '#E11D48', material: 'leather' },
  laces:  { color: '#FFFFFF', material: 'mesh'    },
  sole:   { color: '#111827', material: 'rubber'  },
  lining: { color: '#F43F5E', material: 'mesh'    },
  accent: { color: '#FBBF24', material: 'leather' },
};

export default function DesignLab({ isOpen, onClose, onAddToCart }) {
  const [activePart, setActivePart] = useState('upper');
  const [selections, setSelections] = useState(DEFAULT_SELECTIONS);
  const [selectedSize, setSelectedSize] = useState('UK 9');
  const [customColor, setCustomColor] = useState('');
  const [designName, setDesignName] = useState('My Bespoke');
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [activeTab, setActiveTab] = useState('color'); // 'color' | 'material' | 'size'
  const [copied, setCopied] = useState(false);

  const totalPrice = () => {
    let extra = 0;
    Object.values(selections).forEach(sel => {
      const mat = MATERIALS.find(m => m.id === sel.material);
      if (mat) extra += mat.priceBoost;
    });
    return BASE_PRICE + extra;
  };

  const handleColor = (hex) => setSelections(p => ({ ...p, [activePart]: { ...p[activePart], color: hex } }));
  const handleMaterial = (id) => setSelections(p => ({ ...p, [activePart]: { ...p[activePart], material: id } }));
  const handleReset = () => { setSelections(DEFAULT_SELECTIONS); setActivePart('upper'); setSelectedSize('UK 9'); };

  const handleSaveDesign = () => {
    const d = { name: designName, selections: { ...selections }, size: selectedSize, price: totalPrice(), id: Date.now() };
    setSavedDesigns(p => [d, ...p.slice(0, 2)]); // keep max 3
  };

  const handleLoadDesign = (d) => { setSelections(d.selections); setSelectedSize(d.size); };

  const handleShare = () => {
    const summary = `L&S Bespoke: ${designName} | Upper: ${selections.upper.color} (${selections.upper.material}) | Sole: ${selections.sole.color} | ₹${totalPrice().toLocaleString()}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToCart = () => {
    const customProduct = {
      id: `custom-${Date.now()}`,
      name: `L&S Bespoke — ${designName}`,
      price: `₹${totalPrice().toLocaleString('en-IN')}`,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=300',
      description: `Custom bespoke sneaker. Upper: ${selections.upper.material} (${selections.upper.color}). Size: ${selectedSize}.`,
      brand: 'Laces & Soles Bespoke',
      category: 'Bespoke',
    };
    onAddToCart?.(customProduct);
    onClose();
  };

  if (!isOpen) return null;

  const sel = selections[activePart];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-3 sm:p-4">
      <div className="relative w-full max-w-5xl bg-[#090b0e] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row" style={{ maxHeight: 'calc(100dvh - 24px)' }}>

        {/* ─── LEFT: SVG Sneaker Preview */}
        <div className="flex-1 relative bg-gradient-to-tr from-rose-950/20 via-black to-[#090b0e] flex flex-col items-center justify-center p-6 md:p-8 border-b md:border-b-0 md:border-r border-white/5 overflow-hidden">

          {/* Label */}
          <div className="absolute top-5 left-5 flex items-center gap-2 z-10">
            <span className="bg-rose-500/20 text-rose-400 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-rose-500/30">
              Studio Mode
            </span>
          </div>

          {/* Close on mobile */}
          <button onClick={onClose} className="absolute top-5 right-5 md:hidden size-9 rounded-full bg-white/5 hover:bg-rose-500 text-white flex items-center justify-center transition-all z-10">
            <Icons.X size={16} />
          </button>

          {/* Active part label */}
          <p className="absolute top-14 left-0 right-0 text-center text-[9px] font-black uppercase tracking-widest text-white/30 z-10">
            Click any part of the shoe to select it
          </p>

          {/* SVG Sneaker */}
          <div className="relative w-full max-w-xs sm:max-w-sm aspect-video flex items-center justify-center">
            <div className="absolute bottom-3 w-56 h-6 rounded-full blur-2xl transition-all duration-500 opacity-50" style={{ backgroundColor: selections.upper.color }} />

            <svg viewBox="0 0 600 350" className="w-full h-auto drop-shadow-[0_25px_35px_rgba(0,0,0,0.7)] transform hover:scale-105 transition-transform duration-500">
              <defs>
                <pattern id="mesh-tex" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 0 0 L 10 10 M 10 0 L 0 10" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                </pattern>
                <pattern id="suede-tex" width="8" height="8" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.5" fill="rgba(0,0,0,0.12)" />
                  <circle cx="6" cy="6" r="1.5" fill="rgba(255,255,255,0.08)" />
                </pattern>
                <pattern id="knit-tex" width="6" height="6" patternUnits="userSpaceOnUse">
                  <path d="M0 3 Q1.5 0 3 3 Q4.5 6 6 3" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
                </pattern>
                <filter id="active-glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Sole */}
              <path d="M 80,260 Q 150,290 320,290 T 520,240 L 510,270 Q 350,305 120,290 Z"
                fill={selections.sole.color}
                className={`transition-all duration-300 cursor-pointer ${activePart === 'sole' ? 'stroke-rose-400 stroke-[3]' : 'stroke-transparent stroke-2'}`}
                onClick={() => setActivePart('sole')} />
              <path d="M 120,280 Q 250,295 480,265" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none" pointerEvents="none" />

              {/* Sock lining */}
              <path d="M 140,110 Q 180,80 230,110 L 260,150 Q 210,160 140,110 Z"
                fill={selections.lining.color}
                className={`transition-all duration-300 cursor-pointer ${activePart === 'lining' ? 'stroke-rose-400 stroke-[3]' : 'stroke-transparent stroke-2'}`}
                onClick={() => setActivePart('lining')} />
              {selections.lining.material === 'mesh' && <path d="M 140,110 Q 180,80 230,110 L 260,150 Q 210,160 140,110 Z" fill="url(#mesh-tex)" pointerEvents="none" />}

              {/* Main upper */}
              <path d="M 80,250 Q 100,140 180,105 L 260,155 L 360,195 Q 430,220 500,225 L 510,245 Q 350,285 80,250 Z"
                fill={selections.upper.color}
                className={`transition-all duration-300 cursor-pointer ${activePart === 'upper' ? 'stroke-rose-400 stroke-[3]' : 'stroke-transparent stroke-2'}`}
                onClick={() => setActivePart('upper')} />
              {selections.upper.material === 'suede' && <path d="M 80,250 Q 100,140 180,105 L 260,155 L 360,195 Q 430,220 500,225 L 510,245 Q 350,285 80,250 Z" fill="url(#suede-tex)" pointerEvents="none" />}
              {selections.upper.material === 'mesh' && <path d="M 80,250 Q 100,140 180,105 L 260,155 L 360,195 Q 430,220 500,225 L 510,245 Q 350,285 80,250 Z" fill="url(#mesh-tex)" pointerEvents="none" />}
              {selections.upper.material === 'knit' && <path d="M 80,250 Q 100,140 180,105 L 260,155 L 360,195 Q 430,220 500,225 L 510,245 Q 350,285 80,250 Z" fill="url(#knit-tex)" pointerEvents="none" />}

              {/* Accents */}
              <path d="M 80,250 Q 95,160 145,145 L 140,255 Z"
                fill={selections.accent.color}
                className={`transition-all duration-300 cursor-pointer ${activePart === 'accent' ? 'stroke-rose-400 stroke-[3]' : 'stroke-transparent stroke-2'}`}
                onClick={() => setActivePart('accent')} />
              <path d="M 400,210 Q 450,200 500,225 L 480,240 Z"
                fill={selections.accent.color}
                className={`transition-all duration-300 cursor-pointer ${activePart === 'accent' ? 'stroke-rose-400 stroke-[3]' : 'stroke-transparent stroke-2'}`}
                onClick={() => setActivePart('accent')} />

              {/* Laces */}
              <path d="M 230,135 L 290,190 M 250,120 L 310,175 M 270,110 L 330,160"
                stroke={selections.laces.color}
                strokeWidth={activePart === 'laces' ? 8 : 6}
                strokeLinecap="round"
                fill="none"
                className="cursor-pointer transition-all duration-300"
                onClick={() => setActivePart('laces')} />

              {/* Part labels */}
              {activePart === 'upper' && <text x="250" y="200" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.4)" fontWeight="bold" pointerEvents="none">UPPER</text>}
              {activePart === 'sole' && <text x="300" y="280" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.4)" fontWeight="bold" pointerEvents="none">SOLE</text>}
            </svg>
          </div>

          {/* Color swatches summary */}
          <div className="w-full max-w-sm mt-4 bg-white/[0.025] border border-white/5 rounded-2xl p-3 flex items-center justify-between gap-2">
            <div className="flex gap-2 flex-wrap">
              {PARTS.map(p => (
                <button key={p.id} onClick={() => setActivePart(p.id)}
                  title={p.name}
                  className={`flex flex-col items-center gap-0.5 transition-all ${activePart === p.id ? 'scale-125' : 'hover:scale-110'}`}>
                  <div className="size-5 rounded-full border-2 shadow-sm transition-all" style={{ backgroundColor: selections[p.id].color, borderColor: activePart === p.id ? '#f43f5e' : 'rgba(255,255,255,0.15)' }} />
                  <span className="text-[5px] font-black uppercase text-white/30">{p.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
            <div className="text-right">
              <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Total</span>
              <p className="text-white text-sm font-black">₹{totalPrice().toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Saved designs */}
          {savedDesigns.length > 0 && (
            <div className="w-full max-w-sm mt-3">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-600 mb-2">Saved Designs</p>
              <div className="flex gap-2">
                {savedDesigns.map(d => (
                  <button key={d.id} onClick={() => handleLoadDesign(d)}
                    className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl px-2.5 py-1.5 transition-all active:scale-95">
                    <div className="size-3 rounded-full" style={{ backgroundColor: d.selections.upper.color }} />
                    <span className="text-[8px] text-white font-bold uppercase tracking-widest truncate max-w-[60px]">{d.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT: Controls */}
        <div className="w-full md:w-[380px] bg-white/[0.01] flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5 shrink-0">
            <div>
              <h3 className="text-white text-sm font-black uppercase tracking-widest">Design Lab</h3>
              <p className="text-white/30 text-[8px] font-black uppercase tracking-widest mt-0.5">Customize every stitch</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleReset} className="size-9 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all active:scale-90 border border-white/5" title="Reset design">
                <Icons.RotateCcw size={14} />
              </button>
              <button onClick={onClose} className="hidden md:flex size-9 rounded-full bg-white/5 hover:bg-rose-500 text-white items-center justify-center transition-all active:scale-90">
                <Icons.X size={16} />
              </button>
            </div>
          </div>

          {/* Part selector */}
          <div className="px-5 pt-4 shrink-0">
            <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-2">1. Select Component</p>
            <div className="grid grid-cols-5 gap-1.5">
              {PARTS.map(p => (
                <button key={p.id} onClick={() => setActivePart(p.id)}
                  className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 border transition-all ${activePart === p.id ? 'bg-rose-500/20 border-rose-500/60 text-white' : 'bg-white/4 border-white/5 text-white/50 hover:border-white/15 hover:text-white'}`}>
                  <div className="size-3 rounded-full border border-white/20" style={{ backgroundColor: selections[p.id].color }} />
                  <span className="text-[7px] font-black uppercase tracking-widest">{p.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab switcher */}
          <div className="px-5 pt-3 pb-0 shrink-0">
            <div className="flex bg-white/5 rounded-xl p-0.5 gap-0.5">
              {[{ id: 'color', label: 'Color', icon: Icons.Palette }, { id: 'material', label: 'Material', icon: Icons.Layers }, { id: 'size', label: 'Size & Save', icon: Icons.Ruler }].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-gray-900' : 'text-white/40 hover:text-white'}`}>
                  <tab.icon size={10} /> {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 pt-3 pb-4 flex flex-col gap-4" style={{ WebkitOverflowScrolling: 'touch' }}>

            {/* COLOR TAB */}
            {activeTab === 'color' && (
              <div className="flex flex-col gap-3">
                <p className="text-white/40 text-[8px] font-black uppercase tracking-widest">2. Pick Color for <span className="text-rose-400">{PARTS.find(p => p.id === activePart)?.name}</span></p>
                <div className="grid grid-cols-6 gap-2">
                  {COLORS.map(col => (
                    <button key={col.value} onClick={() => handleColor(col.value)}
                      className={`aspect-square rounded-full border-2 transition-all flex items-center justify-center relative ${sel?.color === col.value ? 'border-rose-500 scale-115 shadow-lg shadow-rose-500/25' : 'border-transparent hover:scale-110'}`}
                      style={{ backgroundColor: col.value }} title={col.name}>
                      {sel?.color === col.value && <Icons.Check size={10} className="text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]" />}
                    </button>
                  ))}
                </div>
                {/* Custom hex color */}
                <div>
                  <p className="text-white/30 text-[7px] font-black uppercase tracking-widest mb-1.5">Custom Hex Color</p>
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-xl border border-white/10 shrink-0" style={{ backgroundColor: customColor || sel?.color }} />
                    <input type="text" value={customColor} onChange={e => setCustomColor(e.target.value)}
                      placeholder="#HEX code..." maxLength={7}
                      className="flex-1 bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-[10px] font-bold text-white placeholder-gray-700 outline-none focus:border-rose-500/40 transition-colors" />
                    <button onClick={() => { if (/^#[0-9A-Fa-f]{6}$/.test(customColor)) handleColor(customColor); }}
                      className="bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-xl transition-all active:scale-95">
                      Apply
                    </button>
                  </div>
                  <input type="color" value={sel?.color || '#E11D48'}
                    onChange={e => handleColor(e.target.value)}
                    className="mt-2 w-full h-8 rounded-xl border-0 cursor-pointer bg-transparent" title="Color picker" />
                </div>
              </div>
            )}

            {/* MATERIAL TAB */}
            {activeTab === 'material' && (
              <div className="flex flex-col gap-2">
                <p className="text-white/40 text-[8px] font-black uppercase tracking-widest">2. Pick Material for <span className="text-rose-400">{PARTS.find(p => p.id === activePart)?.name}</span></p>
                {MATERIALS.map(m => (
                  <button key={m.id} onClick={() => handleMaterial(m.id)}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${sel?.material === m.id ? 'bg-white text-gray-900 border-white' : 'bg-white/5 border-white/5 text-white/80 hover:bg-white/10'}`}>
                    <div className="flex items-center gap-2.5">
                      {sel?.material === m.id && <Icons.Check size={13} className="text-rose-500 shrink-0" />}
                      <span className="text-[10px] font-black uppercase tracking-wider">{m.name}</span>
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-widest shrink-0 ${sel?.material === m.id ? 'text-rose-600' : 'text-rose-400'}`}>
                      +₹{m.priceBoost.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* SIZE & SAVE TAB */}
            {activeTab === 'size' && (
              <div className="flex flex-col gap-4">
                {/* Size grid */}
                <div>
                  <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-2">Select Shoe Size</p>
                  <div className="grid grid-cols-4 gap-2">
                    {SIZES.map(sz => (
                      <button key={sz} onClick={() => setSelectedSize(sz)}
                        className={`py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${selectedSize === sz ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white/5 border-white/5 text-white/60 hover:border-white/20 hover:text-white'}`}>
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Design name */}
                <div>
                  <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-2">Name Your Design</p>
                  <input type="text" value={designName} onChange={e => setDesignName(e.target.value)}
                    maxLength={30} placeholder="My Bespoke..."
                    className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-[11px] font-bold text-white placeholder-gray-700 outline-none focus:border-rose-500/40 transition-colors" />
                </div>

                {/* Save & Share */}
                <div className="flex gap-2">
                  <button onClick={handleSaveDesign}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[9px] font-black uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5">
                    <Icons.Bookmark size={11} /> Save Design
                  </button>
                  <button onClick={handleShare}
                    className={`flex-1 border text-[9px] font-black uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 ${copied ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 hover:bg-white/10 text-white border-white/10'}`}>
                    {copied ? <><Icons.Check size={11} /> Copied!</> : <><Icons.Share2 size={11} /> Share</>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ─── Footer */}
          <div className="px-5 pt-3 pb-5 border-t border-white/5 shrink-0 flex flex-col gap-3 bg-[#090b0e]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/30 text-[8px] font-black uppercase tracking-widest">Total Price</p>
                <p className="text-white text-lg font-black tracking-wider">₹{totalPrice().toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-400 text-[8px] font-black uppercase tracking-widest animate-pulse">Handcrafted Bespoke</p>
                <p className="text-white/30 text-[8px] font-black uppercase tracking-widest">Size: {selectedSize}</p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button onClick={onClose}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[9px] font-black uppercase tracking-widest py-3.5 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-1.5">
                <Icons.X size={11} /> Cancel
              </button>
              <button onClick={handleAddToCart}
                className="flex-[2] bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest py-3.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-xl shadow-rose-500/20 active:scale-95">
                Add to Cart <Icons.ArrowRight size={11} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
