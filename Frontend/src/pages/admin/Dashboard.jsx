import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { 
    Users, ImageIcon, AlertTriangle, CheckCircle, 
    Activity, Download, BarChart as BarChartIcon 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Recharts colors for categorical data
const CATEGORY_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', 
    '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#0ea5e9'
];

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

                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard stats');
                }

                const data = await response.json();
                setStats(data);
                setError(null);
            } catch (err) {
                console.error("Dashboard error:", err);
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
        doc.setFontSize(22);
        doc.text('Admin System Report', 14, 20);
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        const tableData = [
            ['Metric', 'Value'],
            ['Total Registered Users', stats.total_users],
            ['Total Predictions Made', stats.total_predictions],
            ['Anomalies Detected', stats.anomaly_count],
            ['Normal Images', stats.normal_count],
            ['Anomaly Rate', `${stats.anomaly_rate_percent}%`],
        ];

        autoTable(doc, {
            startY: 40,
            head: [tableData[0]],
            body: tableData.slice(1),
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241], textColor: 255 },
        });

        doc.save(`admin-report-${Date.now()}.pdf`);
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="flex justify-between items-center"><div className="h-8 w-48 bg-zinc-800 rounded" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1,2,3,4].map(i => <div key={i} className="h-32 bg-zinc-900 rounded-xl" />)}
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
                    <h3 className="font-bold text-lg">Error Loading Dashboard</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    // Prepare data for line chart (Activity last 7 days)
    const lineData = (stats?.activity_last_7_days || []).map(item => ({
        date: item.date,
        count: item.count
    }));

    // Prepare data for bar chart (Predictions per category)
    const categoryData = Object.entries(stats?.predictions_per_category || {})
        .map(([category, count]) => ({ category: category.replace('_', ' '), count }))
        .sort((a, b) => b.count - a.count); // sort descending

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">System Overview</h1>
                    <p className="text-zinc-400 text-sm mt-1">Real-time metrics and historical inspection analytics.</p>
                </div>
                <button
                    onClick={generatePDF}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-all shadow-sm"
                >
                    <Download size={16} className="mr-2" /> Export Report
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { name: 'Total Users', value: stats.total_users, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                    { name: 'Total Predictions', value: stats.total_predictions, icon: ImageIcon, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
                    { name: 'Anomaly Rate', value: `${stats.anomaly_rate_percent}%`, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
                    { name: 'Normal Rate', value: `${(100 - parseFloat(stats.anomaly_rate_percent || 0)).toFixed(1)}%`, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
                ].map((c, i) => (
                    <div key={i} className={`bg-zinc-900 border ${c.border} rounded-xl p-5 shadow-sm relative overflow-hidden`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2.5 rounded-lg ${c.bg} ${c.color}`}><c.icon size={20} /></div>
                        </div>
                        <h3 className="text-sm font-medium text-zinc-400 mb-1">{c.name}</h3>
                        <p className="text-3xl font-bold text-white">{c.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 7-Day Activity Line Chart */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Activity className="text-indigo-400" size={20} />
                        <h3 className="text-lg font-bold text-white">Activity (Last 7 Days)</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer>
                            <AreaChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#e4e4e7' }}
                                    itemStyle={{ color: '#818cf8' }}
                                />
                                <Area type="monotone" dataKey="count" name="Predictions" stroke="#6366f1" strokeWidth={3} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Bar Chart */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChartIcon className="text-blue-400" size={20} />
                        <h3 className="text-lg font-bold text-white">Predictions by Category</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer>
                            <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="category" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} angle={-45} textAnchor="end" />
                                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    cursor={{fill: '#27272a', opacity: 0.4}}
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#e4e4e7' }}
                                />
                                <Bar dataKey="count" name="Total Images" radius={[4, 4, 0, 0]}>
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
