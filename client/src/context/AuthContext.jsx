import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until we know if a session exists

  // Restore the session on page load.
  useEffect(() => {
    let active = true;
    api
      .get('/auth/me')
      .then((res) => active && setUser(res.data.data.user))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // The axios interceptor fires this when an API call returns 401.
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.data.user);
    return res.data.data.user;
  }, []);

  // Creates the account and emails a code. The user is only logged in after verifying it.
  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data.data;
  }, []);

  const verifyOtp = useCallback(async (email, otp) => {
    const res = await api.post('/auth/verify-otp', { email, otp });
    setUser(res.data.data.user);
    return res.data.data.user;
  }, []);

  const resendOtp = useCallback((email) => api.post('/auth/resend-otp', { email }), []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  // Used after the password reset flow and profile edits.
  const updateUser = useCallback((nextUser) => setUser(nextUser), []);

  // Keeps the bookmark list in sync after saving/unsaving a post.
  const setBookmarks = useCallback((bookmarks) => setUser((u) => (u ? { ...u, bookmarks } : u)), []);

  const value = useMemo(
    () => ({ user, loading, isAdmin: user?.role === 'admin', login, register, verifyOtp, resendOtp, logout, updateUser, setBookmarks }),
    [user, loading, login, register, verifyOtp, resendOtp, logout, updateUser, setBookmarks]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
