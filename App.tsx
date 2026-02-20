import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CreateProposal from './pages/CreateProposal';
import ProposalDetail from './pages/ProposalDetail';
import ProposalDocument from './pages/ProposalDocument';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import NewClient from './pages/NewClient';
import ProposalHistory from './pages/ProposalHistory';
import Login from './pages/Login';
import { useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/AppLayout';

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-neutral-400 text-sm font-medium animate-pulse">Loading Kozegho...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={
            <ProtectedRoute>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/create" element={<CreateProposal />} />
                  <Route path="/proposal/:id" element={<ProposalDetail />} />
                  <Route path="/proposal/:id/document" element={<ProposalDocument />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/clients/new" element={<NewClient />} />
                  <Route path="/client/:id" element={<ClientDetail />} />
                  <Route path="/history" element={<ProposalHistory />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}
