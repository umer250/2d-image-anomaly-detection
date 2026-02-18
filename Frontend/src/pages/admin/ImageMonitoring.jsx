import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../services/api';
import { Image as ImageIcon, Eye, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

const ImageMonitoring = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // 'all' | 'defect' | 'normal'

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const data = await adminAPI.getImages();
                setImages(data.images || []);
            } catch (error) {
                console.error("ImageMonitoring: Failed to fetch images:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchImages();
    }, []);

    const filteredImages = images.filter(img => {
        const matchesSearch = img.filename.toLowerCase().includes(searchTerm.toLowerCase());
        const isAnomaly = img.results && img.results[0]?.is_anomaly;
        if (filter === 'defect') return matchesSearch && isAnomaly;
        if (filter === 'normal') return matchesSearch && !isAnomaly;
        return matchesSearch;
    });

    const defectCount = images.filter(img => img.results && img.results[0]?.is_anomaly).length;
    const normalCount = images.length - defectCount;

    const getBaseURL = () => {
        const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        return apiURL.replace('/api/v1', '');
    };

    return (
        <div className="space-y-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div>
                    <h1
                        className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3"
                        style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                    >
                        <ImageIcon className="text-purple-400" size={30} />
                        Image Defect Log
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">All inspected images with defect analysis results</p>
                </div>

                {/* Summary Badges */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">
                        <AlertTriangle size={14} className="text-red-400" />
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Defects</span>
                        <span
                            className="text-xl font-black text-red-400 ml-1"
                            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                        >{defectCount}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl">
                        <CheckCircle size={14} className="text-emerald-400" />
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Passed</span>
                        <span
                            className="text-xl font-black text-emerald-400 ml-1"
                            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                        >{normalCount}</span>
                    </div>
                </div>
            </motion.div>

            {/* Search & Filter Bar */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col sm:flex-row items-center gap-4"
            >
                <div className="relative flex-1 w-full group">
                    <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-purple-400 transition-colors"
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder="Search by filename..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-3 pl-11 pr-5 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-zinc-600"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 shrink-0">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'defect', label: 'Defects' },
                        { key: 'normal', label: 'Passed' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={clsx(
                                "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                                filter === key
                                    ? key === 'defect'
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : key === 'normal'
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-zinc-700 text-white'
                                    : 'text-zinc-500 hover:text-zinc-300'
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Image Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {loading ? (
                    Array(8).fill(0).map((_, i) => (
                        <div
                            key={i}
                            className="bg-zinc-900/50 rounded-2xl animate-pulse border border-zinc-800 h-72"
                        />
                    ))
                ) : filteredImages.length === 0 ? (
                    <div className="col-span-full py-24 text-center flex flex-col items-center justify-center bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                        <ImageIcon size={48} className="text-zinc-700 mb-4" />
                        <h3
                            className="text-lg font-bold text-white mb-1"
                            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                        >
                            No Images Found
                        </h3>
                        <p className="text-zinc-500 text-sm max-w-xs">
                            {searchTerm
                                ? 'No images match your search.'
                                : 'No images have been uploaded yet.'}
                        </p>
                    </div>
                ) : filteredImages.map((img, idx) => {
                    const isAnomaly = img.results && img.results[0]?.is_anomaly;
                    const score = img.results && img.results[0]
                        ? (img.results[0].anomaly_score * 100).toFixed(1)
                        : null;

                    return (
                        <motion.div
                            key={img.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            whileHover={{ y: -4 }}
                            className={clsx(
                                "group bg-zinc-900/40 rounded-2xl border overflow-hidden transition-all duration-300 shadow-lg",
                                isAnomaly
                                    ? 'border-red-500/20 hover:border-red-500/40 hover:shadow-red-500/10 hover:shadow-xl'
                                    : 'border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-emerald-500/10 hover:shadow-xl'
                            )}
                        >
                            {/* Image Thumbnail */}
                            <div className="aspect-video bg-zinc-950 relative overflow-hidden">
                                {img.file_path ? (
                                    <img
                                        src={`${getBaseURL()}/${img.file_path}`}
                                        alt={img.filename}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://via.placeholder.com/400x225?text=Unavailable';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon className="text-zinc-700" size={40} />
                                    </div>
                                )}

                                {/* Defect / Passed Badge */}
                                <div className="absolute top-3 left-3">
                                    <span className={clsx(
                                        "inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest border backdrop-blur-md",
                                        isAnomaly
                                            ? 'bg-red-500/30 text-red-300 border-red-500/40'
                                            : 'bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                                    )}>
                                        <span className={clsx(
                                            "w-1.5 h-1.5 rounded-full",
                                            isAnomaly ? 'bg-red-400' : 'bg-emerald-400'
                                        )} />
                                        {isAnomaly ? 'Defect' : 'Passed'}
                                    </span>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-4">
                                <h4
                                    className="text-sm font-semibold text-white truncate mb-3"
                                    title={img.filename}
                                >
                                    {img.filename}
                                </h4>

                                <div className="flex items-end justify-between">
                                    {/* Score */}
                                    <div>
                                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-0.5">
                                            {isAnomaly ? 'Defect Score' : 'Confidence'}
                                        </p>
                                        <p
                                            className={clsx(
                                                "text-2xl font-black leading-none",
                                                isAnomaly ? 'text-red-400' : 'text-emerald-400'
                                            )}
                                            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                                        >
                                            {score !== null ? `${score}%` : '—'}
                                        </p>
                                    </div>

                                    {/* View Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="p-2.5 bg-white/5 text-zinc-400 rounded-xl hover:bg-white hover:text-black transition-all border border-white/5"
                                        title="View Details"
                                    >
                                        <Eye size={16} />
                                    </motion.button>
                                </div>

                                {/* Footer */}
                                <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-between items-center">
                                    <span className="text-[10px] text-zinc-600 font-mono">
                                        #{String(img.id).padStart(5, '0')}
                                    </span>
                                    <span className="text-[10px] text-zinc-500">
                                        {new Date(img.upload_date).toLocaleDateString(undefined, {
                                            month: 'short', day: 'numeric', year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default ImageMonitoring;
