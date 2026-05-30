import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
      </div>
    );
  }

  // If the user is logged in, redirect them away from auth pages
  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === 'driver') {
      return <Navigate to="/driver" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GuestRoute;
