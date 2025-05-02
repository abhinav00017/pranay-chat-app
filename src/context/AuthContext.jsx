import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

// Create the Auth Context
export const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Load user data when token changes
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const { data } = await authService.getCurrentUser();
          setUser(data);
          setLoading(false);
        } catch (err) {
          console.error('Failed to load user:', err);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setLoading(false);
          setError('Session expired. Please login again.');
        }
      } else {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Register user
  const register = async (name, email, password) => {
    try {
      setLoading(true);
      setError(null);
      const data = await authService.register(name, email, password);
      setToken(data.token);
      setUser(data);
      navigate('/');
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      console.error('Registration failed:', errorMessage);
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const data = await authService.login(email, password);
      setToken(data.token);
      setUser(data);
      navigate('/');
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      setLoading(false);
      throw err;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      navigate('/login');
    }
  };

  // Update profile
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      const { data } = await authService.updateProfile(userData);
      setUser({ ...user, ...data });
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
      setLoading(false);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;