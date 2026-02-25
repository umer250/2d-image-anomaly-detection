import React, { useState, useEffect } from 'react';
import {
    Users,
    Image as ImageIcon,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    Activity,
    ArrowUpRight,
    Calendar,
    Download,
    FileText,
    Settings,
    ShieldCheck,
    ChevronRight,
    Search,
    X
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { adminAPI } from '../../services/api';
import clsx from 'clsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Dashboard = () => {
    const [stats, setStats] = useState({
        total_users: 0,
        total_images: 0,
        total_anomalies_detected: 0,
        active_users: 0,
        weekly_activity: [],
        anomaly_trends: []
    });
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('Weekly');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await adminAPI.getAnalytics();
                setStats(data);

                // Use real-time high risk notifications from backend
                // If backend returns empty list (because toggle is off), it will clear notifications
                setNotifications(data.recent_high_risk || []);
            } catch (error) {

                console.error("Dashboard: Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const closeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Helper to get labels based on filter
    const getLabels = () => {
        const now = new Date();
        const labels = [];

        if (timeFilter === 'Daily') {
            for (let i = 23; i >= 0; i--) {
                const date = new Date(now.getTime() - (i * 60 * 60 * 1000));
                const hour = date.getHours();
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 || 12;
                labels.push(`${hour12} ${ampm}`);
            }
        } else if (timeFilter === 'Weekly') {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 6; i >= 0; i--) {
                const day = new Date(now);
                day.setDate(now.getDate() - i);
                labels.push(dayNames[day.getDay()]);
            }
        } else {
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            for (let i = 11; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                labels.push(monthNames[date.getMonth()]);
            }
        }
        return labels;
    };

    const currentLabels = getLabels();

    // Map backend data based on filter
    const getTrendData = () => {
        let sourceData = [];
        if (timeFilter === 'Daily') sourceData = stats.daily_activity || [];
        else if (timeFilter === 'Weekly') sourceData = stats.weekly_activity || [];
        else sourceData = stats.monthly_activity || [];

        return currentLabels.map((label, i) => ({
            name: label,
            count: sourceData[i] || 0
        }));
    };

    const trendData = getTrendData();

    // Calculate Summary Stats (from Monthly as default context for these high-level stats)
    const totalAnomalies = stats.total_anomalies_detected || 0;
    const peakAnomalies = stats.anomaly_trends?.length > 0 ? Math.max(...stats.anomaly_trends) : 0;
    const avgAnomalies = stats.anomaly_trends?.length > 0
        ? (stats.anomaly_trends.reduce((a, b) => a + b, 0) / stats.anomaly_trends.length).toFixed(1)
        : 0;

    // Custom Dot for AreaChart Spikes
    const RenderCustomDot = (props) => {
        const { cx, cy, value } = props;
        // Highlight as spike if value is greater than average * 1.5
        if (value > avgAnomalies * 1.5 && value > 5) {
            return (
                <circle cx={cx} cy={cy} r={4} fill="#ef4444" stroke="#fff" strokeWidth={2} />
            );
        }
        return null;
    };

    const cards = [
        {
            name: 'Total Users',
            value: stats.total_users || 0,
            icon: Users,
            accent: 'border-blue-500/50',
            iconColor: 'text-blue-400',
            bg: 'bg-blue-500/5'
        },
        {
            name: 'Total Inspections',
            value: stats.total_images || 0,
            icon: ImageIcon,
            accent: 'border-indigo-500/50',
            iconColor: 'text-indigo-400',
            bg: 'bg-indigo-500/5'
        },
        {
            name: 'Defects Detected',
            value: stats.total_anomalies_detected || 0,
            icon: AlertTriangle,
            accent: 'border-red-500/50',
            iconColor: 'text-red-400',
            bg: 'bg-red-500/5'
        },
        {
            name: 'Efficiency Rate',
            value: '94.2%',
            icon: CheckCircle,
            accent: 'border-green-500/50',
            iconColor: 'text-green-400',
            bg: 'bg-green-500/5'
        }
    ];

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text('Advanced AI System Report', 14, 20);
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        const tableData = [
            ['Metric', 'Current Value', 'Status'],
            ['Total Register Users', stats.total_users, 'Active'],
            ['Processed Hardware Logs', stats.total_images, 'Stabilized'],
            ['Anomalies Detected', stats.total_anomalies_detected, 'Critical Area'],
            ['Inference Latency', '128ms', 'Optimal'],
            ['F1 Model Accuracy', '94.2%', 'High Accuracy'],
        ];

        autoTable(doc, {
            startY: 40,
            head: [tableData[0]],
            body: tableData.slice(1),
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        });

        doc.save(`system-report-${Date.now()}.pdf`);
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
            {/* High Risk Notifications */}
            <div className="space-y-3">
                {notifications.map(notif => (
                    <div key={notif.id} className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-red-500/20 rounded-lg text-red-500">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white uppercase tracking-tight">High Risk Anomaly Detected</p>
                                <p className="text-xs text-zinc-400">
                                    User: <span className="text-white">{notif.user}</span> ({notif.email}) |
                                    Score: <span className="text-red-500 font-bold">{notif.score}%</span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => closeNotification(notif.id)}
                            className="p-1 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">
                        Admin Dashboard
                    </h1>
                    <p className="text-slate-400 text-xs mt-1">
                        Real-time AI monitoring and system performance.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={generatePDF}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center transition-all border border-slate-700 shadow-sm"
                    >
                        <Download size={14} className="mr-2" />
                        Export PDF
                    </button>
                    <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
                        {['Daily', 'Weekly', 'Monthly'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setTimeFilter(filter)}
                                className={clsx(
                                    "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                                    timeFilter === filter ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                                )}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <div
                        key={idx}
                        className={clsx(
                            "bg-slate-900/40 border border-slate-800 rounded-xl p-5 transition-all duration-300 hover:border-slate-700 hover:shadow-lg relative overflow-hidden group",
                            card.accent
                        )}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={clsx("p-2 rounded-lg", card.bg, card.iconColor)}>
                                <card.icon size={18} />
                            </div>
                        </div>
                        <h3 className="text-xs text-slate-400 font-medium mb-1">{card.name}</h3>
                        <p className="text-2xl font-bold text-white tracking-tight">
                            {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Anomaly Trend Chart */}
                <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                <Activity size={16} className="text-red-400" />
                                Anomaly Trends
                            </h3>
                            <p className="text-slate-500 text-[10px] mt-1">Historical detection volume per month</p>
                        </div>
                        {/* Summary above graph */}
                        <div className="flex gap-6">
                            <div className="text-center">
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Total</p>
                                <p className="text-sm font-bold text-white">{totalAnomalies}</p>
                            </div>
                            <div className="text-center border-x border-slate-800 px-6">
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Peak</p>
                                <p className="text-sm font-bold text-red-400">{peakAnomalies}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Avg</p>
                                <p className="text-sm font-bold text-blue-400">{avgAnomalies}</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#475569"
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
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
                                        fontSize: '11px',
                                        color: '#cbd5e1'
                                    }}
                                    itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                    dot={<RenderCustomDot />}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Intelligence Status Card */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 flex flex-col shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-sm font-semibold text-white">System Health</h3>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 rounded-full border border-green-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                            <span className="text-[9px] font-bold text-green-400 uppercase tracking-tighter">Live</span>
                        </div>
                    </div>

                    <div className="flex-1 space-y-8">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Model Version</span>
                                <span className="text-[10px] font-mono text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">
                                    {stats.model_version || 'v2.4.0-stable'}
                                </span>
                            </div>
                        </div>

                        {/* Redesigned Progress Metrics */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Model Accuracy</span>
                                    <span className="text-[10px] font-bold text-white">94.2%</span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 rounded-full" style={{ width: '94.2%' }}></div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Inference Latency</span>
                                    <span className="text-[10px] font-bold text-white">128ms</span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '40%' }}></div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Anomaly Rate</span>
                                    <span className="text-[10px] font-bold text-white">
                                        {(stats.total_anomalies_detected / (stats.total_images || 1) * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min((stats.total_anomalies_detected / (stats.total_images || 1) * 100) * 2, 100)}%` }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                                <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Node Status</p>
                                <p className="text-xs font-bold text-white uppercase">Operational</p>
                            </div>
                            <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                                <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Queue Depth</p>
                                <p className="text-xs font-bold text-white uppercase">Nominal</p>
                            </div>
                        </div>
                    </div>

                    <button className="w-full mt-8 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2 border border-slate-700">
                        <Settings size={12} /> Configure Node
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
