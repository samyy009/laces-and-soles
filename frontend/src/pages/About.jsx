import * as Icons from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ── */}
      <section className="relative w-full h-36 bg-gray-50 mt-0 flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/about_hero.png"
            alt="About Background"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        <div className="relative z-10 p-4 md:p-6 max-w-2xl bg-white/90 backdrop-blur-sm m-6 md:ml-12 rounded-3xl border border-gray-100 shadow-lg">
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ff3366] mb-3">ABOUT US</h3>
           <h1 className="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter leading-tight mb-2">
               Our <span className="text-[#ff3366]">Story</span>
           </h1>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="py-12 max-w-[1400px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-gray-900 mb-6">
              Who We <span className="text-[#ff3366]">Are</span>
            </h2>
            <p className="text-gray-500 text-base leading-relaxed mb-4 font-medium">
              Laces & Soles is a premium footwear destination built for those who live and breathe sneaker culture. We bring the world's best footwear to your doorstep with zero compromise on authenticity or style.
            </p>
            <p className="text-gray-500 text-base leading-relaxed mb-8 font-medium">
              Founded in 2024, our mission is to empower you to express your style through curated masterpieces, delivered seamlessly and reliably. 
            </p>
            <Link to="/store">
                <button className="bg-gray-900 text-white px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#ff3366] transition-all flex items-center gap-3 shadow-xl hover:-translate-y-1">
                  Shop Now <Icons.ArrowRight size={16} />
                </button>
            </Link>
          </div>
          <div className="relative group overflow-hidden rounded-[40px] shadow-2xl border border-gray-100">
            <div className="absolute inset-0 bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10" />
            <img 
              src="https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=2070&auto=format&fit=crop" 
              alt="About Boutique" 
              className="w-full object-cover aspect-square group-hover:scale-110 transition-transform duration-1000" 
            />
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="py-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-gray-900">
              Our <span className="text-[#ff3366]">Core Values</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Icons.ShieldCheck, title: 'Authenticity', desc: 'Every product is 100% authentic and sourced from verified suppliers worldwide.' },
              { icon: Icons.Truck,       title: 'Fast Delivery', desc: 'Express nationwide delivery within 3–7 business days, tracked and guaranteed.' },
              { icon: Icons.Heart,       title: 'Passion',       desc: 'Built by sneaker enthusiasts who care deeply about quality and culture.' },
            ].map((v, i) => (
              <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 text-center flex flex-col items-center">
                <div className="size-16 rounded-full bg-rose-50 flex items-center justify-center text-[#ff3366] mb-8 shadow-inner">
                  <v.icon size={32} />
                </div>
                <h4 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-4">{v.title}</h4>
                <p className="text-sm font-bold text-gray-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
