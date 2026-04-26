import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
    Users, ImageIcon, AlertTriangle, CheckCircle,
    Activity, Download, BarChart as BarChartIcon, TrendingUp
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AppLogo from '../../components/icons/AppLogo';

const CATEGORY_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
    '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#0ea5e9'
];

// Format date label: show "Mon Apr 14" style
const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

// Custom tooltip for activity chart
const ActivityTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = new Date(label);
    return (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-xl text-xs font-sans">
            <p className="text-zinc-400 mb-1 font-semibold">
                {d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-indigo-400 font-bold">{payload[0].value} Predictions</p>
        </div>
    );
};

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch(`${API_BASE}/admin/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch dashboard stats');
                const data = await response.json();
                setStats(data);
                setError(null);
            } catch (err) {
                setError(err.message || 'Unable to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [API_BASE]);

    const generatePDF = () => {
        if (!stats) return;
        const doc = new jsPDF();

        // Header bar
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 38, 'F');

        // Logo placeholder square
        doc.setFillColor(99, 102, 241);
        doc.roundedRect(14, 10, 18, 18, 3, 3, 'F');
        doc.setFontSize(13);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('AD', 18, 23);

        doc.setFontSize(18);
        doc.text('AnomalyDetect — Admin Report', 40, 20);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 180, 200);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 29);

        const anomalyRate = stats.anomaly_rate ?? stats.anomaly_rate_percent ?? 0;
        const normalRate = (100 - parseFloat(anomalyRate)).toFixed(1);

        autoTable(doc, {
            startY: 48,
            head: [['Metric', 'Value']],
            body: [
                ['Total Registered Users', stats.total_users],
                ['Total Predictions Made', stats.total_predictions],
                ['Anomalies Detected', stats.anomaly_count],
                ['Normal Images', stats.normal_count],
                ['Anomaly Rate', `${anomalyRate}%`],
                ['Normal Rate', `${normalRate}%`],
            ],
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
            styles: { font: 'helvetica', fontSize: 10 },
        });

        doc.save(`admin-report-${Date.now()}.pdf`);
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="h-8 w-48 bg-zinc-800 rounded" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-zinc-900 rounded-xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="h-[400px] bg-zinc-900 rounded-xl" />
                    <div className="h-[400px] bg-zinc-900 rounded-xl" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-4">
                <AlertTriangle size={32} />
                <div>
                    <h3 className="font-bold text-lg font-outfit">Error Loading Dashboard</h3>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    const anomalyRate = stats.total_predictions > 0 
        ? ((stats.anomaly_count / stats.total_predictions) * 100).toFixed(1) 
        : '0.0';
    const normalRate = stats.total_predictions > 0 
        ? (100 - parseFloat(anomalyRate)).toFixed(1) 
        : '100.0';

    // Activity chart data — enrich with formatted label
    const lineData = (stats?.activity_last_7_days || []).map(item => ({
        date: item.date,
        count: item.count,
        label: formatDateLabel(item.date),
    }));

    // Category bar chart
    const categoryData = Object.entries(stats?.predictions_per_category || {})
        .map(([category, value]) => ({
            category: category.replace(/_/g, ' '),
            count: typeof value === 'object' ? value.count : value,
            anomaly_count: typeof value === 'object' ? value.anomaly_count : 0,
        }))
        .filter(d => d.count > 0)
        .sort((a, b) => b.count - a.count);

    const statCards = [
        { name: 'Total Users', value: stats.total_users, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', glow: 'hover:shadow-blue-500/10' },
        { name: 'Total Predictions', value: stats.total_predictions, icon: ImageIcon, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', glow: 'hover:shadow-indigo-500/10' },
        { name: 'Anomaly Rate', value: `${anomalyRate}%`, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', glow: 'hover:shadow-red-500/10', sub: `${stats.anomaly_count} anomalies` },
        { name: 'Normal Rate', value: `${normalRate}%`, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', glow: 'hover:shadow-green-500/10', sub: `${stats.normal_count} normal` },
    ];

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight font-outfit">System Overview</h1>
                    <p className="text-zinc-400 text-sm mt-1 font-sans">Real-time metrics and historical inspection analytics.</p>
                </div>
                <button
                    onClick={generatePDF}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
                >
                    <Download size={16} className="mr-2" /> Export Report
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((c, i) => (
                    <div
                        key={i}
                        className={`bg-zinc-900 border ${c.border} rounded-xl p-5 shadow-sm relative overflow-hidden
                            transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${c.glow} cursor-default`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2.5 rounded-lg ${c.bg} ${c.color}`}><c.icon size={20} /></div>
                            {c.sub && (
                                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">{c.sub}</span>
                            )}
                        </div>
                        <h3 className="text-xs font-bold text-zinc-400 mb-1 uppercase tracking-widest font-sans">{c.name}</h3>
                        <p className="text-3xl font-bold text-white font-outfit">{c.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 7-Day Activity Chart */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="text-indigo-400" size={18} />
                        <h3 className="text-base font-bold text-white font-outfit">Activity — Last 7 Days</h3>
                    </div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-6 ml-6">
                        Predictions per day
                    </p>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer>
                            <AreaChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#52525b"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={formatDateLabel}
                                    dy={8}
                                    tick={{ fontFamily: 'Inter, sans-serif', fill: '#71717a' }}
                                />
                                <YAxis
                                    stroke="#52525b"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                    tick={{ fontFamily: 'Inter, sans-serif', fill: '#71717a' }}
                                />
                                <Tooltip content={<ActivityTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    name="Predictions"
                                    stroke="#6366f1"
                                    strokeWidth={2.5}
                                    fill="url(#colorCount)"
                                    dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }}
                                    activeDot={{ r: 5, fill: '#818cf8' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Bar Chart */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <BarChartIcon className="text-blue-400" size={18} />
                        <h3 className="text-base font-bold text-white font-outfit">Predictions by Category</h3>
                    </div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-6 ml-6">
                        Total inspections per model category
                    </p>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer>
                            <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis
                                    dataKey="category"
                                    stroke="#52525b"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    angle={-40}
                                    textAnchor="end"
                                    tick={{ fontFamily: 'Inter, sans-serif', fill: '#71717a' }}
                                />
                                <YAxis
                                    stroke="#52525b"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                    tick={{ fontFamily: 'Inter, sans-serif', fill: '#71717a' }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#27272a', opacity: 0.5 }}
                                    contentStyle={{
                                        backgroundColor: '#18181b',
                                        borderColor: '#3f3f46',
                                        borderRadius: '10px',
                                        color: '#e4e4e7',
                                        fontFamily: 'Inter, sans-serif',
                                        fontSize: '11px',
                                    }}
                                    formatter={(value, name) => [value, name === 'count' ? 'Total' : 'Anomalies']}
                                />
                                <Bar dataKey="count" name="count" radius={[4, 4, 0, 0]}>
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Summary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4">
                    <TrendingUp className="text-indigo-400 shrink-0" size={20} />
                    <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold font-sans">Anomaly Rate</p>
                        <p className="text-xs text-zinc-300 mt-1 font-sans">
                            Rate = (Anomalies / Total) × 100
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5 font-sans">
                            {stats.anomaly_count} / {stats.total_predictions} × 100 = <span className="text-red-400 font-bold">{anomalyRate}%</span>
                        </p>
                    </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4">
                    <CheckCircle className="text-green-400 shrink-0" size={20} />
                    <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold font-sans">Normal Rate</p>
                        <p className="text-xs text-zinc-300 mt-1 font-sans">
                            Rate = 100% − Anomaly Rate
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5 font-sans">
                            100 − {anomalyRate} = <span className="text-green-400 font-bold">{normalRate}%</span>
                        </p>
                    </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-4">
                    <ImageIcon className="text-blue-400 shrink-0" size={20} />
                    <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold font-sans">Total Inspections</p>
                        <p className="text-2xl font-bold text-white font-outfit mt-1">{stats.total_predictions}</p>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
