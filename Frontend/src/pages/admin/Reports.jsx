import React, { useState } from 'react';
import { BarChart, Download, Calendar, Filter, PieChart, Activity } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { adminAPI } from '../../services/api';

const Reports = () => {
    const [period, setPeriod] = useState('monthly');
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            const doc = new jsPDF();

            // Header
            doc.setFontSize(20);
            doc.setTextColor(41, 128, 185);
            doc.text('System Analysis Report', 14, 22);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

            // Fetch real data for report
            const users = await adminAPI.getUsers(0, 1000);

            // Statistics Summary
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text('User Registry Summary', 14, 45);

            const tableData = users.map(user => [
                user.full_name || 'N/A',
                user.email,
                user.role,
                user.is_active ? 'Active' : 'Inactive',
                new Date(user.created_at).toLocaleDateString()
            ]);

            autoTable(doc, {
                startY: 50,
                head: [['Name', 'Email', 'Role', 'Status', 'Joined']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            });

            doc.save('anomaly-detection-report.pdf');
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to generate report. Please try again.");
        } finally {
            setExporting(false);
        }
    };

    const [stats, setStats] = useState({ anomaly_trends: [] });

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await adminAPI.getAnalytics();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch report stats:", error);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-white flex items-center">
                    <BarChart className="mr-3 text-red-500" />
                    System Reports
                </h1>
                <div className="flex items-center space-x-4">
                    <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                        {['daily', 'weekly', 'monthly'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === p
                                    ? 'bg-zinc-800 text-white shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                    } capitalize`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-colors disabled:opacity-50"
                    >
                        {exporting ? (
                            <span className="flex items-center">Generating...</span>
                        ) : (
                            <>
                                <Download size={18} className="mr-2" />
                                Export PDF
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Trends Chart */}
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-white">Anomaly Trends</h3>
                            <p className="text-zinc-500 text-xs mt-1">Defect detection frequency over time</p>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-zinc-400">
                            <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div> Critical</span>
                            <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div> Minor</span>
                        </div>
                    </div>

                    <div className="h-72 flex items-end justify-between gap-2 px-2">
                        {/* Real Visual Graph */}
                        {(stats.anomaly_trends && stats.anomaly_trends.length > 0
                            ? stats.anomaly_trends
                            : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                        ).map((h, i) => {
                            const maxVal = Math.max(...(stats.anomaly_trends || [1])) || 1;
                            const heightPercent = Math.min((h / maxVal) * 100, 100);

                            return (
                                <div key={i} className="flex-1 group relative">
                                    <div className="absolute bottom-0 w-full bg-zinc-800/50 rounded-t-sm" style={{ height: '100%' }}></div>
                                    <div
                                        className="absolute bottom-0 w-full bg-gradient-to-t from-red-600/80 to-blue-500/80 rounded-t-sm transition-all duration-500 hover:from-red-500 hover:to-blue-400"
                                        style={{ height: `${heightPercent || 5}%` }}
                                    ></div>
                                    {/* Tooltip */}
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all z-10 whitespace-nowrap shadow-lg">
                                        {h} Detections
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] text-zinc-500 font-bold tracking-widest uppercase border-t border-zinc-800/50 pt-2">
                        <span>Period Start</span>
                        <span>Mid Period</span>
                        <span>Period End</span>
                    </div>
                </div>

                {/* Right Side Summary */}
                <div className="space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center">
                            <Activity size={16} className="mr-2" />
                            Efficiency Stats
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-2xl font-bold text-white">99.9%</span>
                                    <span className="text-xs text-green-500 font-medium mb-1">+0.02%</span>
                                </div>
                                <p className="text-xs text-zinc-500">System Uptime</p>
                            </div>
                            <div>
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-2xl font-bold text-white">128ms</span>
                                    <span className="text-xs text-zinc-500 font-medium mb-1">avg</span>
                                </div>
                                <p className="text-xs text-zinc-500">Inference Latency</p>
                            </div>
                            <div>
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-2xl font-bold text-white">1.2 TB</span>
                                    <span className="text-xs text-blue-500 font-medium mb-1">+12%</span>
                                </div>
                                <p className="text-xs text-zinc-500">Data Processed</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-900/20 to-zinc-900 border border-blue-500/20 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4">
                            Model Performance
                        </h3>
                        <div className="flex items-center justify-center p-4">
                            <div className="relative h-32 w-32 flex items-center justify-center">
                                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                                    <path className="text-zinc-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                    <path className="text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" strokeDasharray="94, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-2xl font-bold text-white">94%</span>
                                    <span className="text-[10px] text-zinc-400">Accuracy</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
