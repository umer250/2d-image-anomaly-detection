import React from 'react';
import { Scan, Shield, Activity, Target, Zap } from 'lucide-react';

const About = () => {
    return (
        <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-white tracking-tight">About AnomalyDetect</h1>
                    <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                        A state-of-the-art 2D Image Anomaly Detection system designed for quality control and industrial precision.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl">
                        <Zap className="text-yellow-500 mb-4" size={32} />
                        <h3 className="text-xl font-bold text-white mb-2">Our Mission</h3>
                        <p className="text-zinc-400 leading-relaxed">
                            To provide accessible, high-performance anomaly detection tools that empower manufacturers and researchers to maintain the highest standards of quality through AI-driven insights.
                        </p>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl">
                        <Target className="text-blue-500 mb-4" size={32} />
                        <h3 className="text-xl font-bold text-white mb-2">The Technology</h3>
                        <p className="text-zinc-400 leading-relaxed">
                            Built on advanced Computer Vision models, AnomalyDetect processes 2D images in real-time to identify surface defects, structural deviations, and texture anomalies with high confidence.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">Core Capabilities</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            { icon: Scan, title: "Precision Scanning", desc: "Pixel-perfect analysis of every image." },
                            { icon: Shield, title: "Secure Data", desc: "Enterprise-grade encryption and RBAC." },
                            { icon: Activity, title: "Live Insights", desc: "Immediate heatmaps and anomaly scores." }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center text-center p-6 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors">
                                <item.icon className="text-blue-400 mb-3" size={24} />
                                <h4 className="font-bold text-white mb-1">{item.title}</h4>
                                <p className="text-xs text-zinc-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
