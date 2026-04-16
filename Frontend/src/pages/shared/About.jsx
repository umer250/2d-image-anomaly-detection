import React from 'react';
import { Link } from 'react-router-dom';
import { Scan, Shield, Activity, Target, Zap, Layers, Eye, BarChart3, ArrowRight, Cpu } from 'lucide-react';
import AppLogo from '../../components/icons/AppLogo';

const slides = [
    {
        id: 'mission',
        icon: Zap,
        iconColor: 'text-yellow-400',
        iconBg: 'bg-yellow-500/10',
        iconBorder: 'border-yellow-500/20',
        title: 'Our Mission',
        content: 'To provide accessible, high-performance anomaly detection tools that empower manufacturers and researchers to maintain the highest standards of quality through AI-driven insights. Built as a Final Year Project (Batch 2022–2026) using state-of-the-art deep learning.',
    },
    {
        id: 'model',
        icon: Layers,
        iconColor: 'text-indigo-400',
        iconBg: 'bg-indigo-500/10',
        iconBorder: 'border-indigo-500/20',
        title: 'PatchCore Model',
        content: 'Powered by PatchCore with a WideResNet-50 backbone. Features are extracted from layer2 and layer3 (1536-dim embeddings), scored using 9-NN average distance with a coreset memory bank (10% ratio). Trained on the MVTec AD benchmark — bottle category.',
        stats: [
            { label: 'Image AUROC', value: '99.84%' },
            { label: 'Pixel AUROC', value: '98.17%' },
            { label: 'Threshold', value: '0.7544' },
        ],
    },
    {
        id: 'pipeline',
        icon: Eye,
        iconColor: 'text-blue-400',
        iconBg: 'bg-blue-500/10',
        iconBorder: 'border-blue-500/20',
        title: 'Detection Pipeline',
        content: 'Images are preprocessed with resize(224×224) + ImageNet normalization — matching Kaggle training exactly. The model outputs a 4-panel visualization: Original Image, HOT Anomaly Map, JET Heatmap Overlay, and Defect Contours with bounding boxes.',
    },
    {
        id: 'analytics',
        icon: BarChart3,
        iconColor: 'text-purple-400',
        iconBg: 'bg-purple-500/10',
        iconBorder: 'border-purple-500/20',
        title: 'Analytics & Reporting',
        content: 'Real-time dashboard with daily inspection trends, normal vs anomaly breakdown, and defect severity distribution (Minor < 60%, Major 60–85%, Critical > 85%). Export professional PDF reports with full analysis details.',
    },
    {
        id: 'security',
        icon: Shield,
        iconColor: 'text-green-400',
        iconBg: 'bg-green-500/10',
        iconBorder: 'border-green-500/20',
        title: 'Security & Access Control',
        content: 'JWT-based authentication with role-based access control (RBAC). Users manage their own inspection history. Admins have full system visibility, user management, and global analytics. Passwords are bcrypt-hashed with strong validation.',
    },
    {
        id: 'background',
        icon: Cpu,
        iconColor: 'text-emerald-400',
        iconBg: 'bg-emerald-500/10',
        iconBorder: 'border-emerald-500/20',
        title: 'Background Isolation',
        content: 'The "Isolate Object" toggle uses rembg to automatically remove cluttered backgrounds from real-world photos, placing a clean white background before analysis. MVTec-style images with white backgrounds are analyzed directly without modification.',
    },
];

const About = () => {
    const [activeSlide, setActiveSlide] = React.useState(0);

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Navbar */}
            <header className="border-b border-zinc-800 bg-black/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <AppLogo width={180} color="#6366f1" showText={true} />
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm text-zinc-400 hover:text-white transition-colors font-medium">Sign In</Link>
                        <Link to="/register" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-all">
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="relative py-20 px-4 text-center overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="relative max-w-3xl mx-auto">
                    <div className="flex justify-center mb-6">
                        <AppLogo width={64} showText={false} color="#6366f1" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
                        About <span className="text-indigo-500">AnomalyDetect</span>
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
                        A state-of-the-art 2D Image Anomaly Detection system built for industrial quality control.
                        Powered by <strong className="text-white">PatchCore</strong> with <strong className="text-white">WideResNet-50</strong> backbone,
                        achieving <strong className="text-white">99.84% Image AUROC</strong> on the MVTec AD benchmark.
                    </p>
                </div>
            </section>

            {/* Slider Section */}
            <section className="py-12 px-4 max-w-6xl mx-auto">
                {/* Slide Tabs */}
                <div className="flex flex-wrap gap-2 justify-center mb-10">
                    {slides.map((slide, i) => {
                        const Icon = slide.icon;
                        return (
                            <button
                                key={slide.id}
                                onClick={() => setActiveSlide(i)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${
                                    activeSlide === i
                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/30'
                                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                                }`}
                            >
                                <Icon size={13} />
                                {slide.title}
                            </button>
                        );
                    })}
                </div>

                {/* Active Slide Content */}
                {slides.map((slide, i) => {
                    const Icon = slide.icon;
                    if (i !== activeSlide) return null;
                    return (
                        <div
                            key={slide.id}
                            className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-400"
                        >
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className={`w-16 h-16 rounded-2xl ${slide.iconBg} border ${slide.iconBorder} flex items-center justify-center flex-shrink-0`}>
                                    <Icon size={32} className={slide.iconColor} />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-extrabold text-white mb-4">{slide.title}</h2>
                                    <p className="text-zinc-400 text-base leading-relaxed mb-6">{slide.content}</p>
                                    {slide.stats && (
                                        <div className="grid grid-cols-3 gap-4">
                                            {slide.stats.map((s) => (
                                                <div key={s.label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-center">
                                                    <p className="text-xl font-black text-white font-mono">{s.value}</p>
                                                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mt-1">{s.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Slide Dots */}
                <div className="flex justify-center gap-2 mt-8">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveSlide(i)}
                            className={`w-2 h-2 rounded-full transition-all ${i === activeSlide ? 'bg-indigo-500 w-6' : 'bg-zinc-700 hover:bg-zinc-500'}`}
                        />
                    ))}
                </div>
            </section>

            {/* Tech Stack */}
            <section className="py-12 border-t border-zinc-800 px-4">
                <div className="max-w-4xl mx-auto">
                    <p className="text-center text-xs font-bold text-zinc-600 uppercase tracking-widest mb-8">Technology Stack</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { name: 'PatchCore', desc: 'Anomaly detection algorithm' },
                            { name: 'WideResNet-50', desc: 'Feature extraction backbone' },
                            { name: 'PyTorch', desc: 'Deep learning framework' },
                            { name: 'MVTec AD', desc: 'Training benchmark dataset' },
                            { name: 'FastAPI', desc: 'Backend REST API' },
                            { name: 'React 18', desc: 'Frontend framework' },
                            { name: 'PostgreSQL', desc: 'Database' },
                            { name: 'TailwindCSS', desc: 'UI styling' },
                        ].map((t) => (
                            <div key={t.name} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center hover:border-zinc-600 transition-colors">
                                <p className="text-white font-bold text-sm">{t.name}</p>
                                <p className="text-zinc-600 text-xs mt-1">{t.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 border-t border-zinc-800 text-center px-4">
                <h2 className="text-2xl font-extrabold text-white mb-3">Try it yourself</h2>
                <p className="text-zinc-400 mb-6 text-sm">Upload a bottle image and see PatchCore anomaly detection in action.</p>
                <Link to="/register" className="inline-flex items-center px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-indigo-900/30 text-sm">
                    Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </section>
        </div>
    );
};

export default About;
