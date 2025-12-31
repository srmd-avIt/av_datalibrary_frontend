import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { toast } from "sonner";
import Swal from 'sweetalert2';

// --- Interfaces ---

interface UserPermission {
  resource: string;
  actions: ("read" | "write")[];
}

interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  role: "Owner" | "Admin" | "Member" | "Guest";
  permissions: UserPermission[];
  token: string; // ✅ This holds the JWT from our backend
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (googleAccessToken: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch basic profile info from Google using the access token
   * provided by the Google Login popup.
   */
  const fetchGoogleUserProfile = async (accessToken: string) => {
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      console.error("Google Profile Fetch Failed:", error);
      throw new Error("Google session expired. Please log in again.");
    }
  };

  /**
   * Clear all session data
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('app-token');    // Clear our JWT
    localStorage.removeItem('google-token'); // Clear Google OAuth token
    console.log("User logged out, session cleared.");
  };

  /**
   * Validates the Google user against our Registry and issues a JWT
   */
  const validateAndSetUserSession = async (googleAccessToken: string, isLogin: boolean = false) => {
    try {
      // 1. Get user email and name from Google
      const googleProfile = await fetchGoogleUserProfile(googleAccessToken);

      // 2. Exchange Google info for our internal JWT
      // ✅ MODIFIED: Now uses POST /api/auth/login
      const authUrl = `${API_BASE_URL}/auth/login`;
      const backendResponse = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: googleProfile.email })
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json();

        if (backendResponse.status === 404) {
          Swal.fire({
            icon: 'warning',
            title: 'Access Denied',
            text: errorData.error || 'Your email is not registered in our system. Please contact admin.',
          });
          throw new Error("User not found in registry.");
        } else {
          throw new Error(errorData.error || 'Authentication failed.');
        }
      }

      const { token, user: appUserData } = await backendResponse.json();

      // 3. Construct the final local User object
      const finalUser: User = {
        id: appUserData.id,
        email: googleProfile.email,
        name: googleProfile.name,
        picture: googleProfile.picture,
        role: appUserData.role,
        permissions: appUserData.permissions || [],
        token: token, // ✅ Save the JWT inside the user object
      };

      // 4. Update State and LocalStorage
      setUser(finalUser);
      localStorage.setItem("app-token", token);         // Used for API calls
      localStorage.setItem("google-token", googleAccessToken); // Used for session restore

      // 5. Update last active status on backend (Authenticated with JWT)
      if (isLogin) {
        try {
          await axios.put(`${API_BASE_URL}/users/${finalUser.id}/last-active`, 
            { lastActive: new Date().toISOString() },
            { 
              headers: { 
                Authorization: `Bearer ${token}` // ✅ Pass JWT in header
              } 
            }
          );
        } catch (updateError) {
          console.warn("Could not update last active status:", updateError);
        }
      }
      
      if (isLogin) toast.success(`Welcome back, ${googleProfile.name}!`);

    } catch (error: any) {
      console.error('Auth logic failed:', error.message);
      
      if (isLogin) {
        // Only show error alert if it's an explicit login attempt
        // (not a silent background session restoration)
        if (!error.message.includes("not found")) {
            toast.error("Login failed. Please check your connection.");
        }
      }
      logout();
    }
  };
  
  /**
   * On Initial App Load: Restore session if tokens exist
   */
  useEffect(() => {
    const storedGoogleToken = localStorage.getItem('google-token');
    if (storedGoogleToken) {
      validateAndSetUserSession(storedGoogleToken, false)
        .catch(() => console.warn("Background session restoration failed."))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Main Login function called by the Google Login Button
   */
  const login = async (googleAccessToken: string) => {
    setLoading(true);
    try {
      await validateAndSetUserSession(googleAccessToken, true);
    } catch (error) {
      throw error; // Re-throw to allow component-level handling
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use Auth state globally
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};