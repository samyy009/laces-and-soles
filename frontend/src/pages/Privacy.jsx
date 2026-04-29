import React from 'react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white pb-24">
      {/* ── Hero ── */}
      <section className="relative w-full h-[180px] bg-blue-50 mt-0 flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/store_hero.png"
            alt="Privacy Background"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative z-10 p-4 md:p-8 max-w-2xl bg-white/90 backdrop-blur-sm m-6 md:ml-12 rounded-3xl border border-gray-100 shadow-lg">
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#ff3366] mb-3">LEGAL</h3>
           <h1 className="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter leading-tight">
               Privacy <span className="text-[#ff3366]">Policy</span>
           </h1>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="py-12 max-w-[1000px] mx-auto px-6">
        <div className="prose prose-gray max-w-none text-gray-600 space-y-6">
          <p className="text-sm font-bold">Effective Date: April 2026</p>
          
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter mt-8 mb-4">1. Information We Collect</h2>
          <p>
            When you visit Laces & Soles, we collect certain information about your device, your interaction with the Site, and information necessary to process your purchases. We may also collect additional information if you contact us for customer support.
          </p>

          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter mt-8 mb-4">2. How We Use Your Information</h2>
          <p>
            We use your personal information to provide our services to you, which includes: offering products for sale, processing payments, shipping and fulfillment of your order, and keeping you up to date on new products, services, and offers.
          </p>

          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter mt-8 mb-4">3. Sharing Personal Information</h2>
          <p>
            We share your Personal Information with service providers to help us provide our services and fulfill our contracts with you. For example, we use third-party payment processors and logistics partners to deliver your purchases.
          </p>

          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter mt-8 mb-4">4. Your Rights</h2>
          <p>
            Depending on where you live, you may have the right to access the Personal Information we hold about you, to port it to a new service, and to ask that your Personal Information be corrected, updated, or erased.
          </p>

          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter mt-8 mb-4">5. Contact Us</h2>
          <p>
            For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by email at <a href="mailto:lacesandsoles2026@gmail.com" className="text-[#ff3366] hover:underline">lacesandsoles2026@gmail.com</a>.
          </p>
        </div>
      </section>
    </div>
  );
}
