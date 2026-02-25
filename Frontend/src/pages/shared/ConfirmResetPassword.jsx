import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle, Scan, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

import clsx from 'clsx';
import { authAPI } from '../../services/api';

const ConfirmResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [passwords, setPasswords] = useState({
        new_password: '',
        confirm_password: ''
    });

    // Extract token from query params or state
    const query = new URLSearchParams(location.search);
    const token = location.state?.token || query.get('token') || '';


    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setError('Invalid or missing reset token.');
                setVerifying(false);
                return;
            }

            try {
                await authAPI.verifyResetToken(token);
                setVerifying(false);
            } catch (err) {
                setError(err.message || 'Reset link is invalid or has expired.');
                setVerifying(false);
            }
        };

        verifyToken();
    }, [token]);

    const getStrength = (pw) => {
        if (!pw) return 0;
        let score = 0;
        if (pw.length > 8) score += 25;
        if (/[A-Z]/.test(pw)) score += 25;
        if (/[0-9]/.test(pw)) score += 25;
        if (/[^A-Za-z0-9]/.test(pw)) score += 25;
        return score;
    };

    const strength = getStrength(passwords.new_password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwords.new_password !== passwords.confirm_password) {
            setError('Passwords do not match');
            return;
        }
        if (strength < 50) {
            setError('Password is too weak. Please use a stronger password.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await authAPI.resetPassword(token, passwords.new_password);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.message || 'Failed to reset password. Link may be expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                <Scan size={800} className="text-white" />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="flex justify-center">
                    <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center border border-white/10 shadow-lg">
                        <Lock className="text-black" size={24} />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
                    Set New Password
                </h2>
                <div className="mt-2 flex items-center justify-center gap-2 text-zinc-500 text-sm">
                    <ShieldCheck size={14} className="text-blue-500" />
                    <span>Secure encryption protocol v2.4</span>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div
                    className="bg-zinc-900 shadow-2xl sm:rounded-xl border border-white/5 overflow-hidden animate-in fade-in zoom-in-95 duration-500"
                >

                    <div className="p-8 sm:px-10">
                        {success ? (
                            <div className="text-center space-y-6 py-4">
                                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 border border-green-500/20">
                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">Success</h3>
                                    <p className="text-sm text-zinc-400">
                                        Your password has been reset successfully. Redirecting to login...
                                    </p>

                                </div>
                                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 transition-all duration-3000 ease-linear"
                                        style={{ width: success ? '100%' : '0%' }}
                                    />
                                </div>

                            </div>
                        ) : (
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 text-red-500 text-xs">
                                        <AlertCircle size={14} />
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-4 w-4 text-zinc-600" />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={passwords.new_password}
                                                onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                                                required
                                                className="block w-full pl-10 pr-10 py-3 bg-black border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-700 focus:outline-none focus:border-white/20 transition-all font-mono"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-600 hover:text-white transition-all"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Strength Meter */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                                            <span className="text-zinc-500">Security Strength</span>
                                            <span className={clsx(
                                                strength > 75 ? "text-green-500" : strength > 40 ? "text-amber-500" : "text-red-500"
                                            )}>
                                                {strength > 75 ? 'Excellent' : strength > 40 ? 'Moderate' : 'Weak'}
                                            </span>
                                        </div>
                                        <div className="h-1 bg-zinc-800 rounded-full flex gap-1">
                                            {[25, 50, 75, 100].map((step) => (
                                                <div
                                                    key={step}
                                                    className={clsx(
                                                        "h-full flex-1 rounded-full transition-all duration-500",
                                                        strength >= step
                                                            ? (strength > 75 ? "bg-green-500" : strength > 40 ? "bg-amber-500" : "bg-red-500")
                                                            : "bg-transparent"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <ShieldCheck className="h-4 w-4 text-zinc-600" />
                                            </div>
                                            <input
                                                type="password"
                                                value={passwords.confirm_password}
                                                onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                                                required
                                                className="block w-full pl-10 pr-4 py-3 bg-black border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-700 focus:outline-none focus:border-white/20 transition-all font-mono"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || strength < 50}
                                    className="w-full flex justify-center py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-widest text-black bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl mt-4"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            Update Password
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmResetPassword;
