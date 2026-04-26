import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle, Eye, EyeOff, Scan, AlertCircle } from 'lucide-react';
import { authAPI } from '../../services/api';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const token = location.state?.token || '';
    const email = location.state?.email || '';

    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [passwords, setPasswords] = useState({ new_password: '', confirm_password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (passwords.new_password !== passwords.confirm_password) {
            setError('Passwords do not match.');
            return;
        }
        if (passwords.new_password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (!token) {
            setError('Invalid session. Please restart the password reset flow.');
            return;
        }

        setLoading(true);
        try {
            await authAPI.resetPassword(token, passwords.new_password);
            setSubmitted(true);
        } catch (err) {
            setError(err.message || 'Password reset failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                <img src="/logo.png" alt="Background Logo" className="w-[800px] h-[800px] object-contain opacity-[0.06]" />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="flex justify-center">
                    <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center">
                        <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    Set New Password
                </h2>
                <p className="mt-2 text-center text-sm text-zinc-400">
                    {email ? `Resetting password for ${email}` : 'Create a strong new password'}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="bg-zinc-900 py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {submitted ? (
                        <div className="text-center space-y-6">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 border border-green-500/20">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Password Updated!</h3>
                                <p className="mt-2 text-sm text-zinc-400">
                                    Your password has been reset successfully. You can now sign in with your new password.
                                </p>
                            </div>
                            <Link
                                to="/login"
                                className="w-full flex justify-center py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-widest text-black bg-white hover:bg-zinc-200 transition-all"
                            >
                                Back to Sign In
                            </Link>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 text-red-400 text-xs">
                                    <AlertCircle size={14} />
                                    {error}
                                </div>
                            )}

                            {/* New Password */}
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-zinc-600" />
                                    </div>
                                    <input
                                        type={showNew ? 'text' : 'password'}
                                        required
                                        value={passwords.new_password}
                                        onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                                        className="block w-full pl-10 pr-10 py-3 bg-black border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-700 focus:outline-none focus:border-white/20 transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNew(!showNew)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-white"
                                    >
                                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-zinc-600" />
                                    </div>
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        required
                                        value={passwords.confirm_password}
                                        onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                                        className="block w-full pl-10 pr-10 py-3 bg-black border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-700 focus:outline-none focus:border-white/20 transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-white"
                                    >
                                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-widest text-black bg-white hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>Reset Password <ArrowRight className="ml-2 h-4 w-4" /></>
                                )}
                            </button>

                            <div className="text-center">
                                <Link to="/login" className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-all">
                                    Back to Sign In
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
