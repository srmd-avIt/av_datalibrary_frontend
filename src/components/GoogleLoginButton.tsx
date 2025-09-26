// GOOGLE LOGIN COMPONENT: Modern login button with Google OAuth integration
import { useState } from 'react';
import { Button } from './ui/button';
import { LogIn, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const GoogleLoginButton = () => {
  const { login, loading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // GOOGLE LOGIN FIX: Updated handle login with better error handling
  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await login();
    } catch (error) {
      console.error('Login failed:', error);
      // The AuthContext handles fallback to mock login automatically
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div
  style={{
    display: "flex",                  // flex
    flexDirection: "column",          // flex-col
    alignItems: "center",             // items-center
    justifyContent: "center",         // justify-center
    minHeight: "100vh",               // min-h-screen
    backgroundImage: "linear-gradient(to bottom right, #020617, #0f172a, #020617)", // bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950
    padding: "1rem",                  // p-4
  }}
>

     <div
  style={{
    backgroundColor: "rgba(15, 23, 42, 0.5)", // bg-slate-900/50
    backdropFilter: "blur(24px)",             // backdrop-blur-xl
    border: "1px solid rgba(51, 65, 85, 0.5)", // border border-slate-700/50
    borderRadius: "1rem",                     // rounded-2xl
    padding: "2rem",                          // p-8
    width: "100%",                            // w-full
    maxWidth: "28rem",                        // max-w-md (448px)
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", // shadow-2xl
  }}
>

        {/* GOOGLE LOGIN: Header section with app title */}
       <div
  style={{
    textAlign: "center",       // text-center
    marginBottom: "2rem",      // mb-8
  }}
>
  <div
    style={{
      width: "4rem",                          // w-16
      height: "4rem",                         // h-16
      backgroundImage: "linear-gradient(to bottom right, #3b82f6, #9333ea)", // bg-gradient-to-br from-blue-500 to-purple-600
      borderRadius: "1rem",                   // rounded-2xl
      display: "flex",                        // flex
      alignItems: "center",                   // items-center
      justifyContent: "center",               // justify-center
      marginBottom: "1rem",                   // mb-4
      marginLeft: "auto",                     // mx-auto
      marginRight: "auto",
    }}
  >
    <Mail style={{ width: "2rem", height: "2rem", color: "white" }} /> 
    {/* w-8 h-8 text-white */}
  </div>

  <h1
    style={{
      fontSize: "1.5rem",     // text-2xl
      lineHeight: "2rem",
      color: "white",         // text-white
      marginBottom: "0.5rem", // mb-2
    }}
  >
    Data Library App
  </h1>

  <p
    style={{
      color: "rgb(148, 163, 184)", // text-slate-400
    }}
  >
    Sign in with your Google account to access the dashboard
  </p>
</div>


        {/* GOOGLE LOGIN FIX: Updated login form with demo mode indicator */}
        <div className="space-y-4">
         <Button
  onClick={handleLogin}
  disabled={loading || isLoggingIn}
  style={{
    width: "100%",                 // w-full
    backgroundColor: "white",      // bg-white
    color: "black",                // text-black
    border: "0",                   // border-0
    height: "3rem",                // h-12
    borderRadius: "0.5rem",        // rounded-lg
    transition: "all 0.2s ease",   // transition-all duration-200
    display: "flex",               // flex
    alignItems: "center",          // items-center
    justifyContent: "center",      // justify-center
    gap: "0.75rem",                // gap-3
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)", // shadow-lg
    cursor: loading || isLoggingIn ? "not-allowed" : "pointer",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = "#f3f4f6"; // hover:bg-gray-100
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = "white"; // reset
  }}
>
            {isLoggingIn ? (
              <>
                <div
  style={{
    height: "1.25rem", // h-5
    width: "1.25rem", // w-5
    borderRadius: "9999px", // rounded-full
    borderBottom: "2px solid rgb(75 85 99)", // border-b-2 border-gray-600
    animation: "spin 1s linear infinite", // animate-spin
  }}
/>
                Signing in...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                Continue with Demo Account
              </>
            )}
          </Button>

          {/* DEMO MODE: Updated information note for demo mode */}
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
  <p
    style={{
      fontSize: "0.75rem", // text-xs
      color: "rgb(100 116 139)", // text-slate-500
    }}
  >
    This is a demo version of the Data Library App. You'll be signed in automatically.
  </p>

  <div
    style={{
      padding: "0.5rem 0.75rem", // px-3 py-2
      backgroundColor: "rgba(245, 158, 11, 0.1)", // bg-amber-500/10
      border: "1px solid rgba(245, 158, 11, 0.2)", // border border-amber-500/20
      borderRadius: "0.5rem", // rounded-lg
    }}
  >
    <p
      style={{
        fontSize: "0.75rem", // text-xs
        color: "rgb(251 191 36)", // text-amber-400
      }}
    >
      <strong>Demo Mode:</strong> Using mock authentication with demo user data. No real Google account required.
    </p>
  </div>
          </div>
        </div>
      </div>
    </div>
  );
};