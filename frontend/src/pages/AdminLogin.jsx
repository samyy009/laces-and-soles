import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      setTimeout(() => {
        navigate('/admin');
      }, 100);
    } else {
      setError(result.error || "Establishment sequence failed. Verify credentials.");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-black  px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle red glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-rose-500/10 blur-[100px] pointer-events-none" />

        <div className="text-center mb-6 relative">
          <Icons.ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h1 className="text-xl font-black text-white tracking-widest uppercase">
            Restricted<br />System Access
          </h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
            Laces & Soles Administration
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 text-rose-500 text-xs font-bold uppercase tracking-widest border border-rose-500/20 rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Security Identifier</label>
            <input 
              type="text" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black  border border-zinc-800 rounded-xl p-4 text-sm font-mono text-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all outline-none"
              placeholder="System ID"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Passcode</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black  border border-zinc-800 rounded-xl p-4 pr-12 text-sm font-mono text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-rose-500 transition-colors p-1"
              >
                {showPassword ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-rose-500 text-white py-4 text-xs font-black uppercase tracking-[0.3em] rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all disabled:opacity-50 mt-4"
          >
            {isLoading ? 'Authenticating...' : 'Establish Uplink'}
          </button>
        </form>

      </div>
    </div>
  );
}
