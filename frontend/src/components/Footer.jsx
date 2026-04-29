import { useState } from 'react';
import { Link } from 'react-router-dom';
import content from '../content.json';
import * as Icons from 'lucide-react';
import { FaFacebook, FaGoogle, FaWhatsapp, FaGithub } from 'react-icons/fa';

const socialIcons = {
  facebook: FaFacebook,
  google: FaGoogle,
  whatsapp: FaWhatsapp,
  github: FaGithub,
};

const socialColors = {
  facebook: { bg: '#1877F2', fg: '#fff' },
  google:   { bg: '#DB4437', fg: '#fff' },
  whatsapp: { bg: '#25D366', fg: '#fff' },
  github:   { bg: '#24292e', fg: '#fff' },
};

import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import { toast } from 'react-toastify';

export default function Footer() {
  const { footer } = content;
  const { user, loginWithFacebook } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-gray-950 text-white relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-[120px] -translate-y-1/2" />
      
      {/* ─── Top Section ─── */}
      <div className="mx-auto max-w-7xl px-4 py-14 relative z-10">
        <div className="grid gap-10 lg:grid-cols-4 md:grid-cols-2">

          {/* Brand Column */}
          <div className="lg:col-span-1 space-y-5 animate-fade-in-up">
            <Link to="/" className="inline-block text-2xl font-black uppercase tracking-tighter font-heading group">
              <span className="text-rose-500 transition-colors group-hover:text-white">L</span>
              aces&{' '}
              <span className="text-rose-500 transition-colors group-hover:text-white">S</span>
              oles
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs font-medium italic">
              {footer.brand.tagline}
            </p>

            <div className="flex gap-4 pt-2">
              {footer.socials.map((social) => {
                const Icon = socialIcons[social.icon] || Icons.Globe;
                const colors = socialColors[social.icon] || { bg: '#111', fg: '#fff' };
                const commonStyle = { backgroundColor: colors.bg, color: colors.fg };
                const commonClasses = `size-12 rounded-2xl flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:opacity-90 shadow-xl`;
                return (
                  <a
                    key={social.icon}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={commonClasses}
                    style={commonStyle}
                    aria-label={social.icon}
                  >
                    <Icon size={20} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-200 font-heading">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {footer.quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-sm text-gray-400  hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <Icons.ChevronRight size={12} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Hours */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-200 font-heading">
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Icons.MapPin size={16} className="text-rose-500 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-400  leading-relaxed">{footer.contact.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Icons.Phone size={16} className="text-rose-500 shrink-0" />
                <a href={`tel:${footer.contact.phone}`} className="text-sm text-gray-400  hover:text-white transition-colors">
                  {footer.contact.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Icons.Mail size={16} className="text-rose-500 shrink-0" />
                <a href={`mailto:${footer.contact.email}`} className="text-sm text-gray-400  hover:text-white transition-colors">
                  {footer.contact.email}
                </a>
              </li>
            </ul>

            <div className="pt-4">
              <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500  mb-3 font-heading">Store Hours</h5>
              <ul className="space-y-3">
                {footer.openingTime.map((item) => (
                  <li key={item.day} className="flex items-center justify-between text-xs group/hour">
                    <span className="text-gray-400  group-hover/hour:text-white transition-colors">{item.day}</span>
                    <span className={`font-black tracking-widest ${item.time === 'Closed' ? 'text-rose-900' : 'text-rose-500'}`}>
                      {item.time}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-200 font-heading">
              Newsletter
            </h4>
            <p className="text-sm text-gray-400  leading-relaxed">
              {footer.newsletter.text}
            </p>
            {subscribed ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-sm text-emerald-400 font-black flex items-center gap-3 animate-in fade-in zoom-in-95 duration-500 shadow-2xl shadow-emerald-500/10">
                <Icons.CheckCircle size={20} /> Subscribed Successfully
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div className="group relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    required
                    className="w-full bg-gray-900 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-medium"
                  />
                  <Icons.Mail size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-rose-500 transition-colors" />
                </div>
                <button
                  type="submit"
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all hover:-translate-y-1 shadow-2xl shadow-rose-500/20 active:scale-95"
                >
                  {footer.newsletter.buttonText}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ─── Divider ─── */}
      <div className="border-t border-white/5" />

      {/* ─── Bottom Bar ─── */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-700 ">
            {footer.copyright.textMain}
            <span className="text-rose-500 mx-1">{footer.copyright.textHighlight}</span>
            {footer.copyright.textEnd}
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-xs text-gray-600 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-xs text-gray-600 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link to="/contact" className="text-xs text-gray-600 hover:text-white transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
