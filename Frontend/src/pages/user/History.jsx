import React, { useState, useEffect } from 'react';
import { resultsAPI } from '../../services/api';
import { History as HistoryIcon, Search, AlertCircle, CheckCircle, ChevronRight, X, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

const API_BASE = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api.*$/, '')
    : 'http://localhost:8000';

const getFullUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
};

const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null); // detail modal

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await resultsAPI.getHistory();
                setHistory(data);
            } catch (error) {
                console.error('Failed to fetch history:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const filtered = history.filter((item) => {
        const q = search.toLowerCase();
        return (
            (item.filename || '').toLowerCase().includes(q) ||
            (item.status || '').toLowerCase().includes(q) ||
            (item.category || '').toLowerCase().includes(q) ||
            (item.score != null ? item.score.toFixed(3) : '').includes(q)
        );
    });

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white flex items-center">
                    <HistoryIcon className="mr-3 text-indigo-500" />
                    Inspection History
                </h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by filename, status, category…"
                        className="bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 w-72 transition-all"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">Image Filename</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Result</th>
                                <th className="px-6 py-4">Score</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {loading ? (
                                Array(4).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-4">
                                            <div className="h-4 bg-zinc-800 rounded w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-zinc-500">
                                        {search ? `No results for "${search}"` : 'No history found.'}
                                    </td>
                                </tr>
                            ) : filtered.map((item) => (
                                <tr key={item.id} className="hover:bg-black/40 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white max-w-[180px] truncate" title={item.filename}>
                                        {item.filename || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-xs font-semibold capitalize">
                                            {item.category || 'bottle'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-400 text-xs">
                                        {item.upload_date ? new Date(item.upload_date).toLocaleString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            {item.status === 'Anomaly' ? (
                                                <AlertCircle className="text-red-500 mr-2" size={15} />
                                            ) : (
                                                <CheckCircle className="text-green-500 mr-2" size={15} />
                                            )}
                                            <span className={item.status === 'Anomaly' ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-zinc-400 text-xs">
                                        {item.score != null ? item.score.toFixed(3) : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setSelected(item)}
                                            className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center justify-end gap-1 ml-auto text-xs"
                                        >
                                            View Details <ChevronRight size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selected && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                    <div
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                            <div>
                                <h2 className="text-lg font-bold text-white">{selected.filename || 'Analysis Detail'}</h2>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    {selected.upload_date ? new Date(selected.upload_date).toLocaleString() : ''} · {selected.category || 'bottle'}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={clsx(
                                    'px-3 py-1 rounded-full text-xs font-bold border',
                                    selected.status === 'Anomaly'
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                        : 'bg-green-500/10 text-green-400 border-green-500/20'
                                )}>
                                    {selected.status}
                                </span>
                                <button onClick={() => setSelected(null)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* 4-panel grid */}
                        <div className="p-6 grid grid-cols-2 gap-4">
                            {[
                                { label: '1. Original Image', path: selected.file_path },
                                { label: '2. Anomaly Map (Hot)', path: selected.hot_map_path },
                                { label: '3. Heatmap Overlay', path: selected.heatmap_path },
                                { label: '4. Defect Contours', path: selected.contour_path },
                            ].map((panel) => (
                                <div key={panel.label} className="flex flex-col gap-2">
                                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">{panel.label}</p>
                                    <div className="bg-black rounded-xl border border-zinc-800 h-52 flex items-center justify-center overflow-hidden">
                                        {panel.path ? (
                                            <img
                                                src={getFullUrl(panel.path)}
                                                alt={panel.label}
                                                className="max-h-full w-auto object-contain"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center text-zinc-700">
                                                <Maximize2 size={24} className="mb-1 opacity-50" />
                                                <span className="text-xs">Not Available</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Score row */}
                        <div className="px-6 pb-6 grid grid-cols-3 gap-4">
                            {[
                                { label: 'Anomaly Score', value: selected.score != null ? selected.score.toFixed(3) : 'N/A' },
                                { label: 'Threshold', value: selected.threshold != null ? selected.threshold.toFixed(3) : 'N/A' },
                                { label: 'Model', value: selected.model_version || 'PatchCore' },
                            ].map((s) => (
                                <div key={s.label} className="bg-zinc-950 rounded-xl border border-zinc-800 p-4 text-center">
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1">{s.label}</p>
                                    <p className="text-lg font-black text-white font-mono">{s.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default History;
