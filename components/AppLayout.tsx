import React, { useState, createContext, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout, PlusCircle, Users, History, LogOut, Menu, User as UserIcon } from 'lucide-react';

// Sidebar Context for Mobile Toggle
type SidebarContextType = {
    toggleMobileSidebar: () => void;
    isMobileSidebarOpen: boolean;
};

const SidebarContext = createContext<SidebarContextType>({
    toggleMobileSidebar: () => { },
    isMobileSidebarOpen: false
});

export const useSidebar = () => useContext(SidebarContext);

// Sidebar Item Component (Icon Rail Style)
const SidebarItem = ({ icon: Icon, label, path, active, onClick }: { icon: any, label: string, path: string, active: boolean, onClick?: () => void }) => {
    const navigate = useNavigate();
    return (
        <div className="relative group flex justify-center w-full">
            <button
                onClick={() => {
                    navigate(path);
                    if (onClick) onClick();
                }}
                className={`
                    p-3 rounded-2xl transition-all duration-300 relative
                    ${active
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'text-neutral-400 hover:bg-white hover:text-neutral-600'
                    }
                `}
            >
                <Icon size={24} strokeWidth={active ? 2.5 : 2} />

                {/* Active Indicator Dot */}
                {active && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-l-full hidden"></div>
                )}
            </button>

            {/* Tooltip (Desktop) */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-neutral-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg hidden md:block">
                {label}
                {/* Little triangle pointer */}
                <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-neutral-900 rotate-45 transform"></div>
            </div>
        </div>
    );
};

export const AppLayout = ({ children }: { children?: React.ReactNode }) => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const toggleMobileSidebar = () => setIsMobileSidebarOpen(prev => !prev);

    if (!user) return <>{children}</>;

    return (
        <SidebarContext.Provider value={{ toggleMobileSidebar, isMobileSidebarOpen }}>
            <div className="min-h-screen bg-neutral-50 flex font-sans text-neutral-900">

                {/* Mobile Backdrop */}
                {isMobileSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    />
                )}

                {/* Icon Rail Sidebar */}
                <aside className={`
                bg-neutral-50 border-r border-transparent 
                flex flex-col h-screen z-50 transition-all duration-300 ease-in-out py-6
                ${isMobileSidebarOpen ? 'fixed inset-y-0 left-0 w-24 translate-x-0 shadow-2xl bg-white' : 'hidden md:flex w-24 sticky top-0'}
            `}>
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
                            K
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-4 px-4 flex flex-col items-center">
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
                            active={location.pathname.startsWith('/clients')}
                            onClick={() => setIsMobileSidebarOpen(false)}
                        />
                        <SidebarItem
                            icon={History}
                            label="History"
                            path="/history"
                            active={location.pathname === '/history'}
                            onClick={() => setIsMobileSidebarOpen(false)}
                        />
                    </nav>

                    {/* Bottom Actions */}
                    <div className="px-4 mt-auto space-y-4 flex flex-col items-center">
                        <button
                            onClick={() => { logout(); navigate('/login'); }}
                            className="p-3 rounded-2xl text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            title="Sign out"
                        >
                            <LogOut size={24} />
                        </button>

                        <button className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-2 ring-neutral-100">
                            {user.photoUrl ? (
                                <img src={user.photoUrl} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                                    {user.name.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 h-screen w-full relative flex flex-col overflow-hidden bg-neutral-50 px-4 md:px-8">

                    {/* Top Header */}
                    <header className="py-6 flex items-center justify-between gap-4 sticky top-0 z-30 min-h-[88px] pointer-events-none">
                        {/* Mobile Menu Toggle (Left) - Pointer events allowed */}
                        <div className="flex items-center gap-4 pointer-events-auto">
                            <button onClick={toggleMobileSidebar} className="md:hidden p-2 text-neutral-600 hover:bg-white rounded-xl shadow-sm border border-neutral-100">
                                <Menu size={24} />
                            </button>
                        </div>

                        {/* Right Area - Empty now as requested, but keeping container for alignment/future */}
                        <div className="flex items-center gap-4"></div>
                    </header>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-auto pb-10 scroll-smooth no-scrollbar">
                        <div className="max-w-[1600px] mx-auto">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </SidebarContext.Provider>
    );
};
