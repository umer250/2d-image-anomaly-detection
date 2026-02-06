import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, Scan, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { role } = await login(
                e.target.email.value,
                e.target.password.value
            );

            setLoading(false);
            if (role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setLoading(false);
            setError(err.message || 'Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                <Scan size={800} className="text-white" />
            </div>
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center">
                        <Scan className="text-black" size={24} />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    Sign in to your account
                </h2>
                <p className="mt-2 text-center text-sm text-zinc-400">
                    Or{' '}
                    <Link to="/register" className="font-medium text-white hover:text-zinc-300 underline underline-offset-4">
                        create a new account
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-zinc-800"
                >
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                                Email address
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-zinc-500" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="focus:ring-white focus:border-white block w-full pl-10 sm:text-sm border-zinc-700 rounded-md py-2 bg-black text-white placeholder-zinc-500"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                                Password
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-zinc-500" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    className="focus:ring-white focus:border-white block w-full pl-10 pr-10 sm:text-sm border-zinc-700 rounded-md py-2 bg-black text-white placeholder-zinc-500"
                                    placeholder="••••••••"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-zinc-500 hover:text-white focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" aria-hidden="true" />
                                        ) : (
                                            <Eye className="h-5 w-5" aria-hidden="true" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-white focus:ring-white border-zinc-700 rounded bg-zinc-800"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-300">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <Link to="/reset-password" className="font-medium text-zinc-400 hover:text-white">
                                    Forgot your password?
                                </Link>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <>
                                        Sign in
                                        <ArrowRight className="ml-2 -mr-1 h-5 w-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-zinc-800" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-zinc-900 text-zinc-500">
                                    Demo Credentials
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-3">
                            <div className="rounded-md bg-zinc-800 p-4 border border-zinc-700">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <AlertCircle className="h-5 w-5 text-zinc-400" aria-hidden="true" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-white">For Demo Access:</h3>
                                        <div className="mt-2 text-sm text-zinc-400">
                                            <p>Email: admin@example.com</p>
                                            <p>Password: any password</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
