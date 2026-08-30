import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('apartment_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('apartment_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('apartment_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success) {
            setUser(res.data.user);
            localStorage.setItem('apartment_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Session validation error:', err);
          if (err.response?.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  // Step 1: Submit Credentials -> Backend validates & dispatches 6-digit OTP
  const login = async (emailOrMobile, password) => {
    try {
      const isEmail = emailOrMobile.includes('@');
      const payload = isEmail ? { email: emailOrMobile, password } : { mobile: emailOrMobile, password };
      const res = await api.post('/auth/login', payload);

      if (res.data?.requiresOtp) {
        return {
          success: true,
          requiresOtp: true,
          verificationToken: res.data.verificationToken,
          email: res.data.email,
          role: res.data.role,
          message: res.data.message,
          otpPreview: res.data.otpPreview,
        };
      }

      // If already logged in (fallback)
      if (res.data?.token) {
        setAuthSession(res.data.token, res.data.user);
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please check credentials.',
        isEmailUnverified: err.response?.data?.isEmailUnverified,
        email: err.response?.data?.email,
      };
    }
  };

  // Step 2: Verify 6-digit Login OTP -> Receives Final JWT & grants dashboard access
  const verifyLoginOtp = async (verificationToken, otp) => {
    try {
      const res = await api.post('/auth/verify-login-otp', {
        verificationToken,
        otp: String(otp).trim(),
      });

      if (res.data?.success && res.data.token) {
        setAuthSession(res.data.token, res.data.user);
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Invalid or expired OTP.',
        remainingAttempts: err.response?.data?.remainingAttempts,
        isExpired: err.response?.data?.isExpired,
      };
    }
  };

  // Resend 6-digit Login OTP
  const resendLoginOtp = async (verificationToken) => {
    try {
      const res = await api.post('/auth/resend-login-otp', { verificationToken });
      return {
        success: true,
        message: res.data?.message || 'New OTP sent.',
        cooldownSeconds: res.data?.cooldownSeconds || 60,
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to resend OTP.',
        cooldownRemaining: err.response?.data?.cooldownRemaining,
      };
    }
  };

  const setAuthSession = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    if (newToken) localStorage.setItem('apartment_token', newToken);
    if (newUser) localStorage.setItem('apartment_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('apartment_token');
    localStorage.removeItem('apartment_user');
    window.location.href = '/login';
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isBlockAdmin = user?.role === 'block_admin';
  const isReceptionist = user?.role === 'receptionist';
  const isResident = user?.role === 'resident';
  const isSecurity = user?.role === 'security';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        verifyLoginOtp,
        resendLoginOtp,
        logout,
        setUser,
        setToken,
        setAuthSession,
        isSuperAdmin,
        isBlockAdmin,
        isReceptionist,
        isResident,
        isSecurity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
