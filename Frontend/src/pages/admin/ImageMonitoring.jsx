import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Image as ImageIcon,
    AlertTriangle,
    CheckCircle,
    Maximize2,
    X,
    Calendar,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Shield,
    Activity
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import clsx from 'clsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

const ImageMonitoring = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [confidenceThreshold, setConfidenceThreshold] = useState(70);
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const response = await adminAPI.getImages();
                setImages(response.images || []);
            } catch (error) {
                console.error("ImageMonitoring: Error fetching images:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchImages();
    }, []);

    const defectCount = images.filter(i => i.results?.[0]?.is_anomaly).length;
    const passedCount = images.filter(i => !i.results?.[0]?.is_anomaly).length;

    const filteredImages = images.filter(img => {
        const filename = img.filename || "Unknown Image";
        const matchesSearch = filename.toLowerCase().includes(searchQuery.toLowerCase());
        const isAnomaly = img.results?.[0]?.is_anomaly;
        const matchesFilter =
            filter === 'all' ||
            (filter === 'defect' && isAnomaly) ||
            (filter === 'passed' && !isAnomaly);

        return matchesSearch && matchesFilter;
    });

    const getFullImageUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        // The path from backend relative to project root, e.g., 'uploads/filename.jpg'
        // Vite proxy handles these paths when they start with /uploads or /heatmaps
        const cleanPath = path.replace(/\\/g, '/');
        return cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">
                        Image Monitoring Log
                    </h1>
                    <p className="text-slate-400 text-xs mt-1">
                        Track and audit hardware inspections in real-time.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input
                            type="text"
                            placeholder="Search by filename..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-900/50 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white outline-none focus:border-blue-500/50 w-64 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={clsx(
                            "p-2 rounded-lg border transition-all",
                            showAdvanced ? "bg-blue-600/10 border-blue-500/50 text-blue-400" : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                        )}
                    >
                        <Filter size={16} />
                    </button>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                        <AlertTriangle size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Defects</p>
                        <p className="text-lg font-bold text-white">{defectCount}</p>
                    </div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                        <CheckCircle size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Passed Units</p>
                        <p className="text-lg font-bold text-white">{passedCount}</p>
                    </div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                        <ImageIcon size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Logs</p>
                        <p className="text-lg font-bold text-white">{images.length}</p>
                    </div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                        <Activity size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Defect Rate</p>
                        <p className="text-lg font-bold text-white">
                            {images.length > 0 ? ((defectCount / images.length) * 100).toFixed(1) : 0}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex bg-slate-900/50 rounded-lg p-1 border border-slate-800">
                        {['all', 'defect', 'passed'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={clsx(
                                    "px-4 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all",
                                    filter === f ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                {f === 'defect' ? 'Anomalies' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {showAdvanced && (
                    <div className="bg-slate-900/20 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center gap-8 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-4">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confidence Threshold</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="50" max="99"
                                    value={confidenceThreshold}
                                    onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                                    className="w-40 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <span className="text-xs font-mono text-blue-400 font-bold">{confidenceThreshold}%</span>
                            </div>
                        </div>
                        <div className="h-4 w-px bg-slate-800"></div>
                        <div className="flex items-center gap-2">
                            <Shield size={14} className="text-slate-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Log Policy: Auto-Purge 30d</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Image Grid */}
            {filteredImages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredImages.map((img) => {
                        const isAnomaly = img.results?.[0]?.is_anomaly;
                        const score = (img.results?.[0]?.anomaly_score || 0) * 100;

                        return (
                            <div
                                key={img.id}
                                className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden group shadow-sm hover:border-slate-700 transition-all flex flex-col relative"
                            >
                                {/* Thumbnail Section */}
                                <div className="relative aspect-[4/3] overflow-hidden bg-black">
                                    <img
                                        src={getFullImageUrl(img.file_path)}
                                        alt={img.filename}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />

                                    {/* Status Badge at Top-Right */}
                                    <div className={clsx(
                                        "absolute top-3 right-3 px-2 py-0.5 rounded text-[9px] font-bold uppercase shadow-lg flex items-center gap-1.5 backdrop-blur-md border",
                                        isAnomaly ? "bg-red-500/20 text-red-400 border-red-500/20" : "bg-green-500/20 text-green-400 border-green-500/20"
                                    )}>
                                        {isAnomaly ? <AlertTriangle size={10} /> : <CheckCircle size={10} />}
                                        {isAnomaly ? 'Anomaly' : 'Passed'}
                                    </div>

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={() => setSelectedImage(img)}
                                            className="bg-white text-slate-950 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-tight shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-4 space-y-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <p className="text-[11px] font-semibold text-slate-200 truncate flex-1 uppercase tracking-tight">
                                            {img.filename}
                                        </p>
                                        <div className="flex items-center gap-1 text-slate-500">
                                            <Calendar size={10} />
                                            <span className="text-[9px] font-medium">{new Date(img.upload_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Confidence Progress Bar */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[9px]">
                                            <span className="text-slate-500 uppercase font-bold tracking-wider">Confidence</span>
                                            <span className={clsx("font-bold", score > 90 ? "text-green-400" : score > 70 ? "text-blue-400" : "text-amber-400")}>
                                                {score.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={clsx(
                                                    "h-full rounded-full transition-all duration-1000",
                                                    isAnomaly ? "bg-red-500" : "bg-blue-500"
                                                )}
                                                style={{ width: `${score}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
                    <div className="p-4 rounded-full bg-slate-800/50 mb-4">
                        <ImageIcon className="text-slate-600" size={32} />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">No results found matching your criteria</p>
                    <button
                        onClick={() => { setSearchQuery(''); setFilter('all'); }}
                        className="mt-4 text-blue-400 text-xs font-bold uppercase hover:underline"
                    >
                        Clear Filters
                    </button>
                </div>
            )}

            {/* Modal Inspector */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedImage(null)}></div>
                    <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <div>
                                <h2 className="text-base font-bold text-white uppercase tracking-tight">{selectedImage.filename}</h2>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {selectedImage.id}</p>
                            </div>
                            <button onClick={() => setSelectedImage(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-8">
                            <div className="flex-1 space-y-4">
                                <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-slate-800 group">
                                    <img
                                        src={showHeatmap && selectedImage.results?.[0]?.heatmap_path
                                            ? getFullImageUrl(selectedImage.results[0].heatmap_path)
                                            : getFullImageUrl(selectedImage.file_path)
                                        }
                                        alt="Preview"
                                        className="w-full h-full object-contain"
                                    />
                                    {selectedImage.results?.[0]?.heatmap_path && (
                                        <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg flex border border-slate-800">
                                            <button
                                                onClick={() => setShowHeatmap(false)}
                                                className={clsx("px-4 py-1.5 text-[9px] font-bold uppercase rounded transition-all", !showHeatmap ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}
                                            >Original</button>
                                            <button
                                                onClick={() => setShowHeatmap(true)}
                                                className={clsx("px-4 py-1.5 text-[9px] font-bold uppercase rounded transition-all", showHeatmap ? "bg-red-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}
                                            >Heatmap</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="w-full lg:w-80 space-y-6">
                                <div className="bg-slate-950/40 rounded-xl p-6 border border-slate-800">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Inference Result</h4>
                                    <div className="space-y-5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                                            <span className={clsx(
                                                "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border",
                                                selectedImage.results?.[0]?.is_anomaly ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-green-500/10 text-green-400 border-green-500/20"
                                            )}>
                                                {selectedImage.results?.[0]?.is_anomaly ? 'Anomaly' : 'NORMAL'}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confidence Score</span>
                                                <span className="text-xl font-bold text-white font-mono">
                                                    {((selectedImage.results?.[0]?.anomaly_score || 0) * 100).toFixed(2)}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={clsx("h-full", selectedImage.results?.[0]?.is_anomaly ? "bg-red-500" : "bg-blue-500")}
                                                    style={{ width: `${(selectedImage.results?.[0]?.anomaly_score || 0) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-950/40 rounded-xl p-6 border border-slate-800">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Metadata</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-500 font-bold uppercase tracking-wider">Upload Date</span>
                                            <span className="text-slate-300">{new Date(selectedImage.upload_date).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px]">
                                            <span className="text-slate-500 font-bold uppercase tracking-wider">User Account ID</span>
                                            <span className="text-slate-300 font-mono">{selectedImage.user_id}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg text-[10px] font-bold uppercase tracking-tight shadow-lg shadow-blue-500/10 transition-all border border-blue-500/50"
                                    onClick={() => {
                                        const doc = new jsPDF();
                                        const isAnomaly = selectedImage.results?.[0]?.is_anomaly;
                                        const score = ((selectedImage.results?.[0]?.anomaly_score || 0) * 100).toFixed(2);

                                        // Header with stylized Logo
                                        doc.setFillColor(30, 41, 59);
                                        doc.rect(0, 0, 210, 40, 'F');

                                        // Stylized Logo (Red Square)
                                        doc.setFillColor(239, 68, 68);
                                        doc.roundedRect(14, 12, 16, 16, 3, 3, 'F');
                                        doc.setFontSize(14);
                                        doc.setTextColor(255, 255, 255);
                                        doc.setFont('helvetica', 'bold');
                                        doc.text('A', 19, 24);

                                        doc.setFontSize(22);
                                        doc.text('INSPECTION LOG REPORT', 105, 25, { align: 'center' });

                                        // Summary Block
                                        doc.setFillColor(248, 250, 252);
                                        doc.rect(14, 45, 182, 25, 'F');
                                        doc.setDrawColor(226, 232, 240);
                                        doc.rect(14, 45, 182, 25);

                                        doc.setFontSize(12);
                                        doc.setTextColor(30, 41, 59);
                                        doc.text('IMAGE SUMMARY', 20, 53);
                                        doc.setFont('helvetica', 'normal');
                                        doc.setFontSize(10);
                                        doc.text(`Filename: ${selectedImage.filename}`, 20, 62);
                                        doc.text(`Status: ${isAnomaly ? 'ANOMALY DETECTED' : 'NORMAL'}`, 120, 62);

                                        // Data Table
                                        autoTable(doc, {
                                            startY: 80,
                                            head: [['Parameter', 'Value']],
                                            body: [
                                                ['Image ID', selectedImage.id],
                                                ['User ID', selectedImage.user_id],
                                                ['Upload Date', new Date(selectedImage.upload_date).toLocaleString()],
                                                ['Anomaly Score', `${score}%`],
                                                ['Detection Status', isAnomaly ? 'Anomaly' : 'Passed'],
                                                ['File Path', selectedImage.file_path]
                                            ],
                                            theme: 'striped',
                                            headStyles: { fillColor: [59, 130, 246] },
                                            styles: { fontSize: 10 }
                                        });

                                        // Footer
                                        const finalY = doc.lastAutoTable.finalY + 20;
                                        doc.setFontSize(9);
                                        doc.setTextColor(150);
                                        doc.text('Disclaimer: This report is generated by the Automated AI Anomaly Detection System.', 105, finalY, { align: 'center' });

                                        doc.save(`Inspection_Report_${selectedImage.id}.pdf`);
                                    }}
                                >
                                    Generate Inspection Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageMonitoring;
