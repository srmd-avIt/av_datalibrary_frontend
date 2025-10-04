import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from "sonner";
import Swal from 'sweetalert2';

// Define the shape of a single permission
interface UserPermission {
  resource: string;
  actions: ("read" | "write")[];
}

// User interface now includes the permissions array
interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  accessToken: string;
  role: "Owner" | "Admin" | "Member" | "Guest";
  permissions: UserPermission[]; // This holds the user's specific view rights
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (accessToken: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch user profile from Google
  const fetchGoogleUserProfile = async (accessToken: string) => {
    try {
      console.log("Step 1: Fetching profile from Google...");
      const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log("Step 1 Success: Google profile received:", response.data);
      return response.data;
    } catch (error) {
      console.error("Step 1 FAILED: Could not fetch Google user profile.", error);
      throw new Error("Invalid session token. Please log in again.");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('google-token');
    console.log("User logged out, session cleared.");
  };

  // The core function to validate the user against YOUR backend.
  const validateAndSetUserSession = async (accessToken: string, isLogin: boolean = false) => {
    try {
      // Step 1: Get user profile from Google
      const googleProfile = await fetchGoogleUserProfile(accessToken);

      // Step 2: Check if the user exists in YOUR backend system
      const apiUrl = `${import.meta.env.VITE_API_URL}/users/by-email/${googleProfile.email}`;
      const backendResponse = await fetch(apiUrl);

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json();

        if (backendResponse.status === 404) {
          // Show warning popup if user is not found
          Swal.fire({
            icon: 'warning',
            title: 'User Not Found',
            text: errorData.error || 'User not found in application registry. Please contact admin.',
          });
          throw new Error("Access Denied: User not found in the system.");
        } else {
          throw new Error(errorData.error || 'An unknown error occurred.');
        }
      }

      const appUserData = await backendResponse.json();

      // Step 3: Check for valid data from your backend
      if (!appUserData || !appUserData.role) {
        toast.error("Authorization failed: User data is incomplete.");
        throw new Error("Authorization failed: User data is incomplete.");
      }

      // Step 4: Create the final user object and set the session
      const finalUser: User = {
        id: appUserData.id,
        email: googleProfile.email,
        name: googleProfile.name,
        picture: googleProfile.picture,
        role: appUserData.role,
        accessToken: accessToken,
        permissions: appUserData.permissions || [],
      };

      setUser(finalUser);
      localStorage.setItem("google-token", accessToken);

      // Step 5: Update last active status on explicit login
      if (isLogin) {
        try {
          await axios.put(`${import.meta.env.VITE_API_URL}/users/${finalUser.id}/last-active`, {
            lastActive: new Date().toISOString(),
          });
          console.log(`Updated last active for user ${finalUser.id}`);
        } catch (updateError) {
          console.warn("Could not update last active status:", updateError);
        }
      }
    } catch (error) {
      console.error('Login error:', error.message);
      // Only show the popup on an explicit login attempt
      if (isLogin) {
        Swal.fire({
          icon: 'error',
          title: "Login Failed",
          text: "User not found. Please contact the admin for access.",
        });
      }

      // Always log out on any failure in the validation process
      logout();
    }
  };
  
  // On initial load, check for a stored token
  useEffect(() => {
    const storedToken = localStorage.getItem('google-token');
    if (storedToken) {
      console.log("Found stored token. Attempting to restore session...");
      validateAndSetUserSession(storedToken, false)
        .catch((err) => {
          // We don't show a toast on session restore failure, it's a silent process.
          console.warn("Session restore failed:", err.message);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Login function called by the UI
  const login = async (accessToken: string) => {
    setLoading(true);
    try {
      await validateAndSetUserSession(accessToken, true);
    } catch (error) {
      // The error toast is now fully handled inside validateAndSetUserSession.
      // We re-throw the error so the calling component (GoogleLoginButton) knows the login failed
      // and can stop its loading spinner.
      throw error;
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Helper function to handle Axios errors
const handleAxiosError = (error: any) => {
  if (axios.isAxiosError(error)) {
    // Check if the error is a '404 Not Found' from YOUR backend API
    if (error.response?.status === 404) {
      // Show a helpful, persistent warning popup with an action button
      toast.warning('Access Denied', {
        description: 'Your email is not registered in our system. Please contact the administrator to request access.',
        // Keep the toast on screen until the user dismisses it
        duration: Infinity,
        action: {
          label: 'Contact Admin',
          onClick: () => {
            // IMPORTANT: Replace with your actual admin's email address
            window.location.href = 'mailto:admin@example.com?subject=App Access Request';
          },
        },
      });
      // Still throw an error to stop the login process and inform the caller
      throw new Error("Access Denied: User not found in the system.");
    } else {
      // Handle other errors
      toast.error("Login failed: Could not connect to the authentication service.");
      throw new Error("Login failed: Could not connect to the authentication service.");
    }
  }
  // Fallback for non-Axios or unexpected errors
  toast.error("An unexpected error occurred during login.");
  throw error;
};