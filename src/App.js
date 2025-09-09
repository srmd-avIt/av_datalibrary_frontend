// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Import all your page components
import Users from './components/users';
import Newmedialog from './components/newmedialog';
import Digitalrecording from './components/digitalrecording';
import Timeline from './components/timeline';
import AuxFiles from './components/AuxFiles'; // Correct import name
import AssistantPanel from './components/AssistantPanel';

// --- NEW: Import the Dashboard component ---
import Dashboard from './components/dashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, 
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* --- NEW: Add the Dashboard as the main page --- */}
          {/* The `index` route will be the default for "/" */}
          <Route path="/" element={<Dashboard />} /> 
          
          {/* --- Keep all your existing routes --- */}
          <Route path="/events" element={<Users />} />
          <Route path="/newmedialog" element={<Newmedialog />} />
          <Route path="/digitalrecording" element={<Digitalrecording />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/auxfiles" element={<AuxFiles />} />
          <Route path="/assistantpanel" element={<AssistantPanel/>}/>

        </Routes>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;