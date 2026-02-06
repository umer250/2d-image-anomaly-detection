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

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        total_users: 0,
        total_images: 0,
        total_anomalies_detected: 0,
        active_users: 0,
        model_version: 'v1.0'
    });
    const [loading, setLoading] = useState(true);
    const [activityTime, setActivityTime] = useState('hourly');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                console.log("AdminDashboard: Fetching analytics...");
                const data = await adminAPI.getAnalytics();
                console.log("AdminDashboard: Analytics fetched:", data);
                setStats(data);
            } catch (error) {
                console.error("AdminDashboard: Failed to fetch stats:", error);
            } finally {
                console.log("AdminDashboard: Loading set to false");
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
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            desc: 'Active system users'
        },
        {
            name: 'Inspections',
            value: stats.total_images,
            icon: ImageIcon,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            desc: 'Total images processed'
        },
        {
            name: 'Anomalies',
            value: stats.total_anomalies_detected,
            icon: AlertTriangle,
            color: 'text-red-500',
            bg: 'bg-red-500/10',
            desc: 'Defects identified'
        },
        {
            name: 'Healthy',
            value: (stats.total_images - stats.total_anomalies_detected),
            icon: CheckCircle,
            color: 'text-green-500',
            bg: 'bg-green-500/10',
            desc: 'Passed inspections'
        }
    ];

    const handleExport = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(59, 130, 246); // Blue-500
        doc.text('Admin Dashboard Report', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        // Stats Summary
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

        // Add System Activity & Model Status Note
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
        <div className="space-y-8 max-w-[1600px] mx-auto pb-12 font-inter">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
                    <p className="text-zinc-400 text-sm mt-1">Monitor system performance and user activity.</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center px-4 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors"
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
                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={clsx("p-3 rounded-lg", card.bg)}>
                                <card.icon size={24} className={card.color} />
                            </div>
                            <span className={clsx("text-xs font-bold px-2 py-1 rounded-full bg-zinc-800 text-zinc-400")}>
                                {stats.total_images > 0 ? Math.round((card.value / (card.name === 'Total Users' ? stats.active_users || 1 : stats.total_images)) * 100) : 0}%
                            </span>
                        </div>
                        <div>
                            <p className="text-zinc-400 text-sm font-medium">{card.name}</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{card.value}</h3>
                            <p className="text-zinc-500 text-xs mt-2">{card.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* System Health */}
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center">
                            <Activity className="mr-2 text-blue-500" size={20} />
                            System Activity
                        </h3>
                        <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                            {['hourly', 'weekly', 'monthly'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setActivityTime(t)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize ${activityTime === t ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[300px] flex items-end gap-2">
                        {/* Data changes based on selection */}
                        {(activityTime === 'hourly'
                            ? (stats.anomaly_trends && stats.anomaly_trends.length > 0 ? stats.anomaly_trends : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) // Real Hourly from anomaly_trends
                            : activityTime === 'weekly'
                                ? (stats.weekly_activity && stats.weekly_activity.length > 0 ? stats.weekly_activity : [0, 0, 0, 0, 0, 0, 0]) // Real Weekly
                                : (stats.monthly_activity && stats.monthly_activity.length > 0 ? stats.monthly_activity : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) // Real Monthly
                        ).map((h, i) => {
                            const maxValue = Math.max(...(
                                activityTime === 'hourly'
                                    ? stats.anomaly_trends || [1]
                                    : activityTime === 'weekly'
                                        ? stats.weekly_activity || [1]
                                        : stats.monthly_activity || [1]
                            )) || 1;

                            const percentage = (h / maxValue) * 100;

                            return (
                                <div key={i} className="flex-1 bg-zinc-800 hover:bg-zinc-700 rounded-t-sm transition-all relative group" style={{ height: `${percentage}%` }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {h}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-between mt-4 text-xs text-zinc-500 font-medium capitalize">
                        <span>{activityTime === 'weekly' ? '7 Days Ago' : 'Start'}</span>
                        <span>{activityTime === 'weekly' ? '3 Days Ago' : 'Mid'}</span>
                        <span>{activityTime === 'weekly' ? 'Today' : 'End'}</span>
                    </div>
                </div>

                {/* Model Info */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                        <TrendingUp className="mr-2 text-emerald-500" size={20} />
                        Model Status
                    </h3>

                    <div className="space-y-6">
                        <div className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-800">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-zinc-400">Current Version</span>
                                <span className="text-sm font-mono text-white bg-zinc-800 px-2 py-1 rounded">{stats.model_version}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-zinc-400">Status</span>
                                <span className="text-xs font-bold text-emerald-400 flex items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                                    Active
                                </span>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-zinc-400">Accuracy</span>
                                <span className="text-white font-bold">94.2%</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-2">
                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '94.2%' }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-zinc-400">Latency</span>
                                <span className="text-white font-bold">128ms</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                        </div>

                        <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors mt-4">
                            View Model Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
