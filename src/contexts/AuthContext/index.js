// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const AuthContext = createContext();

// Custom hook for using the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setCurrentUser(JSON.parse(userData));
        setIsAuthenticated(true);
      } catch (err) {
        // If stored data is invalid, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      // In a real app, you would make an API call here
      // For now, we'll simulate successful login
      const mockUser = { id: '123', email, name: 'Test User', role: 'admin' };
      
      // Store auth data
      localStorage.setItem('token', 'mock-token-value');
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      setCurrentUser(mockUser);
      setIsAuthenticated(true);
      return mockUser;
    } catch (err) {
      setError(err.message || 'Failed to login');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    error,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};