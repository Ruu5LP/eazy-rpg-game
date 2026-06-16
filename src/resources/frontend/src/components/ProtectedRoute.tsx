import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { apiService, type AuthUser } from '../services/api';

interface ProtectedRouteProps {
  children: (user: AuthUser) => ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    const devAutoLogin = import.meta.env.VITE_DEV_AUTO_LOGIN === 'true';

    apiService
      .me()
      .then((response) => {
        if (isMounted) {
          setUser(response.user);
        }
      })
      .catch(async () => {
        if (devAutoLogin) {
          try {
            const response = await apiService.devLogin();

            if (isMounted) {
              setUser(response.user);
            }

            return;
          } catch {
            // Fall through to the normal auth redirect.
          }
        }

        if (isMounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <div className="auth-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children(user)}</>;
};

export default ProtectedRoute;
