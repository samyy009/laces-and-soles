import { useState } from 'react';
import * as Icons from 'lucide-react';

export default function SneakerMatchmaker({ isOpen, onClose, products, onAddToCart, onAR }) {
  const [step, setStep] = useState(1); // 1-4, 5 is Loading, 6 is Result
  const [answers, setAnswers] = useState({
    vibe: '',
    palette: '',
    size: '',
    activity: ''
  });
  const [couponCopied, setCouponCopied] = useState(false);

  const stepDetails = {
    1: { title: "What's your styling signature vibe?", subtitle: "Choose your primary daily fashion identity" },
    2: { title: "Which color tone sets your mood?", subtitle: "Select your preferred spectrum" },
    3: { title: "What is your standard sneaker size?", subtitle: "For perfect comfort calibration" },
    4: { title: "Where are you rocking them most?", subtitle: "Select your primary environment" }
  };

  const vibes = [
    { id: 'streetwear', title: 'Streetwear Icon', desc: 'Bold, statement-making retro silhouettes', icon: 'Sparkles' },
    { id: 'athlete', title: 'Performance Athlete', desc: 'Responsive cushioning and speed designs', icon: 'Flame' },
    { id: 'classic', title: 'Minimalist Classic', desc: 'Timeless clean leathers and low profiles', icon: 'Shield' },
    { id: 'skate', title: 'Skateboard Rebel', desc: 'Heavy canvas, thick vulcanized flat soles', icon: 'Compass' }
  ];

  const palettes = [
    { id: 'neon', title: 'Cyberpunk Neons', color: 'bg-gradient-to-r from-pink-500 to-cyan-500' },
    { id: 'earthy', title: 'Earthy Neutrals', color: 'bg-gradient-to-r from-yellow-700 to-amber-950' },
    { id: 'monochrome', title: 'Obsidian & Chalk', color: 'bg-gradient-to-r from-gray-900 via-gray-700 to-gray-200' },
    { id: 'warm', title: 'Pastel Sorbet', color: 'bg-gradient-to-r from-rose-300 via-amber-200 to-indigo-300' }
  ];

  const sizes = ['6', '7', '8', '9', '10', '11'];

  const activities = [
    { id: 'gym', title: 'Tearing Up the Gym', desc: 'Heavy squatting and high-intensity workouts' },
    { id: 'streets', title: 'Cruising City Streets', desc: 'High daily step counts and everyday urban strolls' },
    { id: 'club', title: 'Late Night Clubbing', desc: 'Flashy colorways that pop under night strobe lights' },
    { id: 'court', title: 'Basketball Court', desc: 'Explosive ankle lock down support and court grip' }
  ];

  const handleNextStep = (field, value) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
    if (step < 4) {
      setStep(prev => prev + 1);
    } else {
      setStep(5); // Loading
      setTimeout(() => {
        setStep(6); // Result
      }, 2500);
    }
  };

  // Find a matching product from the catalog based on selections
  const getMatchResult = () => {
    if (!products || products.length === 0) {
      return {
        name: "Classic Retro AJ1",
        price: "₹12,499",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=300",
        description: "A perfect retro sneaker matching your styling identity and everyday hustle."
      };
    }

    // Attempt to match keywords
    let filtered = [...products];
    if (answers.vibe === 'athlete') {
      filtered = products.filter(p => p.category?.toLowerCase() === 'sports' || p.title?.toLowerCase()?.includes('boost'));
    } else if (answers.vibe === 'classic') {
      filtered = products.filter(p => p.brand?.toLowerCase() === 'nike' && !p.title?.toLowerCase()?.includes('jordan'));
    } else if (answers.vibe === 'skate') {
      filtered = products.filter(p => p.title?.toLowerCase()?.includes('dunk') || p.title?.toLowerCase()?.includes('blazer'));
    }

    if (filtered.length === 0) filtered = [products[0]];
    return filtered[0];
  };

  const copyCoupon = () => {
    navigator.clipboard.writeText('MATCHMAKER15');
    setCouponCopied(true);
    setTimeout(() => setCouponCopied(false), 2000);
  };

  const matchedShoe = getMatchResult();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#090b0e] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl p-8 flex flex-col min-h-[500px] justify-between">
        
        {/* Close Button */}
        <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
          {step > 1 && step <= 4 && (
            <button 
              onClick={() => setStep(prev => prev - 1)}
              className="h-10 px-4 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center gap-1.5 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest border border-white/5"
              title="Go back to previous question"
            >
              <Icons.ArrowLeft size={12} /> Back
            </button>
          )}
          <button 
            onClick={onClose} 
            className="size-10 rounded-full bg-white/5 hover:bg-rose-500 text-white flex items-center justify-center transition-all active:scale-95"
            title="Close quiz"
          >
            <Icons.X size={18} />
          </button>
        </div>

        {/* Step Indicators */}
        {step <= 4 && (
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4].map(s => (
              <div 
                key={s} 
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-rose-500' : 'bg-white/10'
                }`}
              ></div>
            ))}
          </div>
        )}

        {/* Dynamic Screens */}

        {/* STEPS 1-4 */}
        {step <= 4 && (
          <div className="flex-1 flex flex-col justify-center my-auto">
            <span className="text-rose-400 text-[9px] font-black uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 self-start mb-2">
              Style Fit Analysis
            </span>
            <h2 className="text-white text-xl md:text-2xl font-black uppercase tracking-wider leading-tight">
              {stepDetails[step].title}
            </h2>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1 mb-8">
              {stepDetails[step].subtitle}
            </p>

            {/* Step 1: Vibe Grid */}
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {vibes.map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleNextStep('vibe', v.id)}
                    className="p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-rose-500 hover:bg-rose-500/5 text-left transition-all active:scale-98 flex flex-col gap-2"
                  >
                    <h3 className="text-white text-xs font-black uppercase tracking-wider">{v.title}</h3>
                    <p className="text-gray-400 text-[10px] font-medium leading-relaxed">{v.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Palettes Grid */}
            {step === 2 && (
              <div className="grid grid-cols-2 gap-4">
                {palettes.map(pal => (
                  <button
                    key={pal.id}
                    onClick={() => handleNextStep('palette', pal.id)}
                    className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-rose-500 hover:bg-rose-500/5 text-center transition-all active:scale-98 flex flex-col items-center gap-3"
                  >
                    <div className={`w-full h-8 rounded-xl ${pal.color} border border-white/10 shadow-lg`}></div>
                    <h3 className="text-white text-xs font-black uppercase tracking-wider">{pal.title}</h3>
                  </button>
                ))}
              </div>
            )}

            {/* Step 3: Sizes Grid */}
            {step === 3 && (
              <div className="grid grid-cols-3 gap-3">
                {sizes.map(sz => (
                  <button
                    key={sz}
                    onClick={() => handleNextStep('size', sz)}
                    className="py-6 rounded-3xl bg-white/5 border border-white/5 hover:border-rose-500 hover:bg-rose-500/5 text-center text-white text-sm font-black uppercase tracking-widest transition-all active:scale-95"
                  >
                    UK {sz}
                  </button>
                ))}
              </div>
            )}

            {/* Step 4: Activities Grid */}
            {step === 4 && (
              <div className="flex flex-col gap-3">
                {activities.map(act => (
                  <button
                    key={act.id}
                    onClick={() => handleNextStep('activity', act.id)}
                    className="p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-rose-500 hover:bg-rose-500/5 text-left transition-all active:scale-98 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="text-white text-xs font-black uppercase tracking-wider">{act.title}</h3>
                      <p className="text-gray-400 text-[10px] mt-0.5 leading-relaxed">{act.desc}</p>
                    </div>
                    <Icons.ChevronRight size={16} className="text-rose-400" />
                  </button>
                ))}
              </div>
            )}
            {/* Cancel / Exit option at the bottom of the quiz steps */}
            <div className="mt-6 flex justify-center">
              <button 
                onClick={onClose}
                className="text-white/30 hover:text-rose-500 text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
              >
                <Icons.X size={11} /> Cancel & Close Quiz
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: CALCULATING MATCH LOADER */}
        {step === 5 && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center animate-pulse">
            <div className="relative size-20 flex items-center justify-center mb-6">
              <span className="absolute inset-0 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin"></span>
              <Icons.Sparkles size={28} className="text-rose-500 animate-bounce" />
            </div>
            <span className="bg-rose-500/20 text-rose-400 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-rose-500/30">
              Analysing Footprint
            </span>
            <h3 className="text-white text-base font-black uppercase tracking-widest mt-3">Synthesizing Profile...</h3>
            <p className="text-gray-400 text-[10px] max-w-xs mt-2 leading-relaxed">
              Evaluating responsive weight cushion, alignment matrices, and aesthetic parameters for a custom match.
            </p>
          </div>
        )}

        {/* STEP 6: SNEAKER SOULMATE RESULT */}
        {step === 6 && (
          <div className="flex-1 flex flex-col justify-between h-full animate-fadeIn">
            
            <div className="text-center flex flex-col items-center">
              <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/30">
                100% Match Found!
              </span>
              <h2 className="text-white text-xl md:text-2xl font-black uppercase tracking-widest mt-2">
                Your Sneaker Soulmate
              </h2>
            </div>

            {/* Matched Product Card */}
            <div className="my-6 bg-white/[0.02] border border-white/5 rounded-3xl p-5 flex flex-col md:flex-row items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-rose-500/20 rounded-2xl blur-xl opacity-60"></div>
                <img src={matchedShoe?.image} className="w-32 h-20 object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] transform hover:rotate-3 transition-transform duration-300 relative" alt="Sneaker match" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <span className="text-rose-400 text-[9px] font-black uppercase tracking-widest">{matchedShoe?.brand || 'Laces & Soles'}</span>
                <h3 className="text-white text-sm font-black uppercase tracking-wider mt-0.5">{matchedShoe?.name}</h3>
                <p className="text-gray-400 text-[10px] mt-1 line-clamp-2 leading-relaxed">{matchedShoe?.description}</p>
                <div className="text-white text-xs font-black uppercase tracking-wider mt-2">{matchedShoe?.price}</div>
              </div>
            </div>

            {/* Reward Coupon box */}
            <div className="bg-white/5 border border-white/5 rounded-3xl p-4 flex items-center justify-between gap-4 mb-6">
              <div>
                <h4 className="text-white text-[10px] font-black uppercase tracking-widest">Bespoke Quiz Coupon</h4>
                <p className="text-rose-400 text-[9px] font-medium uppercase tracking-widest mt-0.5">Use at checkout for 15% off</p>
              </div>
              <button 
                onClick={copyCoupon}
                className="bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
              >
                {couponCopied ? 'Copied! ✅' : 'MATCHMAKER15 📋'}
              </button>
            </div>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => { setStep(1); setAnswers({ vibe: '', palette: '', size: '', activity: '' }); }}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[9px] font-black uppercase tracking-widest py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1"
                title="Retake the quiz with different options"
              >
                <Icons.RotateCcw size={11} /> Retake Quiz
              </button>
              <button
                onClick={() => { onAR?.(matchedShoe); onClose(); }}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[9px] font-black uppercase tracking-widest py-3.5 rounded-xl transition-all flex items-center justify-center gap-1"
              >
                AR Try-On 📸
              </button>
              <button
                onClick={() => { onAddToCart?.(matchedShoe); onClose(); }}
                className="flex-[1.5] bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest py-3.5 rounded-xl flex items-center justify-center gap-1 transition-all shadow-xl active:scale-95"
              >
                Add to Cart 🛒
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
