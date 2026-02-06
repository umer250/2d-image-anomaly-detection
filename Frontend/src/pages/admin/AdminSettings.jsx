import React from 'react';
import { Settings as SettingsIcon, Server, Database, ShieldAlert } from 'lucide-react';

const AdminSettings = () => {
    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-white flex items-center">
                <SettingsIcon className="mr-3 text-red-500" />
                System Settings
            </h1>

            <div className="space-y-6">
                <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                        <Server className="mr-2 text-zinc-400" size={18} />
                        Model Configuration
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-300">Default Model</span>
                            <select className="bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white">
                                <option>ResNet-50</option>
                                <option>EfficientNet-B4</option>
                            </select>
                        </div>
                    </div>
                </section>

                <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                        <ShieldAlert className="mr-2 text-red-500" size={18} />
                        Danger Zone
                    </h3>
                    <button className="w-full py-2 bg-red-600/10 border border-red-600/20 text-red-500 text-sm font-bold rounded-lg hover:bg-red-600/20 transition-colors">
                        Clear System Cache
                    </button>
                </section>
            </div>
        </div>
    );
};

export default AdminSettings;
