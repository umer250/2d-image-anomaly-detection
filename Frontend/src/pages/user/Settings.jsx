import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Moon, Globe, Shield, Smartphone, Mail } from 'lucide-react';

const Settings = () => {
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    const [emailAlerts, setEmailAlerts] = useState(true);

    const Toggle = ({ checked, onChange }) => (
        <button
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-zinc-700'}`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-white">Settings</h1>

            <div className="space-y-6">
                {/* Notifications Section */}
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                    <div className="flex items-center mb-6">
                        <Bell className="text-blue-500 mr-3" size={24} />
                        <h2 className="text-lg font-bold text-white">Notifications</h2>
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">Push Notifications</p>
                                <p className="text-sm text-zinc-400">Receive alerts on your device</p>
                            </div>
                            <Toggle checked={notifications} onChange={setNotifications} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">Email Alerts</p>
                                <p className="text-sm text-zinc-400">Receive daily summary emails</p>
                            </div>
                            <Toggle checked={emailAlerts} onChange={setEmailAlerts} />
                        </div>
                    </div>
                </div>

                {/* Appearance Section */}
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                    <div className="flex items-center mb-6">
                        <Moon className="text-purple-500 mr-3" size={24} />
                        <h2 className="text-lg font-bold text-white">Appearance</h2>
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">Dark Mode</p>
                                <p className="text-sm text-zinc-400">Use dark theme across the application</p>
                            </div>
                            <Toggle checked={darkMode} onChange={setDarkMode} />
                        </div>
                    </div>
                </div>

                {/* System Section */}
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                    <div className="flex items-center mb-6">
                        <Globe className="text-green-500 mr-3" size={24} />
                        <h2 className="text-lg font-bold text-white">System</h2>
                    </div>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-white font-medium">Language</p>
                                <p className="text-sm text-zinc-400">English (US)</p>
                            </div>
                            <button className="text-sm text-blue-400 hover:text-blue-300">Change</button>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-white font-medium">Time Zone</p>
                                <p className="text-sm text-zinc-400">UTC-05:00 (Eastern Time)</p>
                            </div>
                            <button className="text-sm text-blue-400 hover:text-blue-300">Change</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
