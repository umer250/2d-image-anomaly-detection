import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Scan, Lock } from 'lucide-react';

import { authAPI } from '../../services/api';

const VerifyOTP = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [timer, setTimer] = useState(300); // 5 minutes

    useEffect(() => {
        if (!email) {
            navigate('/forgot-password');
            return;
        }

        const interval = setInterval(() => {
            setTimer(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(interval);
    }, [email, navigate]);

    const handleChange = (index, value) => {
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Move to next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpCode = otp.join('');
        if (otpCode.length < 6) {
            setError('Please enter the full 6-digit code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await authAPI.verifyOTP(email, otpCode);
            navigate('/reset-password', { state: { email, token: otpCode } });
        } catch (err) {
            setError(err.message || 'Invalid or expired OTP');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                <ShieldCheck size={800} className="text-white" />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center">
                        <Lock className="text-black" size={24} />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    Identity Verification
                </h2>
                <p className="mt-2 text-center text-sm text-zinc-400">
                    Enter the code sent to <span className="text-white font-medium">{email}</span>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div
                    className="bg-zinc-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-zinc-800 animate-in fade-in slide-in-from-bottom-2 duration-500"
                >

                    <form className="space-y-8" onSubmit={handleSubmit}>
                        <div className="flex justify-between gap-2">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`otp-${index}`}
                                    type="text"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-14 bg-black border border-zinc-800 rounded-xl text-center text-xl font-bold text-white focus:border-white outline-none transition-all"
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-900/20 border border-red-900 p-3 text-center">
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}

                        <div className="text-center">
                            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
                                Code expires in: <span className={timer < 60 ? "text-red-500" : "text-zinc-300"}>{formatTime(timer)}</span>
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || timer === 0}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-xs font-bold uppercase tracking-widest text-black bg-white hover:bg-zinc-200 focus:outline-none disabled:opacity-50 transition-all"
                        >
                            {loading ? 'Verifying...' : 'Validate Code'}
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => navigate('/forgot-password')}
                                className="text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
                            >
                                Request new code
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VerifyOTP;
