import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Scan,
    ShieldCheck,
    BarChart3,
    ArrowRight,
    CheckCircle2
} from 'lucide-react';

const Landing = () => {
    return (
        <div className="min-h-screen bg-black">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-black">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-32 lg:pb-24">
                    <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left"
                        >
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium mb-6 border border-blue-500/20">
                                <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                                FYP Batch 2022-2026
                            </div>
                            <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
                                <span className="block">2D Image Anomaly</span>
                                <span className="block text-blue-500">Detection Platform</span>
                            </h1>
                            <p className="mt-3 text-base text-zinc-400 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                                A professional enterprise-grade platform for automated industrial inspection.
                                Upload images, detect anomalies with AI, and visualize results in real-time.
                            </p>
                            <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-black bg-white hover:bg-zinc-200 md:py-4 md:text-lg md:px-10 transition-all shadow-lg hover:shadow-xl"
                                >
                                    Login
                                    <ArrowRight className="ml-2 -mr-1 h-5 w-5" />
                                </Link>
                                <p className="mt-3 text-sm text-zinc-500">
                                    Login to access the platform.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center"
                        >
                            <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                                <div className="relative block w-full bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-800 backdrop-blur-sm p-8">
                                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl"></div>
                                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl"></div>

                                    <div className="relative flex flex-col items-center justify-center space-y-8 py-12">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 rounded-full"></div>
                                            <Scan size={120} className="text-white relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" strokeWidth={1} />

                                            {/* Scanning animation effect */}
                                            <motion.div
                                                className="absolute top-0 left-0 w-full h-1 bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]"
                                                animate={{
                                                    top: ["0%", "100%", "0%"],
                                                    opacity: [0.5, 1, 0.5]
                                                }}
                                                transition={{
                                                    duration: 3,
                                                    repeat: Infinity,
                                                    ease: "linear"
                                                }}
                                            />
                                        </div>

                                        <div className="text-center space-y-2">
                                            <h3 className="text-2xl font-bold text-white tracking-tight">Precision Analysis</h3>
                                            <p className="text-zinc-400 text-sm max-w-[200px] mx-auto">
                                                Advanced optical inspection powered by deep learning
                                            </p>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-2">
                                                    <Scan size={20} className="text-blue-400" />
                                                </div>
                                                <span className="text-xs text-zinc-500">Scan</span>
                                            </div>
                                            <div className="w-px h-12 bg-zinc-800 self-center"></div>
                                            <div className="flex flex-col items-center">
                                                <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-2">
                                                    <BarChart3 size={20} className="text-purple-400" />
                                                </div>
                                                <span className="text-xs text-zinc-500">Analyze</span>
                                            </div>
                                            <div className="w-px h-12 bg-zinc-800 self-center"></div>
                                            <div className="flex flex-col items-center">
                                                <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-2">
                                                    <ShieldCheck size={20} className="text-green-400" />
                                                </div>
                                                <span className="text-xs text-zinc-500">Secure</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-black border-t border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-base text-blue-500 font-semibold tracking-wide uppercase">Features</h2>
                        <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
                            Enterprise-Grade Anomaly Detection
                        </p>
                        <p className="mt-4 max-w-2xl text-xl text-zinc-400 mx-auto">
                            Built for precision and reliability in industrial environments.
                        </p>
                    </div>

                    <div className="mt-16">
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                {
                                    title: 'AI-Powered Analysis',
                                    description: 'Advanced deep learning models to detect even the smallest surface anomalies.',
                                    icon: Scan,
                                },
                                {
                                    title: 'Real-time Results',
                                    description: 'Instant processing and visualization of detection results with confidence scores.',
                                    icon: BarChart3,
                                },
                                {
                                    title: 'Secure & Reliable',
                                    description: 'Enterprise-grade security with role-based access control and data encryption.',
                                    icon: ShieldCheck,
                                },
                            ].map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="pt-6"
                                >
                                    <div className="flow-root bg-zinc-900 rounded-lg px-6 pb-8 border border-zinc-800 hover:border-zinc-700 transition-colors">
                                        <div className="-mt-6">
                                            <div>
                                                <span className="inline-flex items-center justify-center p-3 bg-zinc-800 rounded-md shadow-lg border border-zinc-700">
                                                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                                                </span>
                                            </div>
                                            <h3 className="mt-8 text-lg font-medium text-white tracking-tight">{feature.title}</h3>
                                            <p className="mt-5 text-base text-zinc-400">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Tech Stack Section */}
            <section className="py-12 bg-black border-t border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
                        {['React', 'Tailwind CSS', 'FastAPI', 'PostgreSQL', 'Tensorflow'].map((tech) => (
                            <div key={tech} className="col-span-1 flex justify-center items-center">
                                <span className="text-lg font-semibold text-zinc-500 hover:text-white transition-colors cursor-default">
                                    {tech}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Landing;
