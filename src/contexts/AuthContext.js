import React, { createContext, useContext, useState, useEffect } from 'react';
import { hasAccess, getUserRole, isMasterUser, APP_CONFIG } from '../config/appConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for stored user session
    const validateStoredUser = async () => {
      const storedUser = localStorage.getItem('warp_user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          const userHasAccess = await hasAccess(userData.email);
          if (userHasAccess) {
            // Re-validate user role from backend
            const currentRole = await getUserRole(userData.email);
            const updatedUser = {
              ...userData,
              role: currentRole,
              isMaster: await isMasterUser(userData.email)
            };
            setUser(updatedUser);
            setIsAuthenticated(true);
            localStorage.setItem('warp_user', JSON.stringify(updatedUser));
          } else {
            localStorage.removeItem('warp_user');
          }
        } catch (error) {
          console.error('Error validating stored user data:', error);
          localStorage.removeItem('warp_user');
        }
      }
      setLoading(false);
    };
    
    validateStoredUser();
  }, []);

  const login = async (userData) => {
    const userHasAccess = await hasAccess(userData.email);
    if (!userHasAccess) {
      throw new Error('Access denied. Please contact administrator.');
    }

    const enrichedUser = {
      ...userData,
      role: await getUserRole(userData.email),
      isMaster: await isMasterUser(userData.email),
      loginTime: new Date().toISOString()
    };

    setUser(enrichedUser);
    setIsAuthenticated(true);
    localStorage.setItem('warp_user', JSON.stringify(enrichedUser));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('warp_user');
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
