import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // or your global styles

// 1. Import the necessary tools from React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 2. Create a single instance of the QueryClient for your entire app
const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root'));

// 3. Render your app, wrapping the <App /> component with the provider
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);