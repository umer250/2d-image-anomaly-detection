import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Layers
} from 'lucide-react';
import {
    DailyInspectionsChart,
    AnomalyDistributionChart,
    NormalVsAnomalyChart
} from '../components/ChartComponents';
import { SkeletonCard, SkeletonChart } from '../components/SkeletonCard';
import { mockStats, dailyInspectionsData, anomalyDistributionData } from '../data/mockData';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate data loading
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    const stats = [
        { name: 'Total Images Analyzed', value: mockStats.totalImages.toLocaleString(), icon: Layers, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { name: 'Anomalies Detected', value: mockStats.anomaliesDetected.toLocaleString(), icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
        { name: 'Normal Images', value: mockStats.normalImages.toLocaleString(), icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
        { name: 'Model Accuracy', value: `${mockStats.accuracy}%`, icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
                <div className="text-sm text-zinc-500">Last updated: Just now</div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {loading
                    ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
                    : stats.map((item) => (
                        <motion.div
                            key={item.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-900 border border-zinc-800 overflow-hidden shadow rounded-lg hover:border-zinc-700 transition-colors"
                        >
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className={`flex-shrink-0 rounded-md p-3 ${item.bg}`}>
                                        <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-zinc-400 truncate">{item.name}</dt>
                                            <dd>
                                                <div className="text-lg font-medium text-white">{item.value}</div>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Daily Inspections */}
                {loading ? (
                    <SkeletonChart />
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg shadow min-h-[400px]"
                    >
                        <h3 className="text-lg font-medium leading-6 text-white mb-4">Daily Inspections</h3>
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
                        className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg shadow min-h-[400px]"
                    >
                        <h3 className="text-lg font-medium leading-6 text-white mb-4">Normal vs Anomaly Distribution</h3>
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
                        className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg shadow lg:col-span-2"
                    >
                        <h3 className="text-lg font-medium leading-6 text-white mb-4">Anomaly Types Breakdown</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="h-[320px] w-full">
                                <AnomalyDistributionChart data={anomalyDistributionData} />
                            </div>
                            <div className="space-y-6 px-4">
                                <div>
                                    <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">Analysis Summary</h4>
                                    <p className="text-zinc-300 leading-relaxed">
                                        The distribution shows that <strong className="text-white">Scratch</strong> is the most common anomaly type detected this week (45%), followed by <strong className="text-white">Dent</strong> (30%).
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {anomalyDistributionData.map((item, index) => (
                                        <div key={item.name} className="bg-black/20 p-3 rounded-lg border border-zinc-800">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="flex items-center text-sm text-zinc-300">
                                                    <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4] }}></span>
                                                    {item.name}
                                                </span>
                                                <span className="text-sm font-bold text-white">{item.value}%</span>
                                            </div>
                                            <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2">
                                                <div className="h-1.5 rounded-full" style={{ width: `${item.value}%`, backgroundColor: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4] }}></div>
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
