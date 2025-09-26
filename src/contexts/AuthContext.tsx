// GOOGLE AUTH INTEGRATION: New authentication context for managing Google OAuth login state
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // DEMO MODE: Auto-login with mock user for demo purposes
  useEffect(() => {
    const initializeDemoAuth = async () => {
      try {
        // Check if user is already logged in (from localStorage) first
        const savedUser = localStorage.getItem('auth_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
          setLoading(false);
          return;
        }

        // DEMO MODE: Automatically login with demo user
        await mockLogin();
      } catch (error) {
        console.warn('Demo auth initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeDemoAuth();
  }, []);

  // GOOGLE AUTH: Handle Google OAuth callback
  const handleGoogleCallback = async (response: any) => {
    try {
      setLoading(true);
      
      // Decode the JWT token from Google
      const decoded = JSON.parse(atob(response.credential.split('.')[1]));
      
      const userData: User = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        accessToken: response.credential, // Store the JWT token
      };

      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      
      console.log('User successfully authenticated:', userData);
    } catch (error) {
      console.error('Authentication failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // DEMO MODE: Login always uses mock authentication
  const login = async () => {
    try {
      setLoading(true);
      console.log('Demo login initiated...');
      await mockLogin();
    } catch (error) {
      console.error('Demo login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // DEMO MODE: Mock login for demo purposes with realistic user data
  const mockLogin = async () => {
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockUser: User = {
      id: 'demo_user_123',
      email: 'john.doe@datalib.com',
      name: 'John Doe',
      picture: 'https://images.unsplash.com/photo-1652471943570-f3590a4e52ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGJ1c2luZXNzbWFufGVufDF8fHx8MTc1ODcwOTAyOHww&ixlib=rb-4.1.0&q=80&w=400', // Professional headshot
      accessToken: 'demo_access_token_123',
    };

    setUser(mockUser);
    localStorage.setItem('auth_user', JSON.stringify(mockUser));
    console.log('Demo authentication successful:', mockUser);
  };

  // GOOGLE AUTH: Logout function to clear authentication state
  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
    
    // Sign out from Google
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
    
    console.log('User logged out');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// GOOGLE AUTH FIX: Updated type declaration with additional methods and error handling
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          disableAutoSelect: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
          cancel: () => void;
          revoke: (hint: string, callback: (response: any) => void) => void;
        };
      };
    };
  }
}