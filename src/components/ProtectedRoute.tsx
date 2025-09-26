// PROTECTED ROUTE COMPONENT: Wrapper component to protect authenticated routes
import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLoginButton } from './GoogleLoginButton';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();

  // PROTECTED ROUTE: Show loading state while checking authentication
  if (loading) {
    return (
      <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundImage: "linear-gradient(to bottom right, #020617, #0f172a, #020617)", // from-slate-950 via-slate-900 to-slate-950
  }}
>
  <div style={{ textAlign: "center" }}>
    <div
      style={{
        height: "3rem", // h-12
        width: "3rem", // w-12
        borderRadius: "9999px", // rounded-full
        borderBottom: "2px solid rgb(59 130 246)", // border-blue-500
        margin: "0 auto 1rem auto", // mx-auto mb-4
        animation: "spin 1s linear infinite", // animate-spin
      }}
    ></div>
    <p style={{ color: "rgb(148 163 184)" }}>Loading...</p>
  </div>

  {/* Spin animation keyframes */}
  <style>
    {`
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `}
  </style>
</div>

    );
  }

  // PROTECTED ROUTE: Show login screen if not authenticated
  if (!isAuthenticated) {
    return <GoogleLoginButton />;
  }

  // PROTECTED ROUTE: Show protected content if authenticated
  return <>{children}</>;
};