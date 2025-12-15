import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Bell, Lock } from 'lucide-react';

const Profile = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-white">User Profile</h1>

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-lg">
                <div className="h-32 bg-gradient-to-r from-zinc-800 to-zinc-900"></div>
                <div className="px-8 pb-8">
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="flex items-end">
                            <div className="h-24 w-24 rounded-full bg-zinc-800 border-4 border-black flex items-center justify-center text-zinc-400">
                                <User size={40} />
                            </div>
                            <div className="ml-4 mb-1">
                                <h2 className="text-xl font-bold text-white">Admin User</h2>
                                <p className="text-sm text-zinc-400">Supervisor Role</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors">
                            Edit Profile
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Contact Information</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center text-zinc-300">
                                        <Mail size={18} className="mr-3 text-zinc-500" />
                                        <span>admin@example.com</span>
                                    </div>
                                    <div className="flex items-center text-zinc-300">
                                        <Shield size={18} className="mr-3 text-zinc-500" />
                                        <span>Administrator Access</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">Security</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                                        <div className="flex items-center text-zinc-300">
                                            <Lock size={18} className="mr-3 text-zinc-500" />
                                            <span>Password</span>
                                        </div>
                                        <button className="text-sm text-blue-400 hover:text-blue-300">Change</button>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                                        <div className="flex items-center text-zinc-300">
                                            <Shield size={18} className="mr-3 text-zinc-500" />
                                            <span>2FA Authentication</span>
                                        </div>
                                        <button className="text-sm text-blue-400 hover:text-blue-300">Enable</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
