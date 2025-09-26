import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // or your global styles

// 1. Import the necessary tools from React Query
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 2. Import the AuthProvider
import { AuthProvider } from "./contexts/AuthContext";

// 3. Create a single instance of the QueryClient for your entire app
const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById("root"));

// 4. Render your app, wrapping the <App /> component with both providers
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);