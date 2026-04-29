import * as Icons from 'lucide-react';
import LottieAnimation from '../components/premium/LottieAnimation';

export default function Contact() {
  return (
    <div className="min-h-screen bg-white pb-24">
      {/* ── Hero ── */}
      <section className="relative w-full h-[180px] bg-blue-50 mt-0 flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/store_hero.png"
            alt="Contact Background"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative z-10 p-4 md:p-8 max-w-2xl bg-white/90 backdrop-blur-sm m-6 md:ml-12 rounded-3xl border border-gray-100 shadow-lg">
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ff3366] mb-3">GET IN TOUCH</h3>
           <h1 className="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter leading-tight">
               Contact <span className="text-[#ff3366]">Us</span>
           </h1>
        </div>
      </section>

      {/* ── Contact Form + Info ── */}
      <section className="py-6 max-w-[1400px] mx-auto px-6">
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          
          {/* Form */}
          <div className="bg-white border border-gray-100 p-6 rounded-[24px] shadow-sm">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 mb-3">Send a Message</h2>
            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">First Name</label>
                  <input type="text" placeholder="John" className="w-full h-9 bg-gray-50 rounded-xl px-4 text-sm font-bold outline-none border border-gray-200 focus:border-[#ff3366] transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Last Name</label>
                  <input type="text" placeholder="Doe" className="w-full h-9 bg-gray-50 rounded-xl px-4 text-sm font-bold outline-none border border-gray-200 focus:border-[#ff3366] transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Email Address</label>
                <input type="email" placeholder="john@example.com" className="w-full h-9 bg-gray-50 rounded-xl px-4 text-sm font-bold outline-none border border-gray-200 focus:border-[#ff3366] transition-colors" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Subject</label>
                <select className="w-full h-9 bg-gray-50 rounded-xl px-4 text-sm font-bold outline-none border border-gray-200 focus:border-[#ff3366] transition-colors appearance-none">
                  <option>Order Inquiry</option>
                  <option>Authenticity Check</option>
                  <option>Returns & Refunds</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Message</label>
                <textarea rows="5" placeholder="How can we help you?" className="w-full bg-gray-50 rounded-xl p-6 text-sm font-bold outline-none border border-gray-200 focus:border-[#ff3366] transition-colors resize-none" />
              </div>
              <button className="w-full h-12 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#ff3366] transition-colors shadow-md flex items-center justify-center gap-3">
                Send Message <Icons.Send size={16} />
              </button>
            </form>
          </div>

          {/* Info Side */}
          <div className="space-y-6">
            {/* Lottie Customer Support Animation */}
            <div className="w-full h-48 rounded-[24px] overflow-hidden bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center border border-rose-100">
              <LottieAnimation
                src="/animations/support.json"
                className="w-48 h-48"
              />
            </div>
            {[
              { icon: Icons.MapPin,    title: 'Visit Us',      lines: ['opposite Kanchan Showroom, Jayprakash Nagar', 'Gokul Nagar, Manjunath Nagar, V2', 'Hubballi, Karnataka 580030'] },
              { icon: Icons.Phone,     title: 'Call Us',       lines: ['+91 6360094791'] },
              { icon: Icons.Mail,      title: 'Email Us',      lines: ['lacesandsoles2026@gmail.com'] },
              { icon: Icons.Clock,     title: 'Working Hours', lines: ['Mon – Sat: 10:00 AM – 9:30 PM', 'Sun: Closed'] },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100 rounded-[18px] hover:shadow-md transition-all group">
                <div className="size-12 rounded-xl bg-white flex items-center justify-center text-[#ff3366] flex-shrink-0 shadow-sm">
                  <item.icon size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-2">{item.title}</h4>
                  {item.lines.map((l, j) => <p key={j} className="text-sm font-bold text-gray-500">{l}</p>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
