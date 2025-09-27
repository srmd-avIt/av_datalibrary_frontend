// src/contexts/AuthContext.js
import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  accessToken: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// 1. Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. Create the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('google-token') || null);
  const [loading, setLoading] = useState(true); // Start with loading true for initial check

  useEffect(() => {
    // On initial load, check if a token exists in local storage
    const storedToken = localStorage.getItem('google-token');
    if (storedToken) {
      // If token exists, fetch user profile to validate it
      fetchUserProfile(storedToken)
        .then(profile => {
          setUser(profile);
          setToken(storedToken);
        })
        .catch(() => {
          // If fetching fails, the token is likely invalid or expired
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // No token found, stop loading
      setLoading(false);
    }
  }, []);

  // Function to fetch user profile from Google using an access token
  const fetchUserProfile = async (accessToken: string) => {
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      throw error; // Re-throw error to be caught by the caller
    }
  };

  // Login function: receives access token, fetches profile, and updates state
  const login = async (accessToken: string) => {
    try {
      const profile = await fetchUserProfile(accessToken);
      setUser(profile);
      setToken(accessToken);
      localStorage.setItem('google-token', accessToken);
    } catch (error) {
      // Handle login failure
      console.error("Login process failed", error);
      logout(); // Ensure clean state on failure
    }
  };

  // Logout function: clears all auth state
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('google-token');
  };

  const isAuthenticated = !!user;

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. Create a custom hook to use the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};