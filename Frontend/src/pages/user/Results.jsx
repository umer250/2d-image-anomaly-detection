import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle,
    AlertTriangle,
    ArrowLeft,
    RefreshCw,
    Download,
    Share2,
    Maximize2
} from 'lucide-react';
import { SkeletonCard } from '../../components/SkeletonCard';
import clsx from 'clsx';

const BACKEND_URL = 'http://localhost:8000';

const Results = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [viewMode, setViewMode] = useState('heatmap');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (location.state?.analysisResult) {
            // Use real data passed from Upload
            const data = location.state.analysisResult;
            setResult({
                status: data.is_anomaly ? 'Anomaly' : 'Normal',
                confidence: (data.anomaly_score * 100).toFixed(2),
                type: data.is_anomaly ? 'Detected Defect' : 'None',
                heatmapPath: data.heatmap_path,
                threshold: data.threshold,
                modelVersion: data.model_version
            });
            setLoading(false);
        } else {
            // Fallback / Demo mode if no state
            // Simulate API loading delay
            const timer = setTimeout(() => {
                setLoading(false);
                if (!location.state?.image) {
                    // Demo data
                    setResult({
                        status: 'Anomaly',
                        confidence: '87.50',
                        type: 'Demo Defect',
                        heatmapPath: null // No heatmap for demo
                    });
                } else {
                    // Mock data if image exists but no result (edge case)
                    setResult({
                        status: 'Normal',
                        confidence: '98.00',
                        type: 'None',
                        heatmapPath: null
                    });
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [location.state, navigate]);

    // Construct display data with fallbacks
    // Ensure we are using backend URL if it's a relative path from API
    const getFullUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/800x600?text=No+Image';
        if (path.startsWith('http')) return path;
        return `${BACKEND_URL}${path}`;
    };

    const displayImage = location.state?.image ? getFullUrl(location.state.image) : location.state?.analysisResult?.original_path ? getFullUrl(location.state.analysisResult.original_path) : 'https://via.placeholder.com/800x600?text=No+Image';
    const displayFileName = location.state?.fileName || result?.details?.original_filename || 'Analyzed Image';

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="h-[400px] bg-zinc-900 rounded-xl border border-zinc-800 animate-pulse"></div>
                        <div className="h-24 bg-zinc-900 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="space-y-6">
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                </div>
            </div>
        );
    }

    if (!result) return null;

    const isAnomaly = result.status === 'Anomaly';

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link to="/upload" className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                        <ArrowLeft className="text-zinc-400 hover:text-white" />
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Analysis Results</h1>
                </div>
                <div className="flex space-x-3">
                    <button className="flex items-center px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors">
                        <Share2 size={18} className="mr-2" />
                        Share
                    </button>
                    <button className="flex items-center px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors">
                        <Download size={18} className="mr-2" />
                        Export Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Image Section */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-2 space-y-4"
                >
                    <div className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 overflow-hidden">
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                            <span className="font-medium text-zinc-300">{displayFileName}</span>
                            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                                <button
                                    onClick={() => setViewMode('original')}
                                    className={clsx(
                                        "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                        viewMode === 'original' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    Original Image
                                </button>
                                <button
                                    onClick={() => setViewMode('heatmap')}
                                    className={clsx(
                                        "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                        viewMode === 'heatmap' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                    disabled={!result.heatmapPath}
                                >
                                    Heatmap Overlay
                                </button>
                            </div>
                        </div>
                        <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden group">
                            {/* Original Image */}
                            <img
                                src={displayImage}
                                alt="Analyzed"
                                className="absolute inset-0 w-full h-full object-contain"
                            />

                            {/* Heatmap Overlay */}
                            <AnimatePresence>
                                {viewMode === 'heatmap' && result.heatmapPath && (
                                    <motion.img
                                        src={getFullUrl(result.heatmapPath)} // Use getFullUrl here
                                        alt="Heatmap"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 0.7 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-normal" // Changed mix-blend to normal for better visibility if it's a transparent PNG
                                    />
                                )}
                            </AnimatePresence>

                            <button className="absolute bottom-4 right-4 p-2 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                                <Maximize2 size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <h3 className="font-medium text-blue-400 mb-2">AI Analysis Explanation</h3>
                        <p className="text-sm text-blue-300/80">
                            The model (version {result.modelVersion || 'v1.0'}) analyzed the image.
                            {isAnomaly
                                ? ` It detected anomalies with a confidence score of ${result.confidence}%. The red regions in the heatmap indicate potential defects.`
                                : " No significant anomalies were detected. The image appears normal."}
                        </p>
                    </div>
                </motion.div>

                {/* Results Panel */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                >
                    {/* Status Card */}
                    <div className={clsx(
                        "rounded-xl p-6 border shadow-sm",
                        isAnomaly ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"
                    )}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={clsx(
                                "text-lg font-bold",
                                isAnomaly ? "text-red-500" : "text-green-500"
                            )}>
                                Detection Status
                            </h3>
                            {isAnomaly ? (
                                <AlertTriangle className="text-red-600" size={28} />
                            ) : (
                                <CheckCircle className="text-green-600" size={28} />
                            )}
                        </div>

                        <div className="text-3xl font-bold mb-1 text-white">
                            {result.status}
                        </div>
                        <div className={clsx(
                            "text-sm font-medium",
                            isAnomaly ? "text-red-400" : "text-green-400"
                        )}>
                            {isAnomaly ? "Potential Defect Detected" : "No Anomalies Found"}
                        </div>
                    </div>

                    {/* Confidence Card */}
                    <div className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Anomaly Score</h3>
                        <div className="flex items-end justify-between mb-2">
                            <span className={clsx(
                                "text-3xl font-bold",
                                isAnomaly ? "text-red-500" : "text-green-500"
                            )}>{result.confidence}</span>
                            <span className="text-sm text-zinc-500 mb-1">Score (0-100)</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-3 mb-2">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${result.confidence}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className={clsx(
                                    "h-3 rounded-full",
                                    isAnomaly ? "bg-red-500" : "bg-green-500"
                                )}
                            />
                        </div>
                        <p className="text-xs text-zinc-500 mt-4">
                            <strong>Details:</strong><br />
                            Threshold: {result.threshold}<br />
                            Model: {result.modelVersion}<br />
                            Pixels: {result.details?.width || 'N/A'}x{result.details?.height || 'N/A'}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/upload')}
                            className="w-full flex items-center justify-center px-4 py-3 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors shadow-lg hover:shadow-xl font-medium"
                        >
                            <RefreshCw size={20} className="mr-2" />
                            Analyze Another Image
                        </button>
                        <Link to="/history">
                            <button className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors mt-3">
                                View History
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Results;
