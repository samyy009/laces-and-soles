import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';
import LottieAnimation from '../components/premium/LottieAnimation';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, loginWithFacebook, loginWithGoogleToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Google OAuth popup: opens account picker, returns access_token ──
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      try {
        const result = await loginWithGoogleToken(tokenResponse.access_token);
        if (result.success) navigate('/', { replace: true });
      } catch {
        toast.error('Google Sign-In failed. Please try again.');
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => {
      setIsGoogleLoading(false);
      toast.error('Google Sign-In was cancelled or failed.');
    },
    prompt: 'select_account',  // Always show the account chooser
  });

  // If redirecting from registration, show success message
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMsg(location.state.message);
      // Clean up the state so it doesn't persist on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      if (result.user.role === 'driver') {
        navigate('/driver', { replace: true });
      } else if (result.user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        // Regular users always go to Home as requested
        navigate('/', { replace: true });
      }
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col lg:flex-row-reverse bg-white overflow-hidden">
      {/* Visual Pane - only on lg+ */}
      <div className="hidden lg:block lg:flex-[1.2] relative overflow-hidden">

        <div className="absolute inset-0 bg-cover bg-center" 
             style={{ backgroundImage: "url('/auth_banner.png')" }} />
        <div className="absolute inset-0 bg-black/50" />


        <div className="relative h-full w-full flex flex-col justify-end p-24 z-10">
          <div className="max-w-xl">
             <span className="text-[10px] font-black uppercase tracking-[1em] text-rose-500 mb-6 block drop-shadow-md">Elite Access</span>
             <h2 className="text-7xl font-black text-white uppercase tracking-tighter leading-none font-heading drop-shadow-xl">
                WELCOME <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">BACK</span>
             </h2>
             <p className="mt-8 text-xl text-gray-200 max-w-md font-medium italic leading-relaxed drop-shadow-md">
                Re-enter the archive. Your curated collection and exclusive drops await your return.
             </p>
          </div>
        </div>
      </div>

      {/* Mobile top banner */}
      <div className="lg:hidden relative h-24 sm:h-32 overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/auth_banner.png')" }} />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center">
          <div className="text-2xl font-black uppercase tracking-tighter text-white font-heading">
            <span className="text-rose-400">Laces</span>&<span className="text-rose-400">S</span>oles
          </div>
          <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.4em] mt-1">Elite Member Portal</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-5 lg:p-6 relative overflow-y-auto">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] mesh-gradient opacity-10 blur-[100px] rounded-full" />
        
        <div className="w-full max-w-md space-y-4 relative z-10 py-2">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl lg:text-4xl font-black text-gray-900 uppercase tracking-tighter font-heading">Sign In</h1>
            <div className="mt-2 h-1.5 w-16 bg-rose-500 rounded-full mx-auto lg:mx-0 shadow-[0_0_20px_rgba(244,63,94,0.3)]" />
            <p className="mt-2 text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] font-heading">Boutique Member Portal</p>
          </div>

          {error && (
            <div className="p-6 bg-rose-50 text-rose-500 text-xs font-black uppercase tracking-widest border border-rose-100 rounded-[24px] flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <Icons.AlertCircle size={20} strokeWidth={3} />
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-6 bg-emerald-50 text-emerald-600 text-xs font-black uppercase tracking-widest border border-emerald-100 rounded-[24px] flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <Icons.CheckCircle size={20} strokeWidth={3} />
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 font-heading ml-2">Member Email</label>
              <div className="group relative">
                <Icons.Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-rose-500 transition-colors" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-[28px] py-3 pl-14 pr-6 text-sm font-bold focus:ring-2 focus:ring-rose-500/10 focus:bg-white transition-all outline-none shadow-inner"
                  placeholder="john@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-2">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 font-heading">Security Key</label>
                <Link to="/forgot-password" className="text-[10px] font-black text-rose-500 hover:text-gray-900 transition-colors uppercase tracking-[0.2em] font-heading">Lost Pass?</Link>
              </div>
              <div className="group relative">
                <Icons.Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-rose-500 transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-[28px] py-3 pl-14 pr-12 text-sm font-bold focus:ring-2 focus:ring-rose-500/10 focus:bg-white transition-all outline-none shadow-inner"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-rose-500 transition-colors p-1"
                >
                  {showPassword ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gray-900 text-white py-3 rounded-[28px] text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-rose-500 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 font-heading"
            >
              {isLoading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>

          {/* Social Logins */}
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black font-heading"><span className="bg-white px-6 text-gray-300 tracking-[0.3em]">Or External Link</span></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* ── Google Sign-In Button ── */}
              <button
                type="button"
                disabled={isGoogleLoading}
                onClick={() => handleGoogleLogin()}
                className="flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xl py-2.5 rounded-[28px] text-[10px] font-black uppercase tracking-widest text-gray-700 transition-all font-heading active:scale-95 h-[44px] w-full disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isGoogleLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-rose-500 rounded-full animate-spin" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                {isGoogleLoading ? 'Signing in...' : 'Google'}
              </button>
              <button 
                onClick={() => {
                  if (typeof window.FB === 'undefined') {
                    toast.error("Connecting to Facebook... Please try again in a moment.");
                    return;
                  }
                  
                  const processFacebookToken = (token) => {
                    loginWithFacebook(token).then(res => {
                      if (res.success) {
                        navigate('/', { replace: true });
                      } else {
                        toast.error(`Login Error: ${res.error}`);
                      }
                    });
                  };

                  // Call FB.login DIRECTLY to prevent browser popup blockers.
                  window.FB.login((loginResponse) => {
                    if (loginResponse.authResponse) {
                      processFacebookToken(loginResponse.authResponse.accessToken);
                    } else {
                      toast.error("Facebook Login was cancelled or failed. Please try again.");
                    }
                  }, { scope: 'public_profile,email' });
                }}
                className="flex items-center justify-center gap-4 bg-gray-50 border border-transparent py-2.5 rounded-[28px] text-[10px] font-black uppercase tracking-widest text-[#1877F2] hover:bg-white hover:border-blue-100 hover:shadow-xl transition-all font-heading active:scale-95 h-[44px] w-full"
              >
                <Icons.Facebook size={18} fill="currentColor" />
                Facebook
              </button>
            </div>
          </div>

          <p className="text-center text-[11px] font-black text-gray-400  group uppercase tracking-[0.2em] font-heading">
            New to the boutique?{' '}
            <Link to="/register" className="text-gray-900  group-hover:text-rose-500 transition-all border-b-2 border-transparent hover:border-rose-500 pb-1 ml-4 shadow-rose-200">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
