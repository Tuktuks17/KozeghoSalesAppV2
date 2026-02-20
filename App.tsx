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
const SidebarContext = createContext<SidebarContextType>({ toggleMobileSidebar: () => { } });
export const useSidebar = () => useContext(SidebarContext);

const SidebarItem = ({ icon: Icon, label, path, active, onClick }: { icon: any, label: string, path: string, active: boolean, onClick?: () => void }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => {
        navigate(path);
        if (onClick) onClick();
      }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${active
          ? 'bg-primary/10 text-primary font-semibold shadow-sm border border-primary/10'
          : 'text-gray-500 hover:bg-neutral-100 hover:text-gray-900 font-medium'
        }`}
    >
      <Icon size={20} className={active ? "text-primary" : "text-gray-400 group-hover:text-gray-600"} />
      <span>{label}</span>
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
      <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">

        {/* Mobile Backdrop */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside className={`
          bg-white border-r border-gray-200 w-64 flex-shrink-0 flex-col h-screen z-50 shadow-sm
          ${isMobileSidebarOpen ? 'fixed inset-y-0 left-0 flex' : 'hidden md:flex md:sticky md:top-0'}
        `}>
          <div className="p-6 flex flex-col items-start border-b border-gray-100">
            <div className="mb-1 flex items-center space-x-2">
              {/* Kozegho Logo Placeholder - Text for now as URL was placeholder */}
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
                K
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">Kozegho</span>
            </div>
            <div className="text-xs text-primary font-semibold tracking-wider uppercase pl-10">Sales Automation</div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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

          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt="User" className="w-9 h-9 rounded-full border border-gray-200 shadow-sm" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold border border-primary/10">
                    {user.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-gray-900 truncate max-w-[100px]">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">Staff Engineer</p>
                </div>
              </div>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto h-screen w-full relative">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-30">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">K</div>
              <span className="font-bold text-gray-900">Kozegho</span>
            </div>
            <button onClick={toggleMobileSidebar} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Menu size={24} />
            </button>
          </div>

          <div className="max-w-7xl mx-auto p-4 md:p-8">
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
