import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle, Scan, AlertCircle } from 'lucide-react';


const ForgotPassword = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [submitted, setSubmitted] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { authAPI } = await import('../../services/api');
            await authAPI.forgotPassword(email);
            setLoading(false);
            navigate('/verify-otp', { state: { email } });
        } catch (err) {


            // Even if it fails, we show success if it's a "user not found" for security,
            // but for generic network errors we show the error.
            if (err.message.includes('network') || err.message.includes('fetch')) {
                setError('Network error. Please try again later.');
            } else {
                // For security, show "success" message even if email doesn't exist
                setSubmitted(true);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                <Scan size={800} className="text-white" />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="flex justify-center">
                    <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center">
                        <Scan className="text-black" size={24} />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    Forgot Password
                </h2>
                <p className="mt-2 text-center text-sm text-zinc-400">
                    We'll send you a 6-digit verification code to reset your password.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div
                    className="bg-zinc-900 shadow-2xl sm:rounded-xl border border-white/5 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500"
                >

                    <div className="p-8 sm:px-10">
                        {submitted ? (
                            <div className="text-center space-y-6">
                                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 border border-green-500/20">
                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">Check your email</h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        We've sent a 6-digit verification code to <span className="text-white font-medium">{email}</span>.
                                    </p>
                                </div>
                                <div className="pt-4">
                                    <Link
                                        to="/verify-otp"
                                        state={{ email }}
                                        className="w-full flex justify-center py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-widest text-black bg-white hover:bg-zinc-200 transition-all shadow-lg"
                                    >
                                        Go to Verification
                                    </Link>
                                </div>
                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                                    Didn't receive the email? <button onClick={() => setSubmitted(false)} className="text-white hover:underline transition-all">Try again</button>
                                </p>
                            </div>
                        ) : (
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 text-red-500 text-xs">
                                        <AlertCircle size={14} />
                                        {error}
                                    </div>
                                )}
                                <div>
                                    <label htmlFor="email" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                                        Email address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-4 w-4 text-zinc-600" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="block w-full pl-10 pr-4 py-3 bg-black border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-700 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                                            placeholder="name@gmail.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading || !email}
                                        className="w-full flex justify-center py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-widest text-black bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                Send Verification Code
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                </div>


                                <div className="text-center pt-2">
                                    <Link to="/login" className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-all">
                                        Back to Sign in
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Visual Accent */}
                <div className="mt-8 text-center">
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] animate-pulse">
                        Secured by Intelligence Node
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
