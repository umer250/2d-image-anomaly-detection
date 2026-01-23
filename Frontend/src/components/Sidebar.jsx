import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Upload,
    FileText,
    History,
    Info,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    Scan,
    User,
    Settings,
    Shield
} from 'lucide-react';
import clsx from 'clsx';

const Sidebar = ({ isOpen, setIsOpen, isMobile }) => {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    // TODO: Get from auth context
    const role = 'user'; // 'user' or 'admin'

    const userNavItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Upload Image', path: '/upload', icon: Upload },
        { name: 'Results', path: '/results', icon: FileText },
        { name: 'History', path: '/history', icon: History },
        { name: 'Profile', path: '/profile', icon: User },
        { name: 'Settings', path: '/settings', icon: Settings },
        { name: 'About', path: '/about', icon: Info },
    ];

    const adminNavItems = [
        { name: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'User Management', path: '/admin/users', icon: User },
        { name: 'System Health', path: '/admin/health', icon: Shield },
        { name: 'Global History', path: '/admin/history', icon: History },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    const navItems = role === 'admin' ? adminNavItems : userNavItems;

    const toggleCollapse = () => {
        setCollapsed(!collapsed);
    };

    const sidebarClasses = clsx(
        'bg-black border-r border-zinc-800 text-white transition-all duration-300 ease-in-out flex flex-col',
        {
            'fixed inset-y-0 left-0 z-50 w-64': isMobile,
            'translate-x-0': isMobile && isOpen,
            '-translate-x-full': isMobile && !isOpen,
            'sticky top-0 h-screen': !isMobile,
            'w-64': !isMobile && !collapsed,
            'w-20': !isMobile && collapsed,
        }
    );

    return (
        <>
            {/* Mobile Overlay */}
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className={sidebarClasses}>
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
                    {!collapsed && (
                        <div className="flex items-center space-x-2">
                            <Scan className="text-blue-500" size={24} />
                            <span className="font-bold text-xl tracking-wider text-white">ANOMALY.AI</span>
                        </div>
                    )}
                    {collapsed && <Scan className="text-blue-500 mx-auto" size={24} />}

                    {isMobile && (
                        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-6 space-y-1 px-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    'flex items-center px-4 py-3 rounded-md transition-all duration-200 group relative text-sm font-medium',
                                    {
                                        'bg-zinc-800 text-white': isActive,
                                        'text-zinc-400 hover:bg-zinc-900 hover:text-white': !isActive,
                                        'justify-center': collapsed && !isMobile,
                                    }
                                )}
                                onClick={() => isMobile && setIsOpen(false)}
                            >
                                <Icon size={20} className={clsx({ 'mr-3': !collapsed || isMobile })} />
                                {(!collapsed || isMobile) && <span>{item.name}</span>}

                                {/* Tooltip for collapsed state */}
                                {collapsed && !isMobile && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-zinc-700">
                                        {item.name}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Collapse Toggle (Desktop only) */}
                {!isMobile && (
                    <div className="p-4 border-t border-zinc-800">
                        <button
                            onClick={toggleCollapse}
                            className="w-full flex items-center justify-center p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
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
