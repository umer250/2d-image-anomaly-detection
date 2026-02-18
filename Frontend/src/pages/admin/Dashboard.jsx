import React, { useEffect, useState } from 'react';
import {
    Users,
    Image as ImageIcon,
    AlertTriangle,
    Activity,
    CheckCircle,
    TrendingUp,
    Download
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        total_users: 0,
        total_images: 0,
        total_anomalies_detected: 0,
        active_users: 0,
        model_version: 'v1.0'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await adminAPI.getAnalytics();
                setStats(data);
            } catch (error) {
                console.error("AdminDashboard: Failed to fetch stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const cards = [
        {
            name: 'Total Users',
            value: stats.total_users,
            icon: Users,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            desc: 'Registered system users'
        },
        {
            name: 'Total Inspections',
            value: stats.total_images,
            icon: ImageIcon,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20',
            desc: 'Images processed'
        },
        {
            name: 'Defects Found',
            value: stats.total_anomalies_detected,
            icon: AlertTriangle,
            color: 'text-red-400',
            bg: 'bg-red-500/10',
            border: 'border-red-500/20',
            desc: 'Anomalies identified'
        },
        {
            name: 'Passed',
            value: Math.max(0, stats.total_images - stats.total_anomalies_detected),
            icon: CheckCircle,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            desc: 'Clean inspections'
        }
    ];

    // Build chart data from available stats
    const chartData = [
        { name: 'Total Users', value: stats.total_users, fill: '#3b82f6' },
        { name: 'Inspections', value: stats.total_images, fill: '#a855f7' },
        { name: 'Defects', value: stats.total_anomalies_detected, fill: '#ef4444' },
        { name: 'Passed', value: Math.max(0, stats.total_images - stats.total_anomalies_detected), fill: '#10b981' },
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-zinc-900 border border-zinc-700 px-4 py-3 rounded-xl shadow-2xl">
                    <p className="text-zinc-400 text-xs font-semibold mb-1 font-outfit">{label}</p>
                    <p className="text-white font-black text-lg font-outfit">{payload[0].value}</p>
                </div>
            );
        }
        return null;
    };

    const handleExport = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.setTextColor(59, 130, 246);
        doc.text('Admin Dashboard Report', 14, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('System Overview', 14, 45);
        const statsData = [
            ['Metric', 'Value'],
            ['Total Users', stats.total_users],
            ['Total Images', stats.total_images],
            ['Anomalies Detected', stats.total_anomalies_detected],
            ['Healthy Images', stats.total_images - stats.total_anomalies_detected],
            ['Active Users', stats.active_users],
            ['Model Version', stats.model_version],
        ];
        autoTable(doc, {
            startY: 50,
            head: [statsData[0]],
            body: statsData.slice(1),
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        });
        const finalY = (doc.lastAutoTable.finalY || 50) + 10;
        doc.setFontSize(12);
        doc.text('System Health Status', 14, finalY);
        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(`Current Model Accuracy: 94.2%`, 14, finalY + 8);
        doc.text(`Average Latency: 128ms`, 14, finalY + 14);
        doc.save('admin-dashboard-report.pdf');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
                        Admin Overview
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1">Monitor system performance and defect analytics.</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center px-5 py-2.5 bg-white text-black rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors shadow-lg"
                >
                    <Download size={16} className="mr-2" />
                    Export Report
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => (
                    <motion.div
                        key={card.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className={clsx(
                            "bg-zinc-900/50 border rounded-2xl p-6 hover:bg-zinc-900 transition-all duration-300 shadow-xl backdrop-blur-sm",
                            card.border
                        )}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <div className={clsx("p-3 rounded-xl", card.bg)}>
                                <card.icon size={22} className={card.color} />
                            </div>
                        </div>
                        <div>
                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{card.name}</p>
                            <h3
                                className="text-4xl font-black text-white mt-1 leading-none"
                                style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                            >
                                {card.value.toLocaleString()}
                            </h3>
                            <p className="text-zinc-500 text-xs mt-3">{card.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* System Stats Chart */}
                <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3
                            className="text-lg font-bold text-white flex items-center"
                            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                        >
                            <Activity className="mr-2 text-blue-500" size={20} />
                            System Statistics
                        </h3>
                    </div>

                    {stats.total_images === 0 ? (
                        <div className="h-[300px] flex flex-col items-center justify-center text-center">
                            <Activity size={40} className="text-zinc-700 mb-4" />
                            <p className="text-zinc-500 font-semibold text-sm">No data yet</p>
                            <p className="text-zinc-600 text-xs mt-1">Stats will appear once images are processed</p>
                        </div>
                    ) : (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
                                    barSize={40}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#52525b"
                                        tick={{ fill: '#71717a', fontSize: 11, fontFamily: "'Inter', sans-serif" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        stroke="#52525b"
                                        tick={{ fill: '#71717a', fontSize: 11, fontFamily: "'Inter', sans-serif" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Model Info */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                    <h3
                        className="text-lg font-bold text-white mb-6 flex items-center"
                        style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                    >
                        <TrendingUp className="mr-2 text-emerald-500" size={20} />
                        Model Status
                    </h3>

                    <div className="space-y-6">
                        <div className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Version</span>
                                <span className="text-sm font-mono text-white bg-zinc-800 px-2 py-1 rounded-lg">{stats.model_version}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Status</span>
                                <span className="text-xs font-bold text-emerald-400 flex items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                                    Active
                                </span>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Accuracy</span>
                                <span
                                    className="text-white font-black"
                                    style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                                >94.2%</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-2">
                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '94.2%' }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Latency</span>
                                <span
                                    className="text-white font-black"
                                    style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                                >128ms</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-zinc-800">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Defect Rate</span>
                                <span
                                    className={clsx(
                                        "text-lg font-black",
                                        stats.total_images > 0 && (stats.total_anomalies_detected / stats.total_images) > 0.3
                                            ? 'text-red-400'
                                            : 'text-emerald-400'
                                    )}
                                    style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                                >
                                    {stats.total_images > 0
                                        ? `${((stats.total_anomalies_detected / stats.total_images) * 100).toFixed(1)}%`
                                        : '0.0%'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
