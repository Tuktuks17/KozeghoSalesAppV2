
import React, { useState, useContext, createContext } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Layout, PlusCircle, Users, History, LogOut, Menu } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import CreateProposal from './pages/CreateProposal';
import ProposalDetail from './pages/ProposalDetail';
import ProposalDocument from './pages/ProposalDocument';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import NewClient from './pages/NewClient';
import ProposalHistory from './pages/ProposalHistory';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Sidebar Context
interface SidebarContextType {
  toggleMobileSidebar: () => void;
}
const SidebarContext = createContext<SidebarContextType>({ toggleMobileSidebar: () => {} });
export const useSidebar = () => useContext(SidebarContext);

const SidebarItem = ({ icon: Icon, label, path, active, onClick }: { icon: any, label: string, path: string, active: boolean, onClick?: () => void }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => {
        navigate(path);
        if (onClick) onClick();
      }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        active 
          ? 'bg-slate-800 text-white' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );
};

const AppLayout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const toggleMobileSidebar = () => setIsMobileSidebarOpen(prev => !prev);

  if (!user) return <>{children}</>;

  return (
    <SidebarContext.Provider value={{ toggleMobileSidebar }}>
      <div className="min-h-screen bg-slate-50 flex">
        
        {/* Mobile Backdrop */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside className={`
          bg-slate-900 text-white w-64 flex-shrink-0 flex-col h-screen z-50
          ${isMobileSidebarOpen ? 'fixed inset-y-0 left-0 flex' : 'hidden md:flex md:sticky md:top-0'}
        `}>
          <div className="p-6 border-b border-slate-800 flex flex-col items-center">
            <div className="mb-2">
               {/* Kozegho Logo */}
               <img 
                  src="https://placehold.co/160x40/0f172a/FFF?text=Kozegho&font=montserrat" 
                  alt="Kozegho Logo" 
                  className="h-8 w-auto object-contain" 
               />
            </div>
            <div className="text-xs text-slate-500 font-medium tracking-wider uppercase">Sales Workspace</div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <SidebarItem 
              icon={Layout} 
              label="Dashboard" 
              path="/" 
              active={location.pathname === '/'}
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <SidebarItem 
              icon={PlusCircle} 
              label="New Proposal" 
              path="/create" 
              active={location.pathname === '/create'}
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <SidebarItem 
              icon={Users} 
              label="Clients" 
              path="/clients" 
              active={location.pathname.startsWith('/clients') || location.pathname.startsWith('/client/')}
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <SidebarItem 
              icon={History} 
              label="Proposal History" 
              path="/history" 
              active={location.pathname === '/history'}
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                  {user.photoUrl ? (
                      <img src={user.photoUrl} alt="User" className="w-8 h-8 rounded-full border border-slate-600" />
                  ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">{user.name.substring(0,2).toUpperCase()}</div>
                  )}
                  <div className="overflow-hidden">
                      <p className="text-xs font-medium text-white truncate max-w-[100px]">{user.name}</p>
                  </div>
              </div>
              <button onClick={() => { logout(); navigate('/login'); }} className="text-slate-400 hover:text-white p-1.5 rounded-md hover:bg-slate-800 transition-colors" title="Sign out">
                  <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto h-screen p-4 md:p-8 w-full relative">
          {/* Hamburger removed from here, pages handle it */}
          <div className="max-w-6xl mx-auto pt-4 md:pt-0">
            {children}
          </div>
        </main>
      </div>
    </SidebarContext.Provider>
  );
};

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}
