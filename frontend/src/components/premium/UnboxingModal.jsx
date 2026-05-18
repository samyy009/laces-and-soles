import { useState } from 'react';
import * as Icons from 'lucide-react';

export default function UnboxingModal({ isOpen, onClose, product }) {
  const [unboxStep, setUnboxStep] = useState(0); // 0: Ribbon, 1: Lid, 2: Tissue, 3: Shoe Revealed!

  if (!isOpen) return null;

  const defaultProduct = {
    name: "Classic Retro AJ1",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=300",
    brand: "Nike Jordan"
  };

  const activeProduct = product || defaultProduct;

  const handleNextStep = () => {
    if (unboxStep < 3) {
      setUnboxStep(prev => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fadeIn">
      
      {/* Sparkle Confetti Layer */}
      {unboxStep === 3 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(16)].map((_, i) => (
            <div 
              key={i} 
              className="absolute size-2 bg-gradient-to-r from-rose-400 to-amber-300 rounded-full animate-ping opacity-60"
              style={{
                top: `${Math.random() * 80 + 10}%`,
                left: `${Math.random() * 80 + 10}%`,
                animationDuration: `${Math.random() * 3 + 1.5}s`,
                animationDelay: `${Math.random() * 1.5}s`
              }}
            ></div>
          ))}
        </div>
      )}

      <div className="relative w-full max-w-lg bg-[#090b0e] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl p-8 flex flex-col min-h-[550px] justify-between text-center">
        
        {/* Header */}
        <div className="flex flex-col items-center">
          <span className="bg-rose-500/20 text-rose-400 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-rose-500/30">
            {unboxStep < 3 ? 'Bespoke Package Arrived' : 'Package Unboxed!'}
          </span>
          <h2 className="text-white text-xl md:text-2xl font-black uppercase tracking-widest mt-2 leading-tight">
            {unboxStep < 3 ? 'Unlock Your Sole Box' : 'Welcome to the Soles Family'}
          </h2>
          <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mt-1">
            {unboxStep === 0 && 'Tap to untie premium leather ribbon'}
            {unboxStep === 1 && 'Slide off custom cardboard lid'}
            {unboxStep === 2 && 'Tear apart floating silk packaging paper'}
            {unboxStep === 3 && 'Enjoy your bespoke luxury footwear'}
          </p>
        </div>

        {/* 3D-Feel Box Interactive Animation Area */}
        <div className="flex-1 flex items-center justify-center relative min-h-[250px] my-6">
          
          {/* Glowing Back Aura */}
          <div className="absolute size-48 rounded-full bg-rose-500/10 blur-3xl opacity-60 transition-all duration-700 scale-125"></div>

          {/* STEP 0: CARD BOX WITH RIBBON */}
          {unboxStep === 0 && (
            <div 
              onClick={handleNextStep}
              className="relative w-56 h-36 bg-gradient-to-br from-[#1c1d22] to-[#121316] rounded-3xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8)] cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center group"
            >
              {/* Vertical Ribbon */}
              <div className="absolute inset-y-0 w-8 bg-rose-500/90 border-x border-rose-400 shadow-md group-hover:scale-y-105 transition-transform"></div>
              {/* Horizontal Ribbon */}
              <div className="absolute inset-x-0 h-8 bg-rose-500/90 border-y border-rose-400 shadow-md group-hover:scale-x-105 transition-transform"></div>
              {/* Bow Seal */}
              <div className="absolute size-12 rounded-full bg-amber-400 border border-white flex items-center justify-center text-gray-900 font-black shadow-lg">
                <Icons.Sparkles size={18} className="animate-spin" style={{ animationDuration: '4s' }} />
              </div>
            </div>
          )}

          {/* STEP 1: CARD BOX SEAL BROKEN */}
          {unboxStep === 1 && (
            <div 
              onClick={handleNextStep}
              className="relative w-56 h-36 bg-gradient-to-br from-[#1c1d22] to-[#121316] rounded-3xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8)] cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 flex flex-col items-center justify-center"
            >
              {/* Open Box Lid Preview (Hover Effect) */}
              <div className="absolute bottom-full mb-1 w-56 h-10 bg-[#25272e] rounded-t-2xl border border-white/10 opacity-30 transform hover:-translate-y-2 transition-transform duration-300"></div>
              <span className="text-white text-[10px] font-black uppercase tracking-widest border border-white/10 px-4 py-2 rounded-2xl bg-white/5 animate-pulse">
                Slide Off Lid
              </span>
            </div>
          )}

          {/* STEP 2: SILK TISSUE PAPER */}
          {unboxStep === 2 && (
            <div 
              onClick={handleNextStep}
              className="relative w-56 h-36 bg-white/95 rounded-3xl shadow-[0_20px_50px_rgba(255,255,255,0.08)] cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 flex flex-col items-center justify-center p-6 border border-gray-100"
            >
              {/* Wrinkle lines */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-300 via-gray-900 to-black"></div>
              <span className="text-gray-800 text-[10px] font-black uppercase tracking-widest border border-gray-200 px-4 py-2 rounded-2xl bg-gray-50/50 animate-pulse relative z-10">
                Tear Tissue Paper
              </span>
            </div>
          )}

          {/* STEP 3: REVEAL SNEAKER */}
          {unboxStep === 3 && (
            <div className="relative flex flex-col items-center justify-center animate-fadeIn">
              
              {/* Magical Halo */}
              <div className="absolute size-44 rounded-full bg-rose-500/20 blur-2xl animate-pulse"></div>

              {/* Glowing Shoes floating */}
              <img 
                src={activeProduct.image} 
                className="w-64 h-36 object-contain drop-shadow-[0_20px_35px_rgba(225,29,72,0.5)] transform rotate-[-12deg] hover:rotate-0 transition-transform duration-500 animate-bounce relative z-10" 
                style={{ animationDuration: '3s' }}
                alt="Revealed Sneaker" 
              />

              {/* Floating specs badge */}
              <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-2 relative z-10 shadow-lg">
                <Icons.CheckCircle2 size={14} className="text-emerald-400" />
                <span className="text-white text-[9px] font-black uppercase tracking-widest">
                  Genuine Quality Inspected
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Actions Panel */}
        <div className="flex flex-col gap-4">
          {unboxStep < 3 ? (
            <button 
              onClick={handleNextStep}
              className="w-full bg-white hover:bg-rose-500 hover:text-white text-gray-900 text-[10px] font-black uppercase tracking-widest py-4.5 rounded-2xl transition-all shadow-xl active:scale-95"
            >
              Continue Unboxing <Icons.ArrowRight size={12} className="inline ml-1" />
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-1">
                <h4 className="text-rose-400 text-[9px] font-black uppercase tracking-widest">{activeProduct.brand || 'Bespoke Brand'}</h4>
                <h3 className="text-white text-sm font-black uppercase tracking-wider">{activeProduct.name}</h3>
              </div>
              <button 
                onClick={onClose}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest py-4.5 rounded-2xl transition-all shadow-xl shadow-rose-500/20 active:scale-95"
              >
                Close Box & Explore Dashboard
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
