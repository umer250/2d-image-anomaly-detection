import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { Link } from 'react-router-dom';

import {
    User,
    Shield,
    Settings as SettingsIcon,
    Users,
    Camera,
    Lock,
    Globe,
    Bell,
    Save,
    Plus,
    RefreshCw,
    Trash2,
    AlertCircle,
    CheckCircle,
    Key,
    Activity,
    History,
    ShieldCheck,
    Mail,
    ChevronRight,
    AlertTriangle,
    Eye,
    EyeOff
} from 'lucide-react';
import { adminAPI, userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

const SectionCard = ({ children, className }) => (
    <div className={clsx("bg-zinc-900 shadow-xl border border-white/5 rounded-xl p-6", className)}>
        {children}
    </div>
);

const AdminSettings = () => {
    const { user, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false });
    const [showRestrictedPassword, setShowRestrictedPassword] = useState(false);
    const [isVerified, setIsVerified] = useState(false);


    // Core States
    const [users, setUsers] = useState([]);
    const [systemConfig, setSystemConfig] = useState({
        confidence_threshold: 0.75,
        auto_delete_days: 30,
        email_notifications: true,
        model_version: 'PatchCore-WideResNet50-v1',
        selected_category: 'bottle',
    });
    // Live thresholds per category from backend
    const [categoryThresholds, setCategoryThresholds] = useState({});
    const [thresholdSaving, setThresholdSaving] = useState(false);

    // Form States
    const [profileData, setProfileData] = useState({
        full_name: user?.full_name || '',
        avatar_url: user?.avatar_url || ''
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const [restrictedModal, setRestrictedModal] = useState({
        isOpen: false,
        type: '', // 'reset' or 'wipe'
        password: ''
    });

    const handleRestrictedAction = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            if (restrictedModal.type === 'reset') {
                await adminAPI.resetSystem(restrictedModal.password);
                setMessage({ type: 'success', text: 'System reset successful. All history and uploads cleared.' });
            } else if (restrictedModal.type === 'wipe') {
                await adminAPI.wipeAllUsers(restrictedModal.password);
                setMessage({ type: 'success', text: 'User wipe successful. All non-admin accounts removed.' });
                fetchUsers();
            }
            setRestrictedModal({ isOpen: false, type: '', password: '' });
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Action failed' });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    };


    const fetchUsers = async () => {
        try {
            const usersData = await adminAPI.getUsers();
            setUsers(usersData);
        } catch (error) {
            console.error("Settings: Error fetching users:", error);
        }
    };

    const fetchSettings = async () => {
        try {
            const [settings, sysParams] = await Promise.all([
                adminAPI.getSettings(),
                adminAPI.getSystemParams().catch(() => null),
            ]);
            setSystemConfig(prev => ({
                ...prev,
                email_notifications: !!settings.notification_enabled,
                model_version: sysParams?.model_version || prev.model_version,
            }));
            if (sysParams?.categories) {
                setCategoryThresholds(sysParams.categories);
                // Set initial slider to bottle threshold if available
                const bottleThresh = sysParams.categories?.bottle?.threshold;
                if (bottleThresh) {
                    setSystemConfig(prev => ({ ...prev, confidence_threshold: bottleThresh }));
                }
            }
        } catch (error) {
            console.error("Settings: Error fetching initial settings:", error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchSettings();
    }, []);


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
                    throw new Error("New passwords do not match");
                }
                if (passwordData.new_password.length < 8) {
                    throw new Error("New password must be at least 8 characters");
                }
                await userAPI.changePassword(passwordData.current_password, passwordData.new_password);
                setMessage({ type: 'success', text: 'Password updated successfully.' });
                setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                setIsVerified(false);
            } else if (section === 'system settings') {
                // Save notification setting
                await adminAPI.updateSettings({
                    notification_enabled: systemConfig.email_notifications ? 1 : 0
                });
                // Save threshold to live model
                await adminAPI.updateSystemParams({
                    category: systemConfig.selected_category,
                    threshold: systemConfig.confidence_threshold,
                    notification_enabled: systemConfig.email_notifications ? 1 : 0,
                });
                // Refresh thresholds display
                const sysParams = await adminAPI.getSystemParams().catch(() => null);
                if (sysParams?.categories) setCategoryThresholds(sysParams.categories);
                setMessage({ type: 'success', text: `Threshold for "${systemConfig.selected_category}" updated to ${(systemConfig.confidence_threshold * 100).toFixed(1)}%. Changes are live.` });
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

    const handleRoleChange = async (userId, newRole) => {
        try {
            await adminAPI.updateUser(userId, { role: newRole });
            setMessage({ type: 'success', text: 'User role updated.' });
            fetchUsers();
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update role.' });
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this operator?")) return;
        try {
            await adminAPI.deleteUser(userId);
            setMessage({ type: 'success', text: 'Operator purged from system.' });
            fetchUsers();
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to delete user.' });
        }
    };

    const handleResetPassword = async (userId) => {
        const newPassword = window.prompt("Enter new password for this user:");
        if (!newPassword) return;
        try {
            await adminAPI.updateUser(userId, { password: newPassword });
            setMessage({ type: 'success', text: 'User password reset successfully.' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to reset password.' });
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'system', label: 'System', icon: SettingsIcon },
        { id: 'users', label: 'Users', icon: Users },
    ];

    const renderHeader = (title, subtitle) => (
        <div className="mb-8 px-1">
            <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
            <p className="text-zinc-500 text-xs mt-1">{subtitle}</p>
        </div>
    );

    return (
        <>
        <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 pb-12">
            {/* Side Navigation */}
            <div className="w-full lg:w-64 space-y-2">
                <div className="mb-6 px-4">
                    <h1 className="text-xl font-bold text-white tracking-tight font-outfit">Settings</h1>
                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1 font-sans">Management Suite</p>
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

            {/* Content Area */}
            <div className="flex-1 max-w-4xl min-h-[600px]">
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
                        {renderHeader("Profile Information", "Manage your personal presence and administrative identifiers.")}
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
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
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
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Account ID</label>
                                        <div className="w-full bg-zinc-800/30 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-zinc-500 italic">#{user?.id || '00214'}</div>
                                    </div>
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                                            <input
                                                type="email"
                                                defaultValue={user?.email}
                                                disabled
                                                className="w-full bg-black border border-zinc-800 rounded-lg py-2 pl-10 pr-4 shadow-inner text-sm text-zinc-600 italic cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[10px] text-blue-500 font-bold uppercase tracking-widest">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                    Role: {user?.role || 'Administrator'}
                                </div>
                                <button onClick={() => handleSave('profile')} disabled={loading} className="bg-white text-black px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-tight flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                    <Save size={14} /> {loading ? 'Saving...' : 'Save Profile'}
                                </button>
                            </div>
                        </SectionCard>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        {renderHeader("Security & Access", "Manage your credentials and monitor active infrastructure sessions.")}

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
                                            <button onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
                                                {showPasswords.current ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        )}
                                        {isVerified && (
                                            <CheckCircle size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                                        )}
                                    </div>
                                </div>

                                {!isVerified ? (
                                    <div className="pt-2 text-right">
                                        <button
                                            onClick={handleVerify}
                                            disabled={loading || !passwordData.current_password}
                                            className="bg-white text-black px-8 py-2 rounded-lg text-xs font-bold uppercase tracking-tight flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-lg active:scale-95 disabled:opacity-50 ml-auto"
                                        >
                                            {loading ? 'Verifying...' : 'Verify Identity'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">New Password</label>
                                                <div className="relative">
                                                    <input
                                                        type={showPasswords.new ? "text" : "password"}
                                                        value={passwordData.new_password}
                                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                                        placeholder="••••••••"
                                                        className="w-full bg-black border border-zinc-800 rounded-lg py-2 px-4 pr-10 text-sm text-white focus:border-white/20 outline-none"
                                                    />
                                                    <button onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
                                                        {showPasswords.new ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Confirm New</label>
                                                <div className="relative">
                                                    <input
                                                        type={showPasswords.new ? "text" : "password"}
                                                        value={passwordData.confirm_password}
                                                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                                        placeholder="••••••••"
                                                        className="w-full bg-black border border-zinc-800 rounded-lg py-2 px-4 pr-10 text-sm text-white focus:border-white/20 outline-none"
                                                    />
                                                    <button onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
                                                        {showPasswords.new ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                            </div>

                                        </div>
                                        <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                            <p className="text-[10px] text-zinc-500 font-medium">Use 8+ characters for maximum protection.</p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setIsVerified(false)}
                                                    className="text-[10px] font-bold uppercase text-zinc-500 hover:text-white transition-all"
                                                >
                                                    Cancel
                                                </button>
                                                <button onClick={() => handleSave('security')} disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-tight flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                                    <Lock size={14} /> Update Credentials
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </SectionCard>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SectionCard>
                                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2 font-mono">
                                    <History size={14} className="text-zinc-600" /> Admin Logs
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">Account Created</div>
                                        <div className="text-xs font-mono text-white">
                                            {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">Registration Time</div>
                                        <div className="text-xs font-mono text-white">
                                            {user?.created_at ? new Date(user.created_at).toLocaleTimeString() : 'N/A'}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">Status</div>
                                        <div className="text-xs font-mono text-green-400 tracking-widest uppercase">Validated</div>
                                    </div>
                                </div>
                            </SectionCard>
                            <SectionCard>
                                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-blue-500" /> Infrastructure Access
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">Last Activity</div>
                                        <div className="text-xs font-mono text-white">Just Now</div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">IP Address</div>
                                        <div className="text-xs font-mono text-white tracking-widest">192.168.1.1</div>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                    </div>
                )}

                {activeTab === 'system' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        {renderHeader("System Parameters", "Live inference threshold and automation policies — changes apply immediately to all new predictions.")}

                        <SectionCard>
                            <div className="space-y-8">

                                {/* Category selector */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-sans block">Model Category</label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.keys(categoryThresholds).length > 0
                                            ? Object.keys(categoryThresholds).map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => {
                                                        setSystemConfig(prev => ({
                                                            ...prev,
                                                            selected_category: cat,
                                                            confidence_threshold: categoryThresholds[cat]?.threshold ?? prev.confidence_threshold,
                                                        }));
                                                    }}
                                                    className={clsx(
                                                        'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all font-sans',
                                                        systemConfig.selected_category === cat
                                                            ? 'bg-indigo-600 border-indigo-500 text-white'
                                                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                                                    )}
                                                >
                                                    {cat}
                                                </button>
                                            ))
                                            : (
                                                <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-indigo-600 border-indigo-500 text-white font-sans">
                                                    bottle
                                                </button>
                                            )
                                        }
                                    </div>
                                </div>

                                {/* Threshold slider */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2">
                                            <Shield size={16} className="text-indigo-400" />
                                            <span className="text-xs font-bold text-white uppercase tracking-tight font-sans">
                                                Anomaly Threshold — <span className="text-indigo-400">{systemConfig.selected_category}</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-outfit font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20">
                                                {(systemConfig.confidence_threshold * 100).toFixed(1)}%
                                            </span>
                                            {/* Direct number input */}
                                            <input
                                                type="number"
                                                min="0.01" max="0.99" step="0.01"
                                                value={systemConfig.confidence_threshold.toFixed(4)}
                                                onChange={(e) => {
                                                    const v = parseFloat(e.target.value);
                                                    if (!isNaN(v) && v > 0 && v < 1) {
                                                        setSystemConfig(prev => ({ ...prev, confidence_threshold: v }));
                                                    }
                                                }}
                                                className="w-24 bg-black border border-zinc-800 rounded-lg py-1 px-2 text-xs text-white font-mono focus:border-indigo-500/50 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="1" max="99" step="1"
                                        value={Math.round(systemConfig.confidence_threshold * 100)}
                                        onChange={(e) => setSystemConfig(prev => ({ ...prev, confidence_threshold: e.target.value / 100 }))}
                                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                    <div className="flex justify-between text-[9px] text-zinc-600 font-bold uppercase mt-2 font-sans">
                                        <span>Lenient (1%)</span>
                                        <span className="text-indigo-500">Current: {(systemConfig.confidence_threshold * 100).toFixed(1)}%</span>
                                        <span>Strict (99%)</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 mt-3 leading-relaxed font-sans">
                                        Formula: <code className="text-indigo-400 font-mono">score &gt; threshold → Anomaly</code>.
                                        Higher threshold = fewer anomaly flags (more lenient). Lower = more sensitive.
                                        Current model trained threshold: <span className="text-zinc-300 font-mono">
                                            {categoryThresholds[systemConfig.selected_category]?.threshold
                                                ? (categoryThresholds[systemConfig.selected_category].threshold * 100).toFixed(2) + '%'
                                                : '75.44%'}
                                        </span>
                                    </p>
                                </div>

                                {/* Live threshold table */}
                                {Object.keys(categoryThresholds).length > 0 && (
                                    <div className="bg-black/40 rounded-xl border border-zinc-800 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-zinc-800">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-sans">Live Thresholds per Category</p>
                                        </div>
                                        <div className="divide-y divide-zinc-800/50">
                                            {Object.entries(categoryThresholds).map(([cat, info]) => (
                                                <div key={cat} className="flex items-center justify-between px-4 py-2.5">
                                                    <span className="text-xs font-semibold text-zinc-300 font-sans capitalize">{cat}</span>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(info.threshold * 100).toFixed(0)}%` }} />
                                                        </div>
                                                        <span className="text-xs font-bold text-indigo-400 font-outfit w-14 text-right">
                                                            {(info.threshold * 100).toFixed(2)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Notifications toggle */}
                                <div className="flex items-center justify-between p-5 bg-black rounded-xl border border-white/5 shadow-inner">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400"><Bell size={20} /></div>
                                        <div>
                                            <p className="text-xs font-bold text-white uppercase tracking-tight font-sans">Critical Notifications</p>
                                            <p className="text-[10px] text-zinc-500 mt-0.5 font-sans">Automated dispatch of high-risk anomaly alerts.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={systemConfig.email_notifications}
                                            onChange={() => setSystemConfig(prev => ({ ...prev, email_notifications: !prev.email_notifications }))}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                                    </label>
                                </div>

                                {/* Model info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-sans block">Model Version</label>
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1.5 bg-zinc-800 text-zinc-200 text-[10px] font-mono rounded-lg border border-white/5">{systemConfig.model_version}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-sans block">Log Retention</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={systemConfig.auto_delete_days}
                                                onChange={(e) => setSystemConfig(prev => ({ ...prev, auto_delete_days: e.target.value }))}
                                                className="w-20 bg-black border border-zinc-800 rounded-lg py-1.5 px-3 text-sm text-white font-sans focus:border-indigo-500/50 outline-none"
                                            />
                                            <span className="text-xs text-zinc-500 font-sans">days</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                                <p className="text-[10px] text-zinc-500 font-sans">Changes to threshold apply immediately to all new predictions.</p>
                                <button
                                    onClick={() => handleSave('system settings')}
                                    disabled={loading}
                                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-tight flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-xl active:scale-95 disabled:opacity-50 font-sans"
                                >
                                    <Save size={14} /> {loading ? 'Deploying...' : 'Deploy Configuration'}
                                </button>
                            </div>
                        </SectionCard>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-1">
                            <div>
                                <h2 className="text-lg font-bold text-white tracking-tight">User Infrastructure</h2>
                                <p className="text-zinc-500 text-xs mt-1">Manage operator permissions and access layers.</p>
                            </div>
                            <button className="bg-blue-600 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-tight flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/10 active:scale-95">
                                <Plus size={16} /> Add Operator
                            </button>
                        </div>

                        <SectionCard className="p-0 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-zinc-800/20 border-b border-white/5">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest outline-none">S.No</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest outline-none">Identity</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest outline-none">Permission Layer</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest outline-none text-right">Operations</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-white/5">
                                        {users.filter(u => u.role === 'admin').map((u, index) => (
                                            <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4 text-[10px] font-mono text-zinc-500">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 border border-white/5 group-hover:border-white/10 transition-colors uppercase">
                                                            {u.full_name?.charAt(0) || u.email?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-xs font-bold text-white uppercase tracking-tight">{u.full_name || 'Anonymous User'}</p>
                                                                <span className="text-[9px] text-zinc-600 font-mono">#{u.id}</span>
                                                            </div>
                                                            <p className="text-[10px] text-zinc-500 lowercase font-mono">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={u.role}
                                                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                        disabled={u.email === user?.email}
                                                        className="bg-black border border-zinc-800 rounded-lg py-1 px-3 text-[10px] font-bold uppercase text-blue-400 outline-none focus:border-white/20 transition-all cursor-pointer disabled:opacity-50"
                                                    >
                                                        <option value="admin">System Admin</option>
                                                        <option value="user">Viewer Access</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleResetPassword(u.id)}
                                                            title="Reset Password"
                                                            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all outline-none"
                                                        >
                                                            <Key size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(u.id)}
                                                            disabled={u.email === user?.email}
                                                            title="Purge User"
                                                            className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-all disabled:opacity-0 outline-none"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-6 border-t border-white/5 flex items-center justify-between">
                                <p className="text-[9px] text-zinc-500 font-medium uppercase tracking-tight">Active Infrastructure Operators: {users.filter(u => u.role === 'admin').length}</p>
                                <button className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-all">
                                    View All Activity
                                    <ChevronRight size={14} className="text-zinc-700" />
                                </button>
                            </div>

                        </SectionCard>
                    </div>
                )}
            </div>

            {/* Restricted Zone Warning & Buttons */}
            <div className="w-full lg:w-64 space-y-4">
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle size={16} className="text-red-500" />
                        <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest font-sans">Restricted Zone</h3>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed mb-6 font-sans">
                        Destructive actions. Database records are preserved (soft operations).
                    </p>
                    <div className="space-y-2">
                        <button
                            onClick={() => setRestrictedModal({ isOpen: true, type: 'wipe', password: '' })}
                            className="w-full flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider font-sans"
                        >
                            <Trash2 size={14} /> Deactivate All Users
                        </button>
                        <button
                            onClick={() => setRestrictedModal({ isOpen: true, type: 'reset', password: '' })}
                            className="w-full flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider font-sans"
                        >
                            <RefreshCw size={14} /> Clear Upload Files
                        </button>
                    </div>
                    <p className="text-[9px] text-zinc-600 mt-4 leading-relaxed font-sans">
                        "Clear Upload Files" removes physical files from disk only — DB records stay intact.<br />
                        "Deactivate All Users" sets is_active=false for non-admin users — accounts preserved in DB.
                    </p>
                </div>
            </div>
        </div>

        {/* Restricted Action Modal — rendered via portal at document.body so React's
            reconciler never confuses its DOM parent with the flex layout above */}
        {restrictedModal.isOpen && createPortal((
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">

                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white tracking-tight">System Security Clearance</h3>
                                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Administrative Authentication Required</p>
                            </div>
                        </div>

                        <p className="text-sm text-zinc-400 leading-relaxed mb-8">
                            You are about to perform a <span className="text-red-500 font-bold uppercase tracking-tighter">
                                {restrictedModal.type === 'reset' ? 'System File Reset' : 'User Deactivation'}
                            </span>.{' '}
                            {restrictedModal.type === 'reset'
                                ? 'All uploaded files will be removed from disk. Database records are preserved.'
                                : 'All non-admin users will be deactivated (soft delete). Database records are preserved.'
                            }
                        </p>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Database Security Key</label>
                                <div className="relative">
                                    <input
                                        type={showRestrictedPassword ? "text" : "password"}
                                        value={restrictedModal.password}
                                        onChange={(e) => setRestrictedModal({ ...restrictedModal, password: e.target.value })}
                                        className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 pr-10 text-sm text-white focus:border-red-500/50 outline-none transition-all placeholder:text-zinc-800"
                                        placeholder="Enter system access code..."
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => setShowRestrictedPassword(!showRestrictedPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-red-900/40 hover:text-red-500 transition-colors"
                                    >
                                        {showRestrictedPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>


                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setRestrictedModal({ isOpen: false, type: '', password: '' })}
                                    className="flex-1 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-500 hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRestrictedAction}
                                    disabled={loading || !restrictedModal.password}
                                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-500 transition-all shadow-xl shadow-red-500/20 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : 'Execute Action'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
        ), document.body)}
    </>
    );
};

export default AdminSettings;

