// In src/index.tsx or main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // Your refactored App component
import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import "./index.css";
import "./styles/globals.css";

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      console.log('Service worker registration failed');
    });
  });
}

const queryClient = new QueryClient();
const rootElement = document.getElementById("root");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId="870548676121-hto2849qfj888qrk1s6gc9jeq5qag9hu.apps.googleusercontent.com">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProtectedRoute>
              {/* App is now a child, so it can access the auth context */}
              <App /> 
            </ProtectedRoute>
          </AuthProvider>
        </QueryClientProvider>
      </GoogleOAuthProvider>
    </React.StrictMode>
  );
}