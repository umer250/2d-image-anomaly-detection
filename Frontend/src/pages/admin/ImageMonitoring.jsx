import React, { useState, useEffect } from 'react';
import {
    Search, Filter, Image as ImageIcon, AlertTriangle,
    CheckCircle, X, Calendar, Activity, Shield, Eye, Layers, Cpu, LayoutGrid
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import clsx from 'clsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '').replace('/api', '') || 'http://localhost:8000';

const getFullImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const clean = path.replace(/\\/g, '/');
    return clean.startsWith('/') ? clean : `/${clean}`;
};

// Severity label based on anomaly score
const getSeverity = (score) => {
    if (score >= 0.85) return { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' };
    if (score >= 0.60) return { label: 'Major', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    if (score >= 0.40) return { label: 'Minor', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
    return { label: 'Trace', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
};

// 4-view panel tabs — 5 views total
const VIEW_TABS = [
    { key: 'original',    label: 'Original',   icon: Eye,        pathKey: 'file_path' },
    { key: 'heatmap',     label: 'Heatmap',    icon: Layers,     pathKey: 'heatmap_path' },
    { key: 'hotmap',      label: 'HOT Map',    icon: Activity,   pathKey: 'hot_map_path' },
    { key: 'contour',     label: 'Contours',   icon: Cpu,        pathKey: 'contour_path' },
    { key: 'comparison',  label: 'Comparison', icon: LayoutGrid, pathKey: 'comparison_path' },
];

const ImageMonitoring = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [activeView, setActiveView] = useState('grid');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [confidenceThreshold, setConfidenceThreshold] = useState(70);

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const response = await adminAPI.getImages();
                setImages(response.images || []);
            } catch (err) {
                console.error('ImageMonitoring fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchImages();
    }, []);

    // Reset to grid view when image changes
    useEffect(() => { setActiveView('grid'); }, [selectedImage]);

    const defectCount = images.filter(i => i.results?.[0]?.is_anomaly).length;
    const passedCount = images.filter(i => !i.results?.[0]?.is_anomaly).length;
    const defectRate = images.length > 0 ? ((defectCount / images.length) * 100).toFixed(1) : '0.0';

    const filteredImages = images.filter(img => {
        const name = img.filename || '';
        const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
        const isAnomaly = img.results?.[0]?.is_anomaly;
        const matchFilter =
            filter === 'all' ||
            (filter === 'defect' && isAnomaly) ||
            (filter === 'passed' && !isAnomaly);
        return matchSearch && matchFilter;
    });

    const generateReport = (img) => {
        const doc = new jsPDF();
        const result = img.results?.[0] || {};
        const isAnomaly = result.is_anomaly;
        const score = ((result.anomaly_score || 0) * 100).toFixed(2);
        const threshold = result.threshold ? (result.threshold * 100).toFixed(2) : 'N/A';

        // Header
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 38, 'F');
        doc.setFillColor(99, 102, 241);
        doc.roundedRect(14, 10, 18, 18, 3, 3, 'F');
        doc.setFontSize(13);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('AD', 18, 23);
        doc.setFontSize(16);
        doc.text('AnomalyDetect — Inspection Report', 40, 20);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 180, 200);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 29);

        autoTable(doc, {
            startY: 48,
            head: [['Parameter', 'Value']],
            body: [
                ['Image Filename', img.filename],
                ['Image ID', img.id],
                ['User ID', img.user_id],
                ['Upload Date', new Date(img.upload_date).toLocaleString()],
                ['Detection Status', isAnomaly ? 'ANOMALY DETECTED' : 'NORMAL'],
                ['Anomaly Score', `${score}%`],
                ['Decision Threshold', `${threshold}%`],
                ['Threshold Formula', 'score > threshold → Anomaly'],
                ['Severity', isAnomaly ? getSeverity(result.anomaly_score || 0).label : 'None'],
                ['Model Version', result.model_version || 'PatchCore v2'],
                ['Category', img.category || 'bottle'],
            ],
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 10, font: 'helvetica' },
        });

        const finalY = doc.lastAutoTable.finalY + 14;
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text('AnomalyDetect — Automated AI Anomaly Detection System', 105, finalY, { align: 'center' });

        doc.save(`Inspection_${img.id}_${img.filename}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight font-outfit">Image Monitoring</h1>
                    <p className="text-zinc-400 text-sm mt-1 font-sans">Track and audit all system inspections in real-time.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                        <input
                            type="text"
                            placeholder="Search by filename..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-9 pr-4 text-sm text-white font-sans outline-none focus:border-indigo-500/50 w-56 transition-all placeholder:text-zinc-600"
                        />
                    </div>
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={clsx(
                            'p-2 rounded-lg border transition-all',
                            showAdvanced
                                ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-400'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        )}
                    >
                        <Filter size={16} />
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Defects', value: defectCount, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
                    { label: 'Passed Units', value: passedCount, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
                    { label: 'Total Logs', value: images.length, icon: ImageIcon, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
                    { label: 'Defect Rate', value: `${defectRate}%`, icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                ].map((s, i) => (
                    <div key={i} className={`bg-zinc-900 border ${s.border} rounded-xl p-4 flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:shadow-lg`}>
                        <div className={`p-2 rounded-lg ${s.bg} ${s.color} shrink-0`}><s.icon size={18} /></div>
                        <div>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-sans">{s.label}</p>
                            <p className="text-xl font-bold text-white font-outfit">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                        {['all', 'defect', 'passed'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={clsx(
                                    'px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all font-sans',
                                    filter === f ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                                )}
                            >
                                {f === 'defect' ? 'Anomalies' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                    <span className="text-[10px] text-zinc-600 font-sans">{filteredImages.length} result{filteredImages.length !== 1 ? 's' : ''}</span>
                </div>

                {showAdvanced && (
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-wrap items-center gap-8 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-4">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-sans">Confidence Threshold</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range" min="50" max="99"
                                    value={confidenceThreshold}
                                    onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                                    className="w-36 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                <span className="text-xs font-mono text-indigo-400 font-bold">{confidenceThreshold}%</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield size={13} className="text-zinc-600" />
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-sans">Log Policy: Auto-Purge 30d</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Image Grid */}
            {filteredImages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredImages.map((img) => {
                        const result = img.results?.[0] || {};
                        const isAnomaly = result.is_anomaly;
                        const score = result.anomaly_score || 0;
                        const severity = getSeverity(score);

                        return (
                            <div
                                key={img.id}
                                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group hover:border-zinc-700 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
                                onClick={() => setSelectedImage(img)}
                            >
                                {/* Thumbnail */}
                                <div className="relative aspect-[4/3] overflow-hidden bg-black">
                                    <img
                                        src={getFullImageUrl(img.file_path)}
                                        alt={img.filename}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <div className={clsx(
                                        'absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1 backdrop-blur-md border',
                                        isAnomaly ? 'bg-red-500/20 text-red-400 border-red-500/20' : 'bg-green-500/20 text-green-400 border-green-500/20'
                                    )}>
                                        {isAnomaly ? <AlertTriangle size={9} /> : <CheckCircle size={9} />}
                                        {isAnomaly ? 'Anomaly' : 'Normal'}
                                    </div>
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="bg-white text-black px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight shadow-xl translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                            View Details
                                        </span>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4 space-y-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <p className="text-xs font-semibold text-zinc-200 truncate flex-1 font-sans" title={img.filename}>
                                            {img.filename}
                                        </p>
                                        <div className="flex items-center gap-1 text-zinc-500 shrink-0">
                                            <Calendar size={9} />
                                            <span className="text-[9px] font-sans">{new Date(img.upload_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {isAnomaly && (
                                        <span className={clsx('inline-flex text-[9px] font-bold uppercase px-2 py-0.5 rounded border font-sans', severity.color, severity.bg, severity.border)}>
                                            {severity.label}
                                        </span>
                                    )}

                                    {/* Score bar */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[9px] font-sans">
                                            <span className="text-zinc-500 font-bold uppercase tracking-wider">Anomaly Score</span>
                                            <span className={clsx('font-bold', isAnomaly ? 'text-red-400' : 'text-green-400')}>
                                                {(score * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={clsx('h-full rounded-full transition-all duration-1000', isAnomaly ? 'bg-red-500' : 'bg-green-500')}
                                                style={{ width: `${Math.min(score * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                    <div className="p-4 rounded-full bg-zinc-800/50 mb-4">
                        <ImageIcon className="text-zinc-600" size={28} />
                    </div>
                    <p className="text-zinc-400 text-sm font-medium font-sans">No results found</p>
                    <button
                        onClick={() => { setSearchQuery(''); setFilter('all'); }}
                        className="mt-4 text-indigo-400 text-xs font-bold uppercase hover:underline font-sans"
                    >
                        Clear Filters
                    </button>
                </div>
            )}

            {/* Detail Modal */}
            {selectedImage && (() => {
                const result = selectedImage.results?.[0] || {};
                const isAnomaly = result.is_anomaly;
                const score = result.anomaly_score || 0;
                const threshold = result.threshold;
                const severity = getSeverity(score);

                // Build view paths
                const viewPaths = {
                    original:   selectedImage.file_path,
                    heatmap:    result.heatmap_path,
                    hotmap:     result.hot_map_path,
                    contour:    result.contour_path,
                    comparison: result.comparison_path,
                };
                const currentPath = viewPaths[activeView] || selectedImage.file_path;

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                            onClick={() => setSelectedImage(null)}
                        />
                        <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                            {/* Modal Header */}
                            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50 shrink-0">
                                <div>
                                    <h2 className="text-base font-bold text-white font-outfit">{selectedImage.filename}</h2>
                                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {selectedImage.id} · User: {selectedImage.user_id}</p>
                                </div>
                                <button onClick={() => setSelectedImage(null)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-all">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
                                {/* Left: Image viewer with tabs + 2×2 grid */}
                                <div className="flex-1 space-y-3">
                                    {/* View tabs */}
                                    <div className="flex gap-1 bg-zinc-950/60 rounded-lg p-1 border border-zinc-800 flex-wrap">
                                        {/* Grid view button */}
                                        <button
                                            onClick={() => setActiveView('grid')}
                                            className={clsx(
                                                'flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all font-sans',
                                                activeView === 'grid'
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                            )}
                                        >
                                            <LayoutGrid size={11} /> All Views
                                        </button>
                                        {VIEW_TABS.filter(t => t.key !== 'comparison').map((tab) => {
                                            const hasPath = tab.key === 'original' ? !!selectedImage.file_path : !!result[tab.pathKey];
                                            return (
                                                <button
                                                    key={tab.key}
                                                    onClick={() => hasPath && setActiveView(tab.key)}
                                                    disabled={!hasPath}
                                                    className={clsx(
                                                        'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all font-sans',
                                                        activeView === tab.key
                                                            ? 'bg-indigo-600 text-white shadow-sm'
                                                            : hasPath
                                                                ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                                                : 'text-zinc-700 cursor-not-allowed'
                                                    )}
                                                >
                                                    <tab.icon size={11} />
                                                    {tab.label}
                                                </button>
                                            );
                                        })}
                                        {/* Comparison tab */}
                                        {result.comparison_path && (
                                            <button
                                                onClick={() => setActiveView('comparison')}
                                                className={clsx(
                                                    'flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all font-sans',
                                                    activeView === 'comparison'
                                                        ? 'bg-indigo-600 text-white shadow-sm'
                                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                                )}
                                            >
                                                <LayoutGrid size={11} /> Comparison
                                            </button>
                                        )}
                                    </div>

                                    {/* 2×2 Grid view */}
                                    {activeView === 'grid' ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { key: 'original',  label: 'Original',  path: selectedImage.file_path },
                                                { key: 'heatmap',   label: 'Heatmap',   path: result.heatmap_path },
                                                { key: 'hotmap',    label: 'HOT Map',   path: result.hot_map_path },
                                                { key: 'contour',   label: 'Contours',  path: result.contour_path },
                                            ].map(({ key, label, path: p }) => (
                                                <div
                                                    key={key}
                                                    className="relative rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 aspect-square cursor-pointer hover:border-indigo-500/50 transition-all group"
                                                    onClick={() => p && setActiveView(key)}
                                                >
                                                    {p ? (
                                                        <img
                                                            src={getFullImageUrl(p)}
                                                            alt={label}
                                                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs font-sans">
                                                            Not available
                                                        </div>
                                                    )}
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm px-2 py-1 text-[9px] font-bold uppercase text-zinc-300 font-sans tracking-wider">
                                                        {label}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        /* Single view */
                                        <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-zinc-800">
                                            {currentPath ? (
                                                <img
                                                    src={getFullImageUrl(currentPath)}
                                                    alt={activeView}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm font-sans">
                                                    No {activeView} available
                                                </div>
                                            )}
                                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[9px] font-bold uppercase text-zinc-400 border border-zinc-700 font-sans">
                                                {VIEW_TABS.find(t => t.key === activeView)?.label || activeView}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Details panel */}
                                <div className="w-full lg:w-72 space-y-4 shrink-0">
                                    {/* Status */}
                                    <div className="bg-zinc-950/60 rounded-xl p-5 border border-zinc-800 space-y-4">
                                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-sans">Inference Result</h4>

                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-sans">Status</span>
                                            <span className={clsx(
                                                'px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border font-sans',
                                                isAnomaly ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'
                                            )}>
                                                {isAnomaly ? 'Anomaly' : 'Normal'}
                                            </span>
                                        </div>

                                        {isAnomaly && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-sans">Severity</span>
                                                <span className={clsx('px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border font-sans', severity.color, severity.bg, severity.border)}>
                                                    {severity.label}
                                                </span>
                                            </div>
                                        )}

                                        {/* Anomaly Score */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-sans">Anomaly Score</span>
                                                <span className="text-lg font-bold text-white font-outfit">{(score * 100).toFixed(2)}%</span>
                                            </div>
                                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className={clsx('h-full rounded-full transition-all duration-700', isAnomaly ? 'bg-red-500' : 'bg-green-500')}
                                                    style={{ width: `${Math.min(score * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Threshold */}
                                        {threshold != null && (
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-sans">Threshold</span>
                                                    <span className="text-sm font-bold text-indigo-400 font-outfit">{(threshold * 100).toFixed(2)}%</span>
                                                </div>
                                                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500/60 rounded-full" style={{ width: `${Math.min(threshold * 100, 100)}%` }} />
                                                </div>
                                                <p className="text-[9px] text-zinc-600 mt-1.5 font-sans">
                                                    Formula: score ({(score * 100).toFixed(1)}%) {'>'} threshold ({(threshold * 100).toFixed(1)}%) → {isAnomaly ? 'Anomaly ✓' : 'Normal ✓'}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Metadata */}
                                    <div className="bg-zinc-950/60 rounded-xl p-5 border border-zinc-800 space-y-3">
                                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-sans">Metadata</h4>
                                        {[
                                            { label: 'Filename', value: selectedImage.filename },
                                            { label: 'Upload Date', value: new Date(selectedImage.upload_date).toLocaleString() },
                                            { label: 'Category', value: selectedImage.category || 'bottle' },
                                            { label: 'Model', value: result.model_version || 'PatchCore v2' },
                                            { label: 'User ID', value: `#${selectedImage.user_id}` },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="flex justify-between items-start gap-2 text-[10px] font-sans">
                                                <span className="text-zinc-500 font-bold uppercase tracking-wider shrink-0">{label}</span>
                                                <span className="text-zinc-300 text-right break-all">{value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Export button */}
                                    <button
                                        onClick={() => generateReport(selectedImage)}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-900/20 transition-all active:scale-95 font-sans"
                                    >
                                        Export Inspection Report
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default ImageMonitoring;
