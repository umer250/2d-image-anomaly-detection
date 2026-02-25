import React, { useState, useEffect } from 'react';

import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Layers,
    RefreshCw,
    PieChart as PieIcon
} from 'lucide-react';
import {
    DailyInspectionsChart,
    AnomalyDistributionChart,
    NormalVsAnomalyChart
} from '../../components/ChartComponents';
import { userAPI } from '../../services/api';
import { SkeletonCard, SkeletonChart } from '../../components/SkeletonCard';

const DEFECT_COLORS = ['#EF4444', '#F59E0B', '#10B981'];

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

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await userAPI.getDashboard();
            setStatsData(data);
        } catch (error) {
            console.error("Failed to fetch dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Daily inspections: API returns [{ name: 'Mon', count: 3 }, ...]
    const dailyInspectionsData = statsData.history?.length > 0
        ? statsData.history
        : [
            { name: 'Mon', count: 0 }, { name: 'Tue', count: 0 }, { name: 'Wed', count: 0 },
            { name: 'Thu', count: 0 }, { name: 'Fri', count: 0 }, { name: 'Sat', count: 0 }, { name: 'Sun', count: 0 }
        ];

    // Normal vs Anomaly: pass as array with name/value
    const normalVsAnomalyData = [
        { name: 'Normal', value: statsData.normalImages || 0 },
        { name: 'Anomaly', value: statsData.anomaliesDetected || 0 },
    ];

    // Defect distribution: API returns [{ name: 'Minor', value: N }, ...]
    const distributionData = statsData.distribution?.length > 0
        ? statsData.distribution
        : [
            { name: 'Minor', value: 0 },
            { name: 'Major', value: 0 },
            { name: 'Critical', value: 0 },
        ];

    const totalDefects = distributionData.reduce((sum, d) => sum + d.value, 0);
    const hasDefectData = totalDefects > 0;

    const stats = [
        {
            name: 'Total Analyzed',
            value: (statsData.totalImages || 0).toLocaleString(),
            icon: Layers,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            accent: '#3b82f6'
        },
        {
            name: 'Anomalies Found',
            value: (statsData.anomaliesDetected || 0).toLocaleString(),
            icon: AlertTriangle,
            color: 'text-red-400',
            bg: 'bg-red-500/10',
            border: 'border-red-500/20',
            accent: '#ef4444'
        },
        {
            name: 'Normal Images',
            value: (statsData.normalImages || 0).toLocaleString(),
            icon: CheckCircle,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            accent: '#10b981'
        },
        {
            name: 'Model Accuracy',
            value: `${statsData.accuracy || 98.5}%`,
            icon: Activity,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20',
            accent: '#a855f7'
        },
    ];

    return (
        <div className="space-y-8" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1
                        className="text-3xl font-extrabold text-white tracking-tight"
                        style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                    >
                        Dashboard
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">Your personal inspection analytics</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all border border-zinc-800 text-sm font-medium group"
                    title="Refresh Data"
                >
                    <RefreshCw size={15} className="group-hover:rotate-180 transition-transform duration-500" />
                    Refresh
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {loading
                    ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
                    : stats.map((item, idx) => (
                        <div
                            key={item.name}
                            className={`relative bg-zinc-900/50 border rounded-2xl p-5 overflow-hidden transition-all duration-300 shadow-lg hover:shadow-xl ${item.border} animate-in fade-in slide-in-from-bottom-2 duration-500`}
                            style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both' }}
                        >

                            {/* Subtle accent glow */}
                            <div
                                className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 blur-2xl pointer-events-none"
                                style={{ backgroundColor: item.accent }}
                            />

                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-2.5 rounded-xl ${item.bg}`}>
                                    <item.icon size={20} className={item.color} />
                                </div>
                            </div>

                            {/* Label — Outfit font */}
                            <p
                                className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1"
                                style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                            >
                                {item.name}
                            </p>

                            {/* Value — large Outfit number */}
                            <p
                                className="text-3xl font-black text-white leading-none"
                                style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                            >
                                {item.value}
                            </p>
                        </div>
                    ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* Daily Inspections */}
                {loading ? <SkeletonChart /> : (
                    <div
                        className="bg-zinc-950/40 border border-white/5 p-6 rounded-2xl shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-500"
                    >

                        <h3
                            className="text-base font-bold text-white mb-1"
                            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                        >
                            Daily Inspections
                        </h3>
                        <p className="text-zinc-500 text-xs mb-5">Images analyzed over the last 7 days</p>
                        <div className="h-[280px] w-full">
                            <DailyInspectionsChart data={dailyInspectionsData} />
                        </div>
                    </div>

                )}

                {/* Normal vs Anomaly */}
                {loading ? <SkeletonChart /> : (
                    <div
                        className="bg-zinc-950/40 border border-white/5 p-6 rounded-2xl shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-500"
                        style={{ animationDelay: '100ms', animationFillMode: 'both' }}
                    >

                        <h3
                            className="text-base font-bold text-white mb-1"
                            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                        >
                            Health Analysis
                        </h3>
                        <p className="text-zinc-500 text-xs mb-5">Normal vs anomaly breakdown</p>
                        <div className="h-[280px] w-full">
                            <NormalVsAnomalyChart data={normalVsAnomalyData} />
                        </div>
                    </div>

                )}

                {/* Defect Pattern Recognition — full width */}
                {loading ? (
                    <div className="lg:col-span-2"><SkeletonChart /></div>
                ) : (
                    <div
                        className="bg-zinc-950/40 border border-white/5 p-6 rounded-2xl shadow-xl lg:col-span-2 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-500"
                        style={{ animationDelay: '200ms', animationFillMode: 'both' }}
                    >

                        <h3
                            className="text-base font-bold text-white mb-1"
                            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                        >
                            Defect Severity Breakdown
                        </h3>
                        <p className="text-zinc-500 text-xs mb-6">
                            Distribution of anomaly scores across severity levels
                        </p>

                        {!hasDefectData ? (
                            /* Empty state */
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <PieIcon size={48} className="text-zinc-700 mb-4" />
                                <p
                                    className="text-zinc-400 font-semibold text-sm"
                                    style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                                >
                                    No defect data yet
                                </p>
                                <p className="text-zinc-600 text-xs mt-1 max-w-xs">
                                    Upload and analyze images to see defect severity distribution here.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                {/* Donut Chart */}
                                <div className="h-[300px] w-full">
                                    <AnomalyDistributionChart data={distributionData} />
                                </div>

                                {/* Severity Breakdown Bars */}
                                <div className="space-y-4">
                                    {distributionData.map((item, index) => {
                                        const pct = totalDefects > 0
                                            ? Math.round((item.value / totalDefects) * 100)
                                            : 0;
                                        return (
                                            <div key={item.name} className="bg-white/5 p-4 rounded-xl border border-white/5">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="flex items-center gap-2 text-xs font-bold text-zinc-300 uppercase tracking-widest">
                                                        <span
                                                            className="w-2.5 h-2.5 rounded-full"
                                                            style={{ backgroundColor: DEFECT_COLORS[index % DEFECT_COLORS.length] }}
                                                        />
                                                        {item.name}
                                                    </span>
                                                    <div className="flex items-baseline gap-2">
                                                        <span
                                                            className="text-xl font-black text-white"
                                                            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                                                        >
                                                            {item.value}
                                                        </span>
                                                        <span className="text-xs text-zinc-500 font-medium">
                                                            ({pct}%)
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-1000"
                                                        style={{
                                                            width: `${pct}%`,
                                                            backgroundColor: DEFECT_COLORS[index % DEFECT_COLORS.length],
                                                            transitionDelay: `${300 + index * 100}ms`
                                                        }}
                                                    />

                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Total summary */}
                                    <div className="mt-2 pt-4 border-t border-zinc-800 flex justify-between items-center">
                                        <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                                            Total Defects
                                        </span>
                                        <span
                                            className="text-2xl font-black text-red-400"
                                            style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                                        >
                                            {totalDefects}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                )}
            </div>
        </div>
    );
};

export default Dashboard;
