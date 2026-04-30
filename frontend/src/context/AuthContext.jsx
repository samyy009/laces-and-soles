import { createContext, useState, useEffect, useContext } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(Cookies.get('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    }
    setLoading(false);
  }, [token]);

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API}/api/login`, { email, password });
      const { user: userData, token: jwtToken, message } = res.data;
      setUser(userData);
      setToken(jwtToken);
      Cookies.set('token', jwtToken, { expires: 7 });
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
      toast.success(message);
      return { success: true, user: userData };
    } catch (err) {
      const msg = err.response?.data?.error || 'Connection Failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (full_name, email, password, phone_number) => {
    try {
      const res = await axios.post(`${API}/api/register`, { full_name, email, password, phone_number });
      const { user: userData, token: jwtToken, message } = res.data;
      setUser(userData);
      setToken(jwtToken);
      Cookies.set('token', jwtToken, { expires: 7 });
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
      toast.success(message);
      return { success: true, user: userData };
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    Cookies.remove('token');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('laces_soles_cart');
    localStorage.removeItem('laces_soles_wishlist');
    delete axios.defaults.headers.common['Authorization'];
    toast.info("Logged out successfully");
    window.location.href = '/login'; // Force hard reload to clear FB SDK state
  };

  const loginWithGoogle = async (credential) => {
    try {
      const res = await axios.post(`${API}/api/google-login`, { credential });
      const { user: userData, token: jwtToken, message } = res.data;
      
      setUser(userData);
      setToken(jwtToken);
      Cookies.set('token', jwtToken, { expires: 7 });
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
      toast.success(message);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Google Login failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const loginWithFacebook = async (accessToken) => {
    try {
      const res = await axios.post(`${API}/api/facebook-login`, { accessToken });
      const { user: userData, token: jwtToken, message } = res.data;
      
      setUser(userData);
      setToken(jwtToken);
      Cookies.set('token', jwtToken, { expires: 7 });
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
      toast.success(message);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Facebook Login failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, loginWithGoogle, loginWithFacebook, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
