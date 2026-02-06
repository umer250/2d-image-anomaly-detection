import { useState } from 'react';
import { Settings as SettingsIcon, Lock, Bell, User, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';

const Settings = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Profile State
    const [profileData, setProfileData] = useState({
        full_name: user?.full_name || '',
    });

    // Password State
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await userAPI.updateProfile(profileData);
            await updateUser(); // Refresh context
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (passwordData.new_password !== passwordData.confirm_password) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (passwordData.new_password.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setLoading(true);
        try {
            await userAPI.changePassword({
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-12">
            <h1 className="text-2xl font-bold text-white flex items-center">
                <SettingsIcon className="mr-3 text-zinc-400" />
                Account Settings
            </h1>

            {message.text && (
                <div className={`p-4 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="mr-2" size={20} /> : <AlertCircle className="mr-2" size={20} />}
                    {message.text}
                </div>
            )}

            <div className="space-y-8">
                {/* Profile Section */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                        <User className="mr-2 text-blue-500" size={18} />
                        Profile Details
                    </h3>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={profileData.full_name}
                                onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Email Address</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-500 cursor-not-allowed"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                <Save size={16} className="mr-2" />
                                Save Changes
                            </button>
                        </div>
                    </form>
                </section>

                {/* Security Section */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                        <Lock className="mr-2 text-green-500" size={18} />
                        Security & Password
                    </h3>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Current Password</label>
                            <input
                                type="password"
                                value={passwordData.current_password}
                                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.new_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.confirm_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={loading || !passwordData.current_password || !passwordData.new_password}
                                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Lock size={16} className="mr-2" />
                                Update Password
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    );
};

export default Settings;
