import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../services/api';
import { Image as ImageIcon, Eye, Search, Filter } from 'lucide-react';
import clsx from 'clsx';

const ImageMonitoring = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchImages = async () => {
            try {
                console.log("ImageMonitoring: Fetching images...");
                const data = await adminAPI.getImages();
                console.log("ImageMonitoring: Data received", data);
                setImages(data.images || []);
            } catch (error) {
                console.error("ImageMonitoring: Failed to fetch images:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchImages();
    }, []);

    const filteredImages = images.filter(img =>
        img.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getBaseURL = () => {
        // Construct base static URL
        const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        return apiURL.replace('/api/v1', '');
    };

    return (
        <div className="space-y-6 font-inter">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <h1 className="text-3xl font-extrabold text-white flex items-center tracking-tight">
                    <ImageIcon className="mr-4 text-red-500" size={32} />
                    Image Monitoring
                </h1>
                <div className="bg-zinc-900/50 px-5 py-2.5 rounded-2xl border border-zinc-800/50 backdrop-blur-md shadow-xl">
                    <span className="text-zinc-500 text-sm font-medium">System Volume: </span>
                    <span className="text-white font-bold ml-2">{images.length} Units</span>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-zinc-950/40 border border-white/5 rounded-3xl overflow-hidden p-8 backdrop-blur-2xl shadow-2xl relative"
            >
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-red-500/5 blur-[100px] rounded-full pointer-events-none" />

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 relative z-10">
                    <div className="relative flex-1 w-full max-w-lg group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-white transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Identify specific assets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/60 border border-zinc-800/50 rounded-2xl py-3.5 pl-12 pr-6 text-base focus:outline-none focus:border-red-500/50 transition-all backdrop-blur-md placeholder:text-zinc-600 focus:shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                        />
                    </div>
                    <div className="flex items-center gap-4 bg-zinc-900/30 px-4 py-2 rounded-xl border border-white/5">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none mb-1">Status</span>
                            <span className="text-xs text-zinc-300 font-medium">Live Stream</span>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {loading ? (
                        Array(8).fill(0).map((_, i) => (
                            <div key={i} className="aspect-square bg-zinc-900/50 rounded-3xl animate-pulse border border-white/5 shadow-inner" />
                        ))
                    ) : filteredImages.length === 0 ? (
                        <div className="col-span-full py-32 text-center flex flex-col items-center justify-center bg-zinc-950/80 rounded-3xl border border-dashed border-zinc-800 shadow-2xl">
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 4 }}
                            >
                                <ImageIcon size={64} className="text-zinc-800 mb-6" />
                            </motion.div>
                            <h3 className="text-xl font-bold text-white mb-2">No Matches Found</h3>
                            <p className="text-zinc-500 max-w-xs">Double check your filters or try searching for a different image identification tag.</p>
                        </div>
                    ) : filteredImages.map((img, idx) => (
                        <motion.div
                            key={img.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ y: -8 }}
                            className="group relative bg-zinc-900/30 rounded-3xl border border-white/5 overflow-hidden hover:border-red-500/30 transition-all duration-500 shadow-xl hover:shadow-red-500/5"
                        >
                            {/* Image Container */}
                            <div className="aspect-[4/5] bg-zinc-950 flex items-center justify-center relative overflow-hidden">
                                {img.file_path ? (
                                    <img
                                        src={`${getBaseURL()}/${img.file_path}`}
                                        alt={img.filename}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://via.placeholder.com/400x500?text=Asset+Unavailable';
                                        }}
                                    />
                                ) : (
                                    <ImageIcon className="text-zinc-800 opacity-20" size={64} />
                                )}

                                {/* Status Layer */}
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                                    <div className="flex items-center justify-between">
                                        <span className={clsx(
                                            "text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest backdrop-blur-xl border font-outfit shadow-2xl",
                                            img.results && img.results[0]?.is_anomaly
                                                ? 'bg-red-500/30 text-red-400 border-red-500/40 glow-text-red'
                                                : 'bg-green-500/30 text-green-400 border-green-500/40 glow-text-green'
                                        )}>
                                            {img.results && img.results[0]?.is_anomaly ? 'Detected' : 'Secure'}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <div className={clsx(
                                                "w-1.5 h-1.5 rounded-full",
                                                img.results && img.results[0]?.is_anomaly ? 'bg-red-500' : 'bg-green-500'
                                            )} />
                                            <span className="text-[10px] font-bold text-white/50">V1.0</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content Layer */}
                            <div className="p-6">
                                <h4 className="text-sm font-bold text-white truncate mb-2 group-hover:text-red-400 transition-colors" title={img.filename}>
                                    {img.filename}
                                </h4>

                                <div className="flex justify-between items-end mt-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">Core Score</span>
                                        <span className={clsx(
                                            "text-2xl font-black font-outfit",
                                            img.results && img.results[0]?.is_anomaly ? 'text-red-500 glow-text-red' : 'text-green-500 glow-text-green'
                                        )}>
                                            {img.results && img.results[0] ? `${(img.results[0].anomaly_score * 100).toFixed(1)}` : '0.0'}
                                            <span className="text-sm ml-1 opacity-50">%</span>
                                        </span>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="p-3 bg-white/5 text-zinc-400 rounded-2xl hover:bg-white hover:text-black transition-all border border-white/5 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                    >
                                        <Eye size={20} />
                                    </motion.button>
                                </div>

                                <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center bg-black/20 -mx-6 px-6 -mb-6 pb-4">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-zinc-600 font-bold uppercase">Archive ID</span>
                                        <span className="text-[10px] text-zinc-400 font-mono">#{String(img.id).padStart(5, '0')}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] text-zinc-600 font-bold uppercase">Logged</span>
                                        <span className="text-[10px] text-zinc-400">{new Date(img.upload_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default ImageMonitoring;
