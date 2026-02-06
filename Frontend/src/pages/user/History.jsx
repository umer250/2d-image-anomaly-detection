import React, { useState, useEffect } from 'react';
import { resultsAPI } from '../../services/api';
import { History as HistoryIcon, Search, Calendar, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await resultsAPI.getHistory();
                setHistory(data);
            } catch (error) {
                console.error("Failed to fetch history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white flex items-center">
                    <HistoryIcon className="mr-3 text-blue-500" />
                    Inspection History
                </h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search history..."
                        className="bg-zinc-900 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50"
                    />
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">Image Filename</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Result</th>
                                <th className="px-6 py-4">Score</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-6 py-4"><div className="h-4 bg-zinc-800 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : history.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center text-zinc-500">No history found.</td>
                                </tr>
                            ) : history.map((item) => (
                                <tr key={item.id} className="hover:bg-black/40 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{item.filename || 'Unknown'}</td>
                                    <td className="px-6 py-4 text-zinc-400">
                                        {item.upload_date ? new Date(item.upload_date).toLocaleString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            {item.status === 'Anomaly' ? (
                                                <AlertCircle className="text-red-500 mr-2" size={16} />
                                            ) : (
                                                <CheckCircle className="text-green-500 mr-2" size={16} />
                                            )}
                                            <span className={item.status === 'Anomaly' ? 'text-red-400' : 'text-green-400'}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-zinc-400">{item.score ? item.score.toFixed(2) : 'N/A'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Link to={`/results`} state={{ fromHistory: true }} className="text-blue-500 hover:text-blue-400 font-medium flex items-center justify-end">
                                            View Details
                                            <ChevronRight size={16} className="ml-1" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default History;
