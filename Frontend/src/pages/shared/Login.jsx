import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, Scan, Eye, EyeOff } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        let errorMsg = '';
        if (name === 'email' && value) {
            if (!validateEmail(value)) errorMsg = 'Please enter a valid email address';
        } else if (name === 'password' && value) {
            if (value.length < 8) errorMsg = 'Password must be at least 8 characters long';
        }
        setFieldErrors(prev => ({ ...prev, [name]: errorMsg }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let hasError = false;
        if (!validateEmail(formData.email)) {
            handleBlur({ target: { name: 'email', value: formData.email } });
            hasError = true;
        }
        if (formData.password.length < 8) {
            handleBlur({ target: { name: 'password', value: formData.password } });
            hasError = true;
        }

        if (hasError) {
            setError('Please fix the validation errors in the form.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { role } = await login(
                formData.email,
                formData.password
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
                <img src="/logo.png" alt="Background Logo" className="w-[800px] h-[800px] object-contain opacity-[0.06]" />
            </div>
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center">
                        <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    Sign in to your account
                </h2>
                <p className="mt-2 text-center text-sm text-zinc-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium text-white hover:text-zinc-300 underline underline-offset-4">
                        Create one
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div
                    className="bg-zinc-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-500"
                >

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                <span className="text-xs text-red-400 font-medium">{error}</span>
                            </div>
                        )}
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
                                    value={formData.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={clsx(
                                        "block w-full pl-10 sm:text-sm rounded-md py-2 bg-black text-white placeholder-zinc-500 transition-colors",
                                        fieldErrors.email 
                                            ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                                            : "border-zinc-700 focus:ring-white focus:border-white"
                                    )}
                                    placeholder="you@example.com"
                                />
                            </div>
                            {fieldErrors.email && (
                                <p className="mt-1.5 text-xs font-medium text-red-400 animate-in fade-in duration-200">{fieldErrors.email}</p>
                            )}
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
                                    value={formData.password}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    className={clsx(
                                        "block w-full pl-10 pr-10 sm:text-sm rounded-md py-2 bg-black text-white placeholder-zinc-500 transition-colors",
                                        fieldErrors.password 
                                            ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                                            : "border-zinc-700 focus:ring-white focus:border-white"
                                    )}
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
                            {fieldErrors.password && (
                                <p className="mt-1.5 text-xs font-medium text-red-400 animate-in fade-in duration-200">{fieldErrors.password}</p>
                            )}
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
                            <div className="mt-4 text-center">
                                <Link to="/forgot-password" size={14} className="font-medium text-zinc-400 hover:text-white text-sm">
                                    Forgot your password?
                                </Link>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
