// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import Users from './components/users';
import Newmedialog from './components/newmedialog';
import Digitalrecording from './components/digitalrecording';
import Timeline from './components/timeline';
import AuxFiles from './components/AuxFiles'; // Correct import name
import AssistantPanel from './components/AssistantPanel';

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
          <Route path="/" element={<Users />} />
          <Route path="/newmedialog" element={<Newmedialog />} />
          <Route path="/digitalrecording" element={<Digitalrecording />} />
          <Route path="/timeline" element={<Timeline />} />
          {/* REPAIRED: Component name must be PascalCase, e.g., <AuxFiles />, not <auxfiles /> */}
          <Route path="/auxfiles" element={<AuxFiles />} />
          <Route path="/assistantpanel" element={<AssistantPanel/>}/>

        </Routes>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;