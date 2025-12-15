import React, { useState } from 'react';
import { Bell, User, Menu, Scan, ChevronDown, LogOut, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
    return (
        <header className="h-16 bg-black/50 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="lg:hidden p-2 hover:bg-zinc-800 rounded-lg text-zinc-400"
                >
                    <Menu size={24} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="bg-white p-1.5 rounded-lg">
                        <Scan size={20} className="text-black" />
                    </div>
                    <h2 className="text-lg font-semibold text-white hidden sm:block tracking-tight">
                        Anomaly<span className="text-zinc-500">.AI</span>
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white relative transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-black"></span>
                </button>

                <div className="flex items-center gap-3 pl-4 border-l border-zinc-800">
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-medium text-white">Admin User</p>
                        <p className="text-xs text-zinc-500">Supervisor</p>
                    </div>
                    <div className="relative group">
                        <button className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 border border-zinc-700 hover:border-zinc-500 transition-colors">
                            <User size={20} />
                        </button>

                        {/* Dropdown Menu */}
                        <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                            <div className="py-1">
                                <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white">
                                    <User size={16} className="mr-3" />
                                    Profile
                                </Link>
                                <Link to="/settings" className="flex items-center px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white">
                                    <Settings size={16} className="mr-3" />
                                    Settings
                                </Link>
                                <div className="border-t border-zinc-800 my-1"></div>
                                <Link to="/login" className="flex items-center px-4 py-2 text-sm text-red-400 hover:bg-zinc-800 hover:text-red-300">
                                    <LogOut size={16} className="mr-3" />
                                    Sign out
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
