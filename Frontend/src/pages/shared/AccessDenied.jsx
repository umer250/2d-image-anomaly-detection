import React from 'react';
import { Link } from 'react-router-dom';

import { ShieldAlert, ArrowLeft, LogIn, UserPlus } from 'lucide-react';

const AccessDenied = () => {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Aesthetic */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            </div>

            <div className="max-w-md w-full text-center relative z-10">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-center mb-8">
                        <div className="h-24 w-24 bg-zinc-900 rounded-3xl flex items-center justify-center border border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)] group hover:scale-105 transition-transform duration-500">
                            <ShieldAlert size={48} className="text-red-500 animate-pulse" />
                        </div>
                    </div>

                    <h1 className="text-5xl font-black text-white mb-2 tracking-tighter">403</h1>
                    <h2 className="text-xl font-bold text-zinc-300 mb-6 uppercase tracking-widest">Access Denied</h2>

                    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 mb-8 backdrop-blur-sm">
                        <p className="text-zinc-400 leading-relaxed text-sm">
                            You don't have permission to access this directory or page on this server.
                            <span className="block mt-4 text-white font-semibold">To access the system, please signup or signin.</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Link
                            to="/login"
                            className="flex items-center justify-center px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-black bg-white hover:bg-zinc-200 transition-all shadow-xl active:scale-95"
                        >
                            <LogIn className="mr-2 h-4 w-4" />
                            Sign in
                        </Link>
                        <Link
                            to="/register"
                            className="flex items-center justify-center px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-zinc-800 border border-white/10 hover:bg-zinc-700 transition-all shadow-xl active:scale-95"
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Sign up
                        </Link>
                    </div>

                    <div className="mt-8">
                        <Link
                            to="/"
                            className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all group"
                        >
                            <ArrowLeft size={12} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                            Back to Infrastructure Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccessDenied;
