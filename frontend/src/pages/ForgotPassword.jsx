import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import axios from 'axios';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    console.log(`Attempting to request OTP for: ${email}`);
    try {
      const res = await axios.post(`${API}/api/forgot-password`, { email });
      console.log('OTP Request Response:', res.data);
      setSuccess(res.data.message);
      setStep(2);
    } catch (err) {
      console.error('OTP Request Error:', err);
      setError(err.response?.data?.error || 'Failed to request OTP');
    }
    setIsLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    console.log(`Attempting to verify OTP: ${otp} for: ${email}`);
    try {
      const res = await axios.post(`${API}/api/verify-otp`, { email, otp });
      console.log('OTP Verification Response:', res.data);
      setStep(3);
    } catch (err) {
      console.error('OTP Verification Error:', err);
      setError(err.response?.data?.error || 'Invalid OTP');
    }
    setIsLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    setIsLoading(true);
    console.log(`Attempting to reset password for: ${email}`);
    try {
      const res = await axios.post(`${API}/api/reset-password`, { email, otp, new_password: newPassword });
      console.log('Password Reset Response:', res.data);
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      console.error('Password Reset Error:', err);
      setError(err.response?.data?.error || 'Failed to reset password');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white  relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] mesh-gradient opacity-10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] mesh-gradient opacity-10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md space-y-6 bg-white  p-8 rounded-[32px] border border-gray-100 shadow-2xl shadow-gray-200/50 relative z-10 backdrop-blur-xl">
        <div className="text-center">
           <span className="text-[10px] font-black uppercase tracking-[0.8em] text-rose-500 mb-4 block">Account Recovery</span>
          <h1 className="text-3xl font-black text-gray-900  uppercase tracking-tighter font-heading leading-tight">
            {step === 1 && 'Recover Access'}
            {step === 2 && 'Identity Check'}
            {step === 3 && 'New Credentials'}
          </h1>
          <div className="mt-3 h-1 w-12 bg-rose-500 rounded-full mx-auto shadow-[0_0_20px_rgba(244,63,94,0.3)]" />
          <p className="mt-4 text-[9px] text-gray-400  font-black uppercase tracking-[0.2em] font-heading">
            {step === 1 && 'Enter member email to retrieve key'}
            {step === 2 && 'Enter the secure code from inbox'}
            {step === 3 && 'Establish new security key'}
          </p>
        </div>

        {error && (
          <div className="p-6 bg-rose-50 text-rose-500 text-xs font-black uppercase tracking-widest border border-rose-100 rounded-[24px] flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <Icons.AlertCircle size={20} strokeWidth={3} />
            {error}
          </div>
        )}

        {success && (
          <div className="p-6 bg-emerald-50 text-emerald-600 text-xs font-black uppercase tracking-widest border border-emerald-100 rounded-[24px] flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <Icons.CheckCircle size={20} strokeWidth={3} />
            {success}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400  font-heading ml-2">Member Email</label>
              <div className="group relative">
                <Icons.Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-rose-500 transition-colors" size={20} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50  border-none rounded-[32px] py-4 pl-16 pr-8 text-sm font-bold focus:ring-2 focus:ring-rose-500/10 focus:bg-white transition-all outline-none shadow-inner"
                  placeholder="john@example.com"
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gray-900 text-white py-4 rounded-[32px] text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-rose-500 hover:-translate-y-2 active:scale-95 transition-all disabled:opacity-50 font-heading"
            >
              {isLoading ? 'Requesting...' : 'Request Code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="space-y-3 text-center">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400  font-heading">Secure Key Verification</label>
              <input 
                type="text" 
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-gray-50  border-none rounded-[32px] p-6 text-center text-4xl font-black tracking-[0.8em] focus:ring-2 focus:ring-rose-500/10 focus:bg-white transition-all outline-none shadow-inner font-heading"
                placeholder="000000"
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gray-900 text-white py-4 rounded-[32px] text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-rose-500 hover:-translate-y-2 active:scale-95 transition-all disabled:opacity-50 font-heading"
            >
              {isLoading ? 'Verifying...' : 'Validate Code'}
            </button>
            <button 
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-400  hover:text-rose-500 transition-colors font-heading"
            >
              Change Email Target
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400  font-heading ml-2">New Security Key</label>
              <div className="group relative">
                <Icons.Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-rose-500 transition-colors" size={20} />
                <input 
                  type="password" 
                  required
                  min={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-50  border-none rounded-[32px] py-6 pl-16 pr-8 text-sm font-bold focus:ring-2 focus:ring-rose-500/10 focus:bg-white transition-all outline-none shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400  font-heading ml-2">Confirm New Key</label>
              <div className="group relative">
                <Icons.Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-rose-500 transition-colors" size={20} />
                <input 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-50  border-none rounded-[32px] py-6 pl-16 pr-8 text-sm font-bold focus:ring-2 focus:ring-rose-500/10 focus:bg-white transition-all outline-none shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gray-900 text-white py-7 rounded-[32px] text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-rose-500 hover:-translate-y-2 active:scale-95 transition-all disabled:opacity-50 font-heading"
            >
              {isLoading ? 'Resetting...' : 'Establish Key'}
            </button>
          </form>
        )}

        <div className="pt-6 text-center">
          <p className="text-[11px] font-black text-gray-400  group uppercase tracking-[0.2em] font-heading">
            Remembered your access?{' '}
            <Link to="/login" className="text-gray-900  group-hover:text-rose-500 transition-all border-b-2 border-transparent hover:border-rose-500 pb-1 ml-4 shadow-rose-200">
              Return to Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
