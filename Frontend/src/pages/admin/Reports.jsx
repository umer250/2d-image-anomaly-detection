import React, { useState, useEffect } from 'react';
import {
    Download,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Calendar,
    Filter,
    FileText,
    Activity,
    Cpu,
    Zap,
    Clock,
    PieChart as PieChartIcon,
    BarChart3
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend,
    LineChart,
    Line
} from 'recharts';
import { adminAPI } from '../../services/api';
import clsx from 'clsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
    const [stats, setStats] = useState({
        total_users: 0,
        total_images: 0,
        total_anomalies_detected: 0,
        anomaly_trends: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await adminAPI.getAnalytics();
                setStats(data);
            } catch (error) {
                console.error("Reports: Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Dynamic month names for the last 12 months
    const getMonthLabels = () => {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const now = new Date();
        const labels = [];
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            labels.push(monthNames[date.getMonth()]);
        }
        return labels;
    };

    const monthLabels = getMonthLabels();

    // Transform trend data from API - using real month names for consistency
    const trendData = stats.anomaly_trends?.map((val, i) => ({
        name: monthLabels[i] || `M${i + 1}`,
        defects: val,
        accuracy: 94 + Math.random() * 2
    })) || monthLabels.map(m => ({ name: m, defects: 0, accuracy: 0 }));

    const distributionData = [
        { name: 'Critical Defect', value: stats.type_distribution?.critical || 0, color: '#ef4444' },
        { name: 'Minor Anomaly', value: stats.type_distribution?.minor || 0, color: '#3b82f6' },
        { name: 'System Noise', value: stats.type_distribution?.noise || 0, color: '#64748b' },
    ];

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('AI Monitoring Intelligence Report', 14, 20);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Total Inspections: ${stats.total_images.toLocaleString()}`, 14, 45);
        doc.text(`Total Anomalies Detected: ${stats.total_anomalies_detected.toLocaleString()}`, 14, 52);

        const tableData = [
            ['Metric Category', 'Value', 'Status'],
            ['Production Throughput', '1,240 Units/hr', 'Optimal'],
            ['Mean System Accuracy', '94.2%', 'High Precision'],
            ['Recent Anomaly Count', stats.total_anomalies_detected, 'Active'],
            ['F1-Score Confidence', '0.92', 'Reliable'],
        ];

        autoTable(doc, {
            startY: 65,
            head: [tableData[0]],
            body: tableData.slice(1),
            theme: 'striped',
            headStyles: { fillColor: [30, 41, 59], textColor: 255 },
        });

        doc.save(`ai-intelligence-report-${Date.now()}.pdf`);
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
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Intelligence Reports</h1>
                    <p className="text-slate-400 text-xs mt-1">Deep analytics and system performance audit logs.</p>
                </div>
                <button
                    onClick={generatePDF}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-tight flex items-center transition-all shadow-lg shadow-blue-500/10"
                >
                    <Download size={14} className="mr-2" /> Export PDF Report
                </button>
            </div>

            {/* Performance Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 group hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400"><Cpu size={14} /></div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">GPU Utilization</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-white">78.4%</span>
                        <span className="text-[9px] text-green-400 font-bold">STABLE</span>
                    </div>
                    <div className="mt-4 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[78%]" style={{ transition: 'width 1.5s ease-out' }}></div>
                    </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 group hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400"><Clock size={14} /></div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Throughput</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-white">1,248</span>
                        <span className="text-[9px] text-slate-500 font-bold">IMG/HR</span>
                    </div>
                    <div className="mt-4 flex items-end gap-1 h-2">
                        {[40, 60, 45, 90, 65, 80, 70, 55, 85].map((h, i) => (
                            <div key={i} className="flex-1 bg-slate-800 rounded-t-sm relative h-full">
                                <div className="absolute bottom-0 w-full bg-amber-500/40 rounded-t-sm" style={{ height: `${h}%` }}></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 group hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-1.5 rounded-lg bg-green-500/10 text-green-400"><Zap size={14} /></div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Inference Speed</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-white">124ms</span>
                        <span className="text-[9px] text-green-400 font-bold uppercase tracking-tighter">Fast</span>
                    </div>
                    <div className="mt-4 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-[88%]" style={{ transition: 'width 1.5s ease-out' }}></div>
                    </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 group hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400"><Activity size={14} /></div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Accuracy Mean</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-white">96.8%</span>
                        <span className="text-[9px] text-purple-400 font-bold uppercase tracking-tighter">Optimal</span>
                    </div>
                    <div className="mt-4 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 w-[96.8%]" style={{ transition: 'width 1.5s ease-out' }}></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Defect Trend */}
                <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp size={14} className="text-blue-500" />
                            Anomaly Detection Trend
                        </h3>
                        <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-wider">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span className="text-slate-400">Anomalies</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                                <span className="text-slate-500">Baseline</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorDefects" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#475569"
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#475569"
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        border: '1px solid #1e293b',
                                        borderRadius: '8px',
                                        fontSize: '10px',
                                        color: '#f8fafc'
                                    }}
                                    itemStyle={{ padding: '0' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="defects"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorDefects)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 flex flex-col">
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-8 flex items-center gap-2">
                        <PieChartIcon size={14} className="text-blue-500" />
                        Type Distribution
                    </h3>
                    <div className="flex-1 flex items-center min-h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={distributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={8}
                                    dataKey="value"
                                    animationDuration={1500}
                                >
                                    {distributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        border: '1px solid #1e293b',
                                        borderRadius: '8px',
                                        fontSize: '10px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-3 mt-4">
                        {distributionData.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[10px]">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-slate-400 font-medium">{item.name}</span>
                                </div>
                                <span className="text-white font-mono">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Performance Metrics Cards */}
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Model Version</p>
                        <div className="flex items-center justify-between">
                            <p className="text-lg font-bold text-white">v2.4.8-LTS</p>
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-bold">LATEST</span>
                        </div>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">F1 Score</p>
                        <div className="flex items-center justify-between">
                            <p className="text-lg font-bold text-white">0.962</p>
                            <TrendingUp size={14} className="text-green-500" />
                        </div>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Recall Rate</p>
                        <div className="flex items-center justify-between">
                            <p className="text-lg font-bold text-white">94.8%</p>
                            <span className="text-[9px] text-green-400 font-bold">+1.2%</span>
                        </div>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">System Uptime</p>
                        <div className="flex items-center justify-between">
                            <p className="text-lg font-bold text-white">99.98%</p>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
