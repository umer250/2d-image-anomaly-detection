import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileQuestion, ArrowLeft } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex justify-center mb-8">
                        <div className="h-24 w-24 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            <FileQuestion size={48} className="text-zinc-400" />
                        </div>
                    </div>

                    <h1 className="text-6xl font-bold text-white mb-4">404</h1>
                    <h2 className="text-2xl font-semibold text-zinc-300 mb-6">Page Not Found</h2>
                    <p className="text-zinc-500 mb-8">
                        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                    </p>

                    <Link
                        to="/"
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-black bg-white hover:bg-zinc-200 transition-all shadow-lg"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Back to Home
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default NotFound;
