import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronLeft, ChevronRight, LayoutDashboard, History, Settings, Upload, FileText, User as UserIconLucide, Shield } from 'lucide-react';
import clsx from 'clsx';
import AppLogo from './icons/AppLogo';
import {
    DashboardIcon,
    UploadIcon,
    HistoryIcon,
    ResultsIcon,
    AdminIcon,
    SettingsIcon,
    UserIcon,
} from './icons/SidebarIcons';

const Sidebar = ({ isOpen, setIsOpen, isMobile }) => {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    
    // In real app, derived from auth context. Using admin role to show admin links if on admin path
    const isAdminMode = location.pathname.startsWith('/admin');

    const userNavItems = [
        { name: 'Dashboard', path: '/dashboard', icon: DashboardIcon },
        { name: 'Upload Image', path: '/upload', icon: UploadIcon },
        { name: 'Results', path: '/results', icon: ResultsIcon },
        { name: 'History', path: '/history', icon: HistoryIcon },
        { name: 'Profile', path: '/profile', icon: UserIcon },
        { name: 'Settings', path: '/settings', icon: SettingsIcon },
    ];

    const adminNavItems = [
        { name: 'App Home', path: '/dashboard', icon: ResultsIcon }, // Link back to user dashboard
        { name: 'Admin Dashboard', path: '/admin/dashboard', icon: DashboardIcon },
        { name: 'User Management', path: '/admin/users', icon: UserIcon },
        { name: 'System Logs', path: '/admin/health', icon: AdminIcon },
        { name: 'Global History', path: '/admin/history', icon: HistoryIcon },
        { name: 'Settings', path: '/settings', icon: SettingsIcon },
    ];

    const navItems = isAdminMode ? adminNavItems : userNavItems;

    const toggleCollapse = () => setCollapsed(!collapsed);

    const sidebarClasses = clsx(
        'bg-[#09090b] border-r border-zinc-800 text-white transition-all duration-300 ease-in-out flex flex-col',
        {
            'fixed inset-y-0 left-0 z-50 w-64': isMobile,
            'translate-x-0': isMobile && isOpen,
            '-translate-x-full': isMobile && !isOpen,
            'sticky top-0 h-screen': !isMobile,
            'w-64': !isMobile && !collapsed,
            'w-[76px]': !isMobile && collapsed,
        }
    );

    return (
        <>
            {isMobile && isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)} />
            )}

            <div className={sidebarClasses}>
                {/* Header / Logo */}
                <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-800 w-full overflow-hidden shrink-0">
                    <div className={clsx("flex items-center", collapsed && !isMobile ? "mx-auto" : "")}>
                        <AppLogo width={collapsed && !isMobile ? 32 : 160} showText={!(collapsed && !isMobile)} color="#6366f1" />
                    </div>
                    {isMobile && (
                        <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-6 space-y-1.5 px-3 overflow-y-auto w-full scrollbar-thin scrollbar-thumb-zinc-800">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    'flex items-center rounded-lg transition-colors group relative text-sm',
                                    collapsed && !isMobile ? 'justify-center py-3' : 'px-3 py-2.5',
                                    isActive
                                        ? 'bg-indigo-600 text-white font-medium shadow-sm'
                                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                                )}
                                onClick={() => isMobile && setIsOpen(false)}
                            >
                                <Icon 
                                    size={22} 
                                    color={isActive ? '#ffffff' : 'currentColor'} 
                                    className={clsx(!collapsed || isMobile ? 'mr-3' : '', isActive && !collapsed ? 'drop-shadow-sm' : '')} 
                                />
                                
                                {(!collapsed || isMobile) && (
                                    <span className="truncate">{item.name}</span>
                                )}

                                {/* Hover tooltip for collapsed mode */}
                                {collapsed && !isMobile && (
                                    <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-zinc-800 text-white text-xs font-semibold rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-zinc-700">
                                        {item.name}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Toggle */}
                {!isMobile && (
                    <div className="p-4 border-t border-zinc-800 shrink-0">
                        <button
                            onClick={toggleCollapse}
                            className="w-full flex items-center justify-center p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
                            aria-label="Toggle Sidebar"
                        >
                            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default Sidebar;
