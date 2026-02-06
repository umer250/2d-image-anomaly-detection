
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
import { motion, AnimatePresence } from 'framer-motion';

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
        <div className="min-h-screen bg-black text-white flex">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-black/50 backdrop-blur-xl fixed h-full z-20">
                <div className="p-6 flex items-center border-b border-zinc-800 h-16">
                    <Scan className="text-white mr-3" size={24} />
                    <span className="text-lg font-bold tracking-tight">AnomalyDetect</span>
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
                                        "mr-3 h-5 w-5 transition-colors",
                                        isActive ? "text-black" : "text-zinc-500 group-hover:text-white"
                                    )}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-zinc-800">
                    <div className="flex items-center mb-4 px-2">
                        <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                            <span className="text-xs font-bold text-white">
                                {user?.full_name?.charAt(0) || 'U'}
                            </span>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-white max-w-[120px] truncate">{user?.full_name || 'User'}</p>
                            <p className="text-xs text-zinc-500 max-w-[120px] truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 w-full bg-black border-b border-zinc-800 z-30 px-4 h-16 flex items-center justify-between">
                <div className="flex items-center">
                    <Scan className="text-white mr-3" size={24} />
                    <span className="text-lg font-bold">AnomalyDetect</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-zinc-400 hover:text-white">
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        className="fixed inset-0 z-40 bg-zinc-950 pt-20 px-6 md:hidden"
                    >
                        <nav className="space-y-2">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={clsx(
                                        "flex items-center px-4 py-3 text-base font-medium rounded-lg",
                                        location.pathname === item.href
                                            ? "bg-white text-black"
                                            : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                                    )}
                                >
                                    <item.icon className="mr-4 h-5 w-5" />
                                    {item.name}
                                </Link>
                            ))}
                            <button
                                onClick={() => {
                                    handleLogout();
                                    setIsMobileMenuOpen(false);
                                }}
                                className="flex items-center w-full px-4 py-3 text-base font-medium text-red-400 rounded-lg hover:bg-red-500/10"
                            >
                                <LogOut className="mr-4 h-5 w-5" />
                                Sign Out
                            </button>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 md:ml-64 min-h-screen bg-black relative">
                <div className="p-4 sm:p-6 lg:p-8 mt-16 md:mt-0">
                    <Outlet />
                </div>
                <Footer />
            </main>
        </div>
    );
};

export default MainLayout;
