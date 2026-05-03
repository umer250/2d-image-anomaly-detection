
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Upload,
    History,
    User,
    LogOut,
    Settings,
    Shield,
    Menu,
    X,
    Scan
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';


import Footer from '../Footer';

const MainLayout = () => {
    const { user, logout, isAdmin } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Upload Analysis', href: '/upload', icon: Upload },
        { name: 'History', href: '/history', icon: History },
        { name: 'Profile', href: '/profile', icon: User },
    ];

    if (isAdmin) {
        navigation.push({ name: 'Admin Panel', href: '/admin/dashboard', icon: Shield });
    }

    return (
        <div className="min-h-screen bg-black text-white flex overflow-x-hidden">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-black/50 backdrop-blur-xl fixed h-full z-20">
                <div className="p-5 flex items-center border-b border-zinc-800 h-16">
                    <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain mr-3 flex-shrink-0" />
                    <span className="text-lg font-bold tracking-tight truncate">AnomalyDetect</span>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={clsx(
                                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group",
                                    isActive
                                        ? "bg-white text-black"
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                                )}
                            >
                                <item.icon
                                    className={clsx(
                                        "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                                        isActive ? "text-black" : "text-zinc-500 group-hover:text-white"
                                    )}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-zinc-800">
                    <div className="flex items-center mb-4 px-2 gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 flex-shrink-0">
                            <span className="text-xs font-bold text-white">
                                {user?.full_name?.charAt(0) || 'U'}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.full_name || 'User'}</p>
                            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Top Bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-black border-b border-zinc-800 z-30 px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain flex-shrink-0" />
                    <span className="text-base font-bold">AnomalyDetect</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors" aria-label="Toggle menu">
                    {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-black/70 z-40" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            {/* Mobile Drawer */}
            <div className={clsx(
                "md:hidden fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-zinc-950 border-r border-zinc-800 z-50 flex flex-col transition-transform duration-300 ease-in-out",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
                        <span className="text-base font-bold">AnomalyDetect</span>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"><X size={20} /></button>
                </div>
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {navigation.map((item) => (
                        <Link 
                            key={item.name} 
                            to={item.href} 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={clsx("flex items-center px-4 py-3 text-sm font-medium rounded-lg",
                                location.pathname === item.href ? "bg-white text-black" : "text-zinc-400 hover:text-white hover:bg-zinc-900")}
                        >
                            <item.icon className="mr-4 h-5 w-5 flex-shrink-0" />
                            {item.name}
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-zinc-800">
                    <div className="flex items-center mb-3 gap-3 px-1 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 flex-shrink-0">
                            <span className="text-xs font-bold">{user?.full_name?.charAt(0) || 'U'}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.full_name || 'User'}</p>
                            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                        className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-400 rounded-lg hover:bg-red-500/10"
                    >
                        <LogOut className="mr-4 h-5 w-5 flex-shrink-0" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 min-w-0 md:ml-64 min-h-screen bg-black overflow-x-hidden">
                <div className="pt-14 md:pt-0 px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                    <Outlet />
                </div>
                <Footer />
            </main>
        </div>
    );
};

export default MainLayout;
