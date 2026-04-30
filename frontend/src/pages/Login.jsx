import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import LottieAnimation from '../components/premium/LottieAnimation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle, loginWithFacebook } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    <div className="min-h-screen flex flex-col lg:flex-row-reverse bg-white  overflow-hidden">
      {/* Visual Pane */}
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

      <div className="flex-1 flex items-center justify-center p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] mesh-gradient opacity-10 blur-[100px] rounded-full" />
        
        <div className="w-full max-w-md space-y-6 relative z-10">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-black text-gray-900  uppercase tracking-tighter font-heading">Sign In</h1>
            <div className="mt-3 h-1.5 w-16 bg-rose-500 rounded-full mx-auto lg:mx-0 shadow-[0_0_20px_rgba(244,63,94,0.3)]" />
            <p className="mt-4 text-[10px] text-gray-400  font-black uppercase tracking-[0.3em] font-heading">Boutique Member Portal</p>
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

          <form onSubmit={handleSubmit} className="space-y-5">
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
            <div className="space-y-3">
              <div className="flex justify-between items-center ml-2">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400  font-heading">Security Key</label>
                <Link to="/forgot-password" size={20} className="text-[10px] font-black text-rose-500 hover:text-gray-900 transition-colors uppercase tracking-[0.2em] font-heading">Lost Pass?</Link>
              </div>
              <div className="group relative">
                <Icons.Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-rose-500 transition-colors" size={20} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50  border-none rounded-[32px] py-4 pl-16 pr-14 text-sm font-bold focus:ring-2 focus:ring-rose-500/10 focus:bg-white transition-all outline-none shadow-inner"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-rose-500 transition-colors p-1"
                >
                  {showPassword ? <Icons.EyeOff size={20} /> : <Icons.Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gray-900 text-white py-4 rounded-[32px] text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-rose-500 hover:-translate-y-2 active:scale-95 transition-all disabled:opacity-50 font-heading"
            >
              {isLoading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>

          {/* Social Logins */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black font-heading"><span className="bg-white  px-6 text-gray-300 tracking-[0.3em]">Or External Link</span></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex justify-center sm:justify-start min-h-[44px]">
                <GoogleLogin
                  onSuccess={credentialResponse => {
                    loginWithGoogle(credentialResponse.credential).then(res => {
                      if (res.success) navigate('/');
                    });
                  }}
                  onError={() => {
                    console.log('Login Failed');
                  }}
                  useOneTap
                  theme="outline"
                  shape="pill"
                  size="large"
                  text="signin_with"
                />
              </div>
              <FacebookLogin
                appId="2204173596994401"
                autoLoad={false}
                fields="name,email,picture"
                callback={(response) => {
                  console.log('FACEBOOK_DEBUG_RESPONSE:', response);
                  if (response.accessToken) {
                    toast.info("Facebook verified! Connecting to Laces and Soles...");
                    loginWithFacebook(response.accessToken).then(res => {
                      if (res.success) {
                        navigate('/');
                      } else {
                        toast.error(`Server Login Failed: ${res.error}`);
                      }
                    });
                  } else {
                    console.log('Facebook SDK did not return a token:', response);
                    toast.error("Facebook Login was cancelled or failed.");
                  }
                }}
                render={renderProps => (
                  <button 
                    onClick={renderProps.onClick}
                    className="flex items-center justify-center gap-4 bg-gray-50 border border-transparent py-2.5 rounded-[28px] text-[10px] font-black uppercase tracking-widest text-[#1877F2] hover:bg-white hover:border-blue-100 hover:shadow-xl transition-all font-heading active:scale-95 h-[44px] w-full"
                  >
                    <Icons.Facebook size={18} fill="currentColor" />
                    Facebook
                  </button>
                )}
              />
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
