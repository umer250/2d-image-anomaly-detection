import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Layers,
    RefreshCw
} from 'lucide-react';
import {
    DailyInspectionsChart,
    AnomalyDistributionChart,
    NormalVsAnomalyChart
} from '../../components/ChartComponents';
import { userAPI } from '../../services/api';
import { SkeletonCard, SkeletonChart } from '../../components/SkeletonCard';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [statsData, setStatsData] = useState({
        totalImages: 0,
        anomaliesDetected: 0,
        normalImages: 0,
        accuracy: 98.5,
        history: [],
        distribution: []
    });

    // Use dynamic data from API if available, else fallback to placeholders
    const dailyInspectionsData = statsData.history.length > 0
        ? statsData.history
        : [
            { name: 'Mon', count: 0 }, { name: 'Tue', count: 0 }, { name: 'Wed', count: 0 },
            { name: 'Thu', count: 0 }, { name: 'Fri', count: 0 }, { name: 'Sat', count: 0 }, { name: 'Sun', count: 0 }
        ];

    const anomalyDistributionData = statsData.distribution.length > 0
        ? statsData.distribution
        : [
            { name: 'Minor', value: 0 },
            { name: 'Major', value: 0 },
            { name: 'Critical', value: 0 },
        ];

    const mockStats = [
        { name: 'Normal', value: statsData.normalImages || 0 },
        { name: 'Anomaly', value: statsData.anomaliesDetected || 0 },
    ];

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const data = await userAPI.getDashboard();
                setStatsData(data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const stats = [
        { name: 'Total Images Analyzed', value: (statsData.totalImages || 0).toLocaleString(), icon: Layers, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { name: 'Anomalies Detected', value: (statsData.anomaliesDetected || 0).toLocaleString(), icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
        { name: 'Normal Images', value: (statsData.normalImages || 0).toLocaleString(), icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
        { name: 'Model Accuracy', value: `${statsData.accuracy || 98.5}%`, icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ];

    return (
        <div className="space-y-8 font-inter">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-extrabold text-white font-sans tracking-tight">Dashboard Overview</h1>
                <div className="flex items-center space-x-6 bg-zinc-900/40 px-6 py-2.5 rounded-2xl border border-white/5 backdrop-blur-md shadow-xl">
                    <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Temporal Sync: <span className="text-zinc-300 ml-1 italic font-normal normal-case">Just now</span></span>
                    <button
                        onClick={() => {
                            setLoading(true);
                            userAPI.getDashboard().then(data => {
                                setStatsData(data);
                                setLoading(false);
                            });
                        }}
                        className="p-2.5 bg-white/5 hover:bg-white hover:text-black rounded-xl transition-all text-zinc-400 group border border-white/5 shadow-lg"
                        title="Refresh Data"
                    >
                        <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {loading
                    ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
                    : stats.map((item, idx) => (
                        <motion.div
                            key={item.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className="group bg-zinc-900/30 border border-white/5 overflow-hidden shadow-2xl rounded-3xl hover:border-white/10 transition-all backdrop-blur-sm"
                        >
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className={`flex-shrink-0 rounded-2xl p-4 ${item.bg} shadow-inner transition-transform duration-500 group-hover:scale-110`}>
                                        <item.icon className={`h-7 w-7 ${item.color}`} aria-hidden="true" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">{item.name}</dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-black text-white font-sans">{item.value}</div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Daily Inspections */}
                {loading ? (
                    <SkeletonChart />
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-950/40 border border-white/5 p-8 rounded-3xl shadow-2xl min-h-[400px] backdrop-blur-md"
                    >
                        <h3 className="text-xl font-bold text-white mb-6 font-sans">Daily Inspections</h3>
                        <div className="h-[320px] w-full">
                            <DailyInspectionsChart data={dailyInspectionsData} />
                        </div>
                    </motion.div>
                )}

                {/* Normal vs Anomaly */}
                {loading ? (
                    <SkeletonChart />
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-zinc-950/40 border border-white/5 p-8 rounded-3xl shadow-2xl min-h-[400px] backdrop-blur-md"
                    >
                        <h3 className="text-xl font-bold text-white mb-6 font-sans">Health Analysis</h3>
                        <div className="h-[320px] w-full">
                            <NormalVsAnomalyChart data={mockStats} />
                        </div>
                    </motion.div>
                )}

                {/* Anomaly Types Distribution */}
                {loading ? (
                    <div className="lg:col-span-2">
                        <SkeletonChart />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-zinc-950/40 border border-white/5 p-8 rounded-3xl shadow-2xl lg:col-span-2 backdrop-blur-md"
                    >
                        <h3 className="text-xl font-bold text-white mb-8 font-sans">Defect Pattern Recognition</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="h-[350px] w-full">
                                <AnomalyDistributionChart data={anomalyDistributionData} />
                            </div>
                            <div className="space-y-8 px-4">
                                <div>
                                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">Intelligence Summary</h4>
                                    <p className="text-zinc-400 leading-relaxed font-inter text-sm">
                                        Neural analysis indicates <strong className="text-white">Scratch</strong> as the primary anomaly vector (45%), followed by <strong className="text-white">Dent</strong> signatures (30%).
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 gap-6">
                                    {anomalyDistributionData.map((item, index) => (
                                        <div key={item.name} className="group/item bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="flex items-center text-xs font-bold text-zinc-300 uppercase tracking-widest font-sans">
                                                    <span className="w-2.5 h-2.5 rounded-full mr-3 shadow-lg" style={{ backgroundColor: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'][index % 4] }}></span>
                                                    {item.name}
                                                </span>
                                                <span className="text-lg font-black text-white font-sans">{item.value}%</span>
                                            </div>
                                            <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/5">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${item.value}%` }}
                                                    transition={{ duration: 1, delay: 0.5 }}
                                                    className="h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                                                    style={{ backgroundColor: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'][index % 4] }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
