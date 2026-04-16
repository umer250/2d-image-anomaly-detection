import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, BarChart3, ArrowRight, Cpu, Eye, Layers } from 'lucide-react';
import AppLogo from '../../components/icons/AppLogo';

const Landing = () => {
    return (
        <div className="min-h-screen bg-black">
            {/* Navbar */}
            <header className="border-b border-zinc-800 bg-black/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <AppLogo size={36} color="#6366f1" showText={true} textSize={16} />
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm text-zinc-400 hover:text-white transition-colors font-medium">Sign In</Link>
                        <Link to="/register" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-indigo-900/30">
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="relative overflow-hidden bg-black pt-20 pb-24 lg:pt-32 lg:pb-32">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold mb-6 border border-indigo-500/20 uppercase tracking-widest">
                            <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse" />
                            Final Year Project — Batch 2022–2026
                        </div>
                        <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold text-white tracking-tight leading-tight">
                            2D Image<br />
                            <span className="text-indigo-500">Anomaly Detection</span>
                        </h1>
                        <p className="mt-5 text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                            Industrial-grade surface defect detection powered by <strong className="text-white">PatchCore</strong> with a <strong className="text-white">WideResNet-50</strong> backbone.
                            Upload a bottle image and get instant anomaly heatmaps, confidence scores, and defect contours — trained on the <strong className="text-white">MVTec AD</strong> benchmark dataset.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-4 justify-center">
                            <Link to="/login" className="inline-flex items-center px-8 py-3.5 bg-white text-black font-bold rounded-xl hover:bg-zinc-100 transition-all shadow-xl text-sm">
                                Start Inspecting
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                            <Link to="/about" className="inline-flex items-center px-8 py-3.5 border border-zinc-700 text-zinc-300 font-semibold rounded-xl hover:border-zinc-500 hover:text-white transition-all text-sm">
                                Learn More
                            </Link>
                        </div>

                        {/* Stats row */}
                        <div className="mt-12 grid grid-cols-3 gap-6 border-t border-zinc-800 pt-8 max-w-lg mx-auto">
                            {[
                                { label: 'Image AUROC', value: '99.84%' },
                                { label: 'Pixel AUROC', value: '98.17%' },
                                { label: 'Model', value: 'PatchCore' },
                            ].map((s) => (
                                <div key={s.label}>
                                    <p className="text-2xl font-black text-white">{s.value}</p>
                                    <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-widest font-semibold">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 bg-black border-t border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">How It Works</p>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Precision Defect Detection Pipeline</h2>
                        <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">
                            Trained on the MVTec AD benchmark dataset using PatchCore with WideResNet-50 backbone.
                            Detects surface cracks, contamination, and structural deformations on bottle images with 99.84% Image AUROC.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: Layers,
                                color: 'text-indigo-400',
                                bg: 'bg-indigo-500/10',
                                border: 'border-indigo-500/20',
                                title: 'PatchCore + WideResNet-50',
                                desc: 'WideResNet-50 backbone extracts patch-level features from layer2 & layer3 (1536-dim). 9-NN distance scoring with coreset memory bank (10% ratio) for fast, accurate detection.',
                            },
                            {
                                icon: Eye,
                                color: 'text-blue-400',
                                bg: 'bg-blue-500/10',
                                border: 'border-blue-500/20',
                                title: 'Visual Heatmaps',
                                desc: 'Four-panel output: original image, HOT anomaly map, JET heatmap overlay, and defect contours — matching the Kaggle MVTec training visualization exactly.',
                            },
                            {
                                icon: BarChart3,
                                color: 'text-purple-400',
                                bg: 'bg-purple-500/10',
                                border: 'border-purple-500/20',
                                title: 'Real-time Analytics',
                                desc: 'Dashboard with daily inspection trends, normal vs anomaly breakdown, and defect severity distribution — Minor, Major, and Critical.',
                            },
                            {
                                icon: Cpu,
                                color: 'text-emerald-400',
                                bg: 'bg-emerald-500/10',
                                border: 'border-emerald-500/20',
                                title: 'Background Isolation',
                                desc: 'Automatic background removal via rembg for real-world photos with cluttered backgrounds. MVTec-style images with white backgrounds are analyzed directly.',
                            },
                            {
                                icon: ShieldCheck,
                                color: 'text-yellow-400',
                                bg: 'bg-yellow-500/10',
                                border: 'border-yellow-500/20',
                                title: 'Secure & Role-Based',
                                desc: 'JWT authentication with role-based access control. Users manage their own inspection history; admins get full system visibility and analytics.',
                            },
                            {
                                icon: ArrowRight,
                                color: 'text-red-400',
                                bg: 'bg-red-500/10',
                                border: 'border-red-500/20',
                                title: 'Export PDF Reports',
                                desc: 'Download a professional PDF report with analysis summary, anomaly score, threshold, timestamps, and heatmap details for quality documentation.',
                            },
                        ].map((f, i) => (
                            <div
                                key={f.title}
                                className={`bg-zinc-900/50 border ${f.border} rounded-2xl p-6 hover:bg-zinc-900 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500`}
                                style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
                            >
                                <div className={`w-10 h-10 rounded-xl ${f.bg} border ${f.border} flex items-center justify-center mb-4`}>
                                    <f.icon size={20} className={f.color} />
                                </div>
                                <h3 className="text-white font-bold mb-2">{f.title}</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tech stack */}
            <section className="py-12 bg-black border-t border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-xs font-bold text-zinc-600 uppercase tracking-widest mb-8">Built With</p>
                    <div className="flex flex-wrap justify-center gap-8">
                        {['React 18', 'FastAPI', 'PyTorch', 'PatchCore', 'WideResNet-50', 'PostgreSQL', 'TailwindCSS', 'MVTec AD'].map((t) => (
                            <span key={t} className="text-sm font-semibold text-zinc-500 hover:text-white transition-colors cursor-default">{t}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-black border-t border-zinc-800">
                <div className="max-w-3xl mx-auto text-center px-4">
                    <h2 className="text-3xl font-extrabold text-white mb-4">Ready to detect defects?</h2>
                    <p className="text-zinc-400 mb-8">Upload your first bottle image and get instant AI-powered anomaly analysis with heatmaps and defect contours.</p>
                    <Link to="/register" className="inline-flex items-center px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-900/30 text-sm">
                        Create Free Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Landing;
