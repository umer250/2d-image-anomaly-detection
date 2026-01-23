import React from 'react';
import { motion } from 'framer-motion';
import {
    Code,
    Database,
    Server,
    Cpu,
    Layers,
    GraduationCap,
    Github,
    ExternalLink
} from 'lucide-react';

const About = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-12">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white sm:text-4xl">About The Project</h1>
                <p className="mt-4 text-lg text-zinc-400">
                    Final Year Project: 2D Image Anomaly Detection Platform
                </p>
            </div>

            {/* Overview Section */}
            <motion.section
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 overflow-hidden"
            >
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Project Overview</h2>
                    <div className="prose prose-invert max-w-none text-zinc-400">
                        <p className="mb-4">
                            This platform is designed to automate the quality control process in industrial manufacturing.
                            By leveraging advanced computer vision and deep learning techniques, it detects surface anomalies
                            such as scratches, dents, and cracks in real-time.
                        </p>
                        <p>
                            The system uses a Convolutional Neural Network (CNN) trained on the MVTec AD dataset,
                            a comprehensive benchmark for unsupervised anomaly detection in industrial inspection.
                            The frontend provides a professional, enterprise-grade interface for operators to upload images,
                            view detection results, and track historical performance.
                        </p>
                    </div>
                </div>
            </motion.section>

            {/* Tech Stack */}
            <motion.section
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
            >
                <h2 className="text-2xl font-bold text-white mb-6">Technology Stack</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { name: 'Frontend', tool: 'React.js + Vite', icon: Code, desc: 'Component-based UI architecture' },
                        { name: 'Styling', tool: 'Tailwind CSS', icon: Layers, desc: 'Utility-first responsive design' },
                        { name: 'Backend', tool: 'FastAPI', icon: Server, desc: 'High-performance Python API' },
                        { name: 'Database', tool: 'PostgreSQL', icon: Database, desc: 'Relational data storage' },
                        { name: 'AI Model', tool: 'PyTorch / TensorFlow', icon: Cpu, desc: 'Deep learning inference engine' },
                        { name: 'Dataset', tool: 'MVTec AD', icon: Layers, desc: 'Industrial anomaly benchmark' },
                    ].map((item) => (
                        <motion.div
                            key={item.name}
                            variants={itemVariants}
                            className="bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-800 hover:border-zinc-700 transition-colors"
                        >
                            <div className="flex items-center mb-4">
                                <div className="p-2 bg-zinc-800 rounded-lg text-white mr-3 border border-zinc-700">
                                    <item.icon size={24} />
                                </div>
                                <h3 className="font-bold text-white">{item.name}</h3>
                            </div>
                            <p className="text-white font-medium mb-1">{item.tool}</p>
                            <p className="text-sm text-zinc-500">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.section>

            {/* Academic Info */}
            <motion.section
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-zinc-950 text-white rounded-2xl overflow-hidden border border-zinc-800"
            >
                <div className="p-8 md:p-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex-1">
                            <div className="flex items-center mb-6">
                                <GraduationCap size={32} className="text-white mr-4" />
                                <h2 className="text-2xl font-bold">Academic Details</h2>
                            </div>
                            <div className="space-y-4 text-zinc-400">
                                <p><strong className="text-white">College:</strong> Government Graduate College Aroop Affiliate with UOG</p>
                                <p><strong className="text-white">Department:</strong> Computer Science</p>
                                <p><strong className="text-white">Batch:</strong> 2022 - 2026</p>
                                <p><strong className="text-white">Supervisor:</strong> Professor Zohaib</p>
                            </div>
                        </div>

                        <div className="flex-1 w-full md:w-auto bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                            <h3 className="font-bold text-lg mb-4">Project Resources</h3>
                            <div className="space-y-3">
                                <a href="#" className="flex items-center text-zinc-400 hover:text-white transition-colors">
                                    <Github size={20} className="mr-3" />
                                    Source Code Repository
                                </a>
                                <a href="https://www.mvtec.com/company/research/datasets/mvtec-ad" target="_blank" rel="noopener noreferrer" className="flex items-center text-zinc-400 hover:text-white transition-colors">
                                    <ExternalLink size={20} className="mr-3" />
                                    MVTec AD Dataset
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>
        </div>
    );
};

export default About;
