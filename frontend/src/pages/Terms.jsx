import React from 'react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-white pb-24">
      {/* ── Hero ── */}
      <section className="relative w-full h-[180px] bg-blue-50 mt-0 flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/store_hero.png"
            alt="Terms Background"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative z-10 p-4 md:p-8 max-w-2xl bg-white/90 backdrop-blur-sm m-6 md:ml-12 rounded-3xl border border-gray-100 shadow-lg">
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ff3366] mb-3">LEGAL</h3>
           <h1 className="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter leading-tight">
               Terms of <span className="text-[#ff3366]">Service</span>
           </h1>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="py-12 max-w-[1000px] mx-auto px-6">
        <div className="prose prose-gray max-w-none text-gray-600 space-y-6">
          <p className="text-sm font-bold">Effective Date: April 2026</p>
          
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Laces & Soles, you accept and agree to be bound by the terms and provision of this agreement. Any participation in this service will constitute acceptance of this agreement.
          </p>

          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter mt-8 mb-4">2. Products and Pricing</h2>
          <p>
            All products listed on the website are subject to change, as is Product information, pricing, and availability. Laces & Soles reserves the right, at any time, to modify, suspend, or discontinue the sale of any Product with or without notice.
          </p>

          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter mt-8 mb-4">3. Payments and Billing</h2>
          <p>
            You represent and warrant that you have the right to use any credit card or other means of payment that you provide to us. All billing information you provide to us must be truthful and accurate.
          </p>

          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter mt-8 mb-4">4. Returns and Refunds</h2>
          <p>
            Please review our Return Policy posted on the Site prior to making any purchases. We reserve the right to refuse or cancel your order if fraud or an unauthorized or illegal transaction is suspected.
          </p>

          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter mt-8 mb-4">5. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
          </p>

          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter mt-8 mb-4">Contact Information</h2>
          <p>
            Questions about the Terms of Service should be sent to us at <a href="mailto:lacesandsoles2026@gmail.com" className="text-[#ff3366] hover:underline">lacesandsoles2026@gmail.com</a>.
          </p>
        </div>
      </section>
    </div>
  );
}
