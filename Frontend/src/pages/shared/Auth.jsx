import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, Scan, Eye, EyeOff, User, CheckCircle } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

const Auth = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register } = useAuth();

    // State for toggling between Login and Register
    // Checks if the current path is /register to set initial state
    const [isLogin, setIsLogin] = useState(location.pathname !== '/register');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState(location.state?.message || '');
    const [showPassword, setShowPassword] = useState(false);

    // Form data for both login and register
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '' // Only for register
    });

    const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    useEffect(() => {
        // Update mode if URL changes directly
        setIsLogin(location.pathname !== '/register');
        setError('');
        setSuccessMessage(location.state?.message || '');
        setFormData({ email: '', password: '', name: '' });
        setFieldErrors({ email: '', password: '' });
    }, [location.pathname]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        
        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        let error = '';
        if (name === 'email' && value) {
            if (!validateEmail(value)) {
                error = 'Please enter a valid email address';
            }
        } else if (name === 'password' && value) {
            if (value.length < 8) {
                error = 'Password must be at least 8 characters long';
            }
        }
        setFieldErrors(prev => ({ ...prev, [name]: error }));
    };

    const toggleMode = (mode) => {
        if (mode === 'login') {
            navigate('/login');
        } else {
            navigate('/register');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Final validation check before submit
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
        setSuccessMessage('');

        try {
            if (isLogin) {
                // Login Flow
                const { role } = await login(
                    formData.email,
                    formData.password
                );

                // Add minor delay for state propagation/Better UX
                setTimeout(() => {
                    setLoading(false);
                    if (role === 'admin') {
                        navigate('/admin/dashboard', { replace: true });
                    } else {
                        navigate('/dashboard', { replace: true });
                    }
                }, 100);

            } else {
                // Register Flow
                await register({
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.name,
                    role: 'user',
                    is_active: true,
                    is_superuser: false
                });

                setLoading(false);
                setSuccessMessage('Registration successful! Please sign in.');
                // Switch to login mode
                navigate('/login');
            }
        } catch (err) {
            setLoading(false);
            setError(err.message || (isLogin ? 'Login failed.' : 'Registration failed.'));
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden z-50">
            {/* Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                <img src="/logo.png" alt="Background Logo" className="w-[800px] h-[800px] object-contain opacity-[0.06]" />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="flex justify-center">
                    <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="mt-2 text-center text-sm text-zinc-400">
                    Access the Anomaly Detection Platform
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="bg-zinc-900/80 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Toggle Switch */}
                    <div className="flex p-1 bg-zinc-950 rounded-lg mb-8 border border-zinc-800">
                        <button
                            type="button"
                            onClick={() => toggleMode('login')}
                            className={clsx(
                                "flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200",
                                isLogin ? "bg-white text-black shadow-lg" : "text-zinc-400 hover:text-white"
                            )}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleMode('register')}
                            className={clsx(
                                "flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200",
                                !isLogin ? "bg-white text-black shadow-lg" : "text-zinc-400 hover:text-white"
                            )}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div key={isLogin ? 'login' : 'register'} className="space-y-6 animate-in fade-in duration-200">
                            {/* Name Field - Register Only */}
                            {!isLogin && (
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
                                        Full Name
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-zinc-500" />
                                        </div>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            autoComplete="name"
                                            required={!isLogin}
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="focus:ring-white focus:border-white block w-full pl-10 sm:text-sm border-zinc-700 rounded-md py-2 bg-black text-white placeholder-zinc-500"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Email Field */}
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

                            {/* Password Field */}
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
                                        autoComplete={isLogin ? "current-password" : "new-password"}
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
                        </div>

                        {isLogin && (
                            <div className="flex justify-end pr-1">
                                <Link to="/forgot-password" size={14} className="text-[11px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-all">
                                    Forgot password?
                                </Link>
                            </div>
                        )}

                        {/* Error & Success Messages */}
                        {error && (
                            <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 flex items-center animate-in fade-in duration-200">
                                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}
                        {successMessage && (
                            <div className="rounded-md bg-green-500/10 border border-green-500/20 p-3 flex items-center animate-in fade-in duration-200">
                                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                                <p className="text-sm text-green-400">{successMessage}</p>
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-black bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loading ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <>
                                        {isLogin ? 'Sign In' : 'Create Account'}
                                        <ArrowRight className="ml-2 -mr-1 h-5 w-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>


                </div>
            </div>
        </div>
    );
};

export default Auth;
