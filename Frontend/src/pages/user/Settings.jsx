import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    User,
    Lock,
    Bell,
    Save,
    Shield,
    Camera,
    Mail,
    CheckCircle,
    AlertCircle,
    Eye,
    EyeOff,
    Key
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';
import clsx from 'clsx';

const SectionCard = ({ children, className }) => (
    <div className={clsx("bg-zinc-900 border border-white/5 rounded-xl p-6 shadow-xl", className)}>
        {children}
    </div>
);

const Settings = () => {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [isVerified, setIsVerified] = useState(false);

    // Profile State
    const [profileData, setProfileData] = useState({
        full_name: user?.full_name || '',
        avatar_url: user?.avatar_url || ''
    });

    // Password State
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const [strength, setStrength] = useState({ score: 0, label: 'Weak', color: 'bg-zinc-800' });

    const calculateStrength = (pass) => {
        let score = 0;
        if (!pass) return;
        if (pass.length > 8) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;

        const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Unstoppable'];
        const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500'];

        setStrength({
            score,
            label: labels[score] || 'Weak',
            color: colors[score] || 'bg-zinc-800'
        });
    };

    useEffect(() => {
        calculateStrength(passwordData.new_password);
    }, [passwordData.new_password]);

    const handleVerify = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            if (!passwordData.current_password) {
                throw new Error("Enter your current password first");
            }
            await userAPI.verifyPassword(passwordData.current_password);
            setIsVerified(true);
            setMessage({ type: 'success', text: 'Identity verified. You can now set a new password.' });
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Verification failed' });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    };

    const handleSave = async (section) => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            if (section === 'profile') {
                if (!profileData.full_name.trim()) {
                    throw new Error("Full name is required");
                }
                await userAPI.updateProfile(profileData.full_name, profileData.avatar_url);
                await updateUser();
                setMessage({ type: 'success', text: 'Profile updated successfully.' });
            } else if (section === 'security') {
                if (!isVerified) {
                    throw new Error("Please verify your current password first");
                }
                if (passwordData.new_password !== passwordData.confirm_password) {
                    throw new Error("Passwords do not match");
                }
                if (strength.score < 2) {
                    throw new Error("New password is not strong enough");
                }
                await userAPI.changePassword(
                    passwordData.current_password,
                    passwordData.new_password
                );
                setMessage({ type: 'success', text: 'Password updated successfully.' });
                setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                setIsVerified(false);
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message || `Failed to update ${section}.` });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic validation
        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image must be less than 2MB' });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setProfileData({ ...profileData, avatar_url: reader.result });
        };
        reader.readAsDataURL(file);
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
    ];

    return (
        <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 pb-12 min-h-[600px]">
            {/* Left Nav */}
            <div className="w-full lg:w-64 space-y-2">
                <div className="mb-6 px-4">
                    <h1 className="text-xl font-bold text-white tracking-tight">Settings</h1>
                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">Personal Preferences</p>
                </div>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group",
                            activeTab === tab.id
                                ? "bg-white text-black shadow-lg shadow-white/10"
                                : "text-zinc-500 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <tab.icon size={18} className={clsx(activeTab === tab.id ? "text-black" : "text-zinc-500 group-hover:text-white")} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div className="flex-1 max-w-3xl">
                {message.text && (
                    <div className={clsx(
                        "mb-6 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2",
                        message.type === 'success' ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-500"
                    )}>
                        {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        <span className="text-xs font-bold uppercase tracking-tight">{message.text}</span>
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="mb-8 px-1">
                            <h2 className="text-lg font-bold text-white tracking-tight">Profile Information</h2>
                            <p className="text-zinc-500 text-xs mt-1">Update your presence on the monitoring platform.</p>
                        </div>

                        <SectionCard>
                            <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
                                <div className="relative group mx-auto md:mx-0">
                                    <div className="w-24 h-24 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner">
                                        {profileData.avatar_url ? (
                                            <img src={profileData.avatar_url} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                        ) : (
                                            <User size={40} className="text-zinc-600" />
                                        )}
                                    </div>
                                    <label className="absolute -bottom-2 -right-2 p-2 bg-white rounded-lg text-black shadow-xl hover:scale-110 transition-all border border-black/10 cursor-pointer active:scale-95">
                                        <Camera size={14} />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                    </label>
                                </div>
                                <div className="flex-1 space-y-4 w-full">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Full Name</label>
                                            <input
                                                type="text"
                                                value={profileData.full_name}
                                                onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                                                className="w-full bg-black border border-zinc-800 rounded-lg py-2 px-4 shadow-inner text-sm text-white focus:border-white/20 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Operator Role</label>
                                            <div className="w-full bg-zinc-800/30 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-zinc-500 font-mono">
                                                {user?.role?.toUpperCase() || 'USER'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Registered Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                                            <input
                                                type="email"
                                                defaultValue={user?.email}
                                                disabled
                                                className="w-full bg-black border border-zinc-800 rounded-lg py-2 pl-10 pr-4 shadow-inner text-sm text-zinc-600 cursor-not-allowed italic"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-white/5 flex justify-end">
                                <button
                                    onClick={() => handleSave('profile')}
                                    disabled={loading}
                                    className="bg-white text-black px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-tight flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    <Save size={14} /> {loading ? 'Saving...' : 'Save Profile'}
                                </button>
                            </div>
                        </SectionCard>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="mb-8 px-1">
                            <h2 className="text-lg font-bold text-white tracking-tight">Access Control</h2>
                            <p className="text-zinc-500 text-xs mt-1">Manage your credentials and encryption barriers.</p>
                        </div>

                        <SectionCard>
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Key size={14} className="text-blue-500" /> Update Password
                            </h3>

                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Current Password</label>
                                        <Link to="/forgot-password" size={14} className="text-[10px] font-bold uppercase text-zinc-600 hover:text-white transition-all">Forgot?</Link>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.current ? "text" : "password"}
                                            value={passwordData.current_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                            placeholder="••••••••"
                                            disabled={isVerified}
                                            className={clsx(
                                                "w-full bg-black border border-zinc-800 rounded-lg py-2 px-4 pr-10 text-sm focus:border-white/20 outline-none",
                                                isVerified ? "text-zinc-500 cursor-not-allowed opacity-50" : "text-white"
                                            )}
                                        />
                                        {!isVerified && (
                                            <button
                                                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                                            >
                                                {showPasswords.current ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        )}
                                        {isVerified && (
                                            <CheckCircle size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                                        )}
                                    </div>
                                </div>

                                {!isVerified ? (
                                    <div className="pt-2">
                                        <button
                                            onClick={handleVerify}
                                            disabled={loading || !passwordData.current_password}
                                            className="w-full bg-white text-black py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {loading ? 'Verifying...' : 'Verify Identity'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">New Security Key</label>
                                                <div className="relative">
                                                    <input
                                                        type={showPasswords.new ? "text" : "password"}
                                                        value={passwordData.new_password}
                                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                                        placeholder="••••••••"
                                                        className="w-full bg-black border border-zinc-800 rounded-lg py-2 px-4 pr-10 text-sm text-white focus:border-white/20 outline-none"
                                                    />
                                                    <button
                                                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                                                    >
                                                        {showPasswords.new ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Confirm Key</label>
                                                <div className="relative">
                                                    <input
                                                        type={showPasswords.confirm ? "text" : "password"}
                                                        value={passwordData.confirm_password}
                                                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                                        placeholder="••••••••"
                                                        className="w-full bg-black border border-zinc-800 rounded-lg py-2 px-4 pr-10 text-sm text-white focus:border-white/20 outline-none"
                                                    />
                                                    <button
                                                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                                                        type="button"
                                                    >
                                                        {showPasswords.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Strength Meter */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                                <span className="text-zinc-500">Complexity Score</span>
                                                <span className={clsx(strength.score > 2 ? "text-green-500" : "text-zinc-500")}>{strength.label}</span>
                                            </div>
                                            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden flex gap-1">
                                                {[...Array(4)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={clsx(
                                                            "h-full flex-1 transition-all duration-500",
                                                            i < strength.score ? strength.color : "bg-zinc-800"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-6">
                                            <p className="text-[10px] text-zinc-600 font-medium max-w-xs">Use at least 8 characters with mix of symbols and integers for maximum security.</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setIsVerified(false)}
                                                    className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase text-zinc-500 hover:text-white transition-all"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleSave('security')}
                                                    disabled={loading || strength.score < 2}
                                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-tight flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/10 active:scale-95 disabled:opacity-50"
                                                >
                                                    <Lock size={14} /> Update Credentials
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </SectionCard>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;
