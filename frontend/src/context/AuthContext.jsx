import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  registerWithEmail,
  loginWithEmail,
  logoutUser,
  onUserAuthStateChanged,
} from '../firebase/auth';
import { isFirebaseConfigured } from '../firebase/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onUserAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    return await loginWithEmail(email, password);
  };

  const register = async (email, password) => {
    return await registerWithEmail(email, password);
  };

  const logout = async () => {
    return await logoutUser();
  };

  const value = {
    currentUser,
    loading,
    isFirebaseConfigured,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
