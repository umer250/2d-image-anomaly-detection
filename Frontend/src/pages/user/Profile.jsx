import React from 'react';
import { User, Mail, Shield, Calendar, Edit2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
    const { user } = useAuth();

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-white">Your Profile</h1>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <div className="px-8 pb-8">
                    <div className="relative -mt-12 mb-6 text-center md:text-left">
                        <div className="mx-auto md:mx-0 h-24 w-24 rounded-2xl bg-zinc-800 border-4 border-zinc-900 flex items-center justify-center text-3xl font-bold text-white shadow-xl overflow-hidden">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                user?.full_name?.charAt(0) || 'U'
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Full Name</label>
                                <div className="flex items-center text-white bg-black/30 p-3 rounded-lg border border-zinc-800">
                                    <User size={18} className="mr-3 text-zinc-500" />
                                    {user?.full_name || 'Not set'}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Email Address</label>
                                <div className="flex items-center text-white bg-black/30 p-3 rounded-lg border border-zinc-800">
                                    <Mail size={18} className="mr-3 text-zinc-500" />
                                    {user?.email}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Account Role</label>
                                <div className="flex items-center text-white bg-black/30 p-3 rounded-lg border border-zinc-800">
                                    <Shield size={18} className="mr-3 text-zinc-500" />
                                    <span className="capitalize">{user?.role}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Member Since</label>
                                <div className="flex items-center text-white bg-black/30 p-3 rounded-lg border border-zinc-800">
                                    <Calendar size={18} className="mr-3 text-zinc-500" />
                                    {user?.created_at ? (
                                        new Date(user.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })
                                    ) : 'Analysis Pending'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-zinc-800 flex justify-end">
                        <button
                            onClick={() => window.location.href = '/settings'}
                            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <Edit2 size={16} className="mr-2" />
                            Edit Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
