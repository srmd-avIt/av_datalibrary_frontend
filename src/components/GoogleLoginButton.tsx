// GOOGLE LOGIN COMPONENT: Modern login button with Google OAuth integration
import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
// GOOGLE AUTH INTEGRATION: Import the useAuth hook
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button'; // Assuming you have a ui folder
import { Mail } from 'lucide-react';

export const GoogleLoginButton = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  // GOOGLE AUTH INTEGRATION: Get the login function from our context
  const { login } = useAuth();

  const handleLoginSuccess = async (tokenResponse) => {
    console.log('Login successful:', tokenResponse);
    // GOOGLE AUTH INTEGRATION: Call the context login function with the access token
    await login(tokenResponse.access_token);
    setIsLoggingIn(false); // Stop loading indicator on success
  };

  const handleLoginError = (error) => {
    console.error('Login failed:', error);
    setIsLoggingIn(false); // Stop loading indicator on error
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleLoginSuccess,
    onError: handleLoginError,
  });

  const handleButtonClick = () => {
    setIsLoggingIn(true);
    googleLogin();
  };
  
  // The rest of your JSX remains the same, but here is the Button with the updated onClick
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundImage: "linear-gradient(to bottom right, #020617, #0f172a, #020617)",
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.5)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(51, 65, 85, 0.5)",
          borderRadius: "1rem",
          padding: "2rem",
          width: "100%",
          maxWidth: "28rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          {/* ... Header JSX from your original code ... */}
          <div
            style={{
                width: "4rem",
                height: "4rem",
                backgroundImage: "linear-gradient(to bottom right, #3b82f6, #9333ea)",
                borderRadius: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem",
                marginLeft: "auto",
                marginRight: "auto",
            }}
            >
            <Mail style={{ width: "2rem", height: "2rem", color: "white" }} /> 
            </div>

            <h1
            style={{
                fontSize: "1.5rem",
                lineHeight: "2rem",
                color: "white",
                marginBottom: "0.5rem",
            }}
            >
            Data Library App
            </h1>

            <p
            style={{
                color: "rgb(148, 163, 184)",
            }}
            >
            Sign in with your Google account to access the dashboard
            </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleButtonClick}
            disabled={isLoggingIn}
            // ... Styling from your original code ...
            style={{
                width: "100%",                 
                backgroundColor: "white",     
                color: "black",               
                border: "0",                  
                height: "3rem",               
                borderRadius: "0.5rem",      
                transition: "all 0.2s ease",   
                display: "flex",               
                alignItems: "center",         
                justifyContent: "center",     
                gap: "0.75rem",              
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                cursor: isLoggingIn ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f3f4f6"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; }}
          >
            {isLoggingIn ? (
              <>
                 <div
                    style={{
                        height: "1.25rem",
                        width: "1.25rem",
                        borderRadius: "9999px",
                        borderBottom: "2px solid rgb(75 85 99)",
                        animation: "spin 1s linear infinite",
                    }}
                    />
                Signing in...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  {/* ... SVG paths ... */}
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};