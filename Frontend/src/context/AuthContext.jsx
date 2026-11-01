import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('autonear_access_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await authApi.getMe();
          setUser(res.data.user);
        } catch (err) {
          console.warn('[Auth] Session expired or invalid, logging out.');
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { accessToken, user: userData } = res.data;
    localStorage.setItem('autonear_access_token', accessToken);
    setToken(accessToken);
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const res = await authApi.register(formData);
    const { accessToken, user: userData } = res.data;
    localStorage.setItem('autonear_access_token', accessToken);
    setToken(accessToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('autonear_access_token');
    setToken(null);
    setUser(null);
  };

  // Quick switch between seeded demo accounts for interactive demonstration
  const switchDemoRole = async (role) => {
    const credentials = {
      customer: { email: 'customer@autonear.demo', password: 'password123' },
      owner: { email: 'owner@autonear.demo', password: 'password123' },
      admin: { email: 'admin@autonear.demo', password: 'admin123' }
    };

    const creds = credentials[role];
    if (creds) {
      return await login(creds.email, creds.password);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchDemoRole,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

