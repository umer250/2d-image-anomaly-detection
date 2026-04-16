import React, { useState, useEffect } from 'react';
import {
    Download, TrendingUp, AlertTriangle, CheckCircle,
    Activity, Cpu, Zap, BarChart3, PieChart as PieChartIcon,
    Database, Layers, Eye, Target, GitBranch
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { adminAPI } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#ef4444', '#f97316', '#6366f1'];

const Reports = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch_ = async () => {
            try {
                const [analytics, dashStats] = await Promise.all([
                    adminAPI.getAnalytics(),
                    fetch(`${import.meta.env.VITE_API_URL || '/api/v1'}/admin/stats`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
                    }).then(r => r.json()),
                ]);
                setStats({ ...analytics, dash: dashStats });
            } catch (err) {
                console.error('Reports fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetch_();
    }, []);

    const getMonthLabels = () => {
        const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        return Array.from({ length: 12 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
            return names[d.getMonth()];
        });
    };

    const monthLabels = getMonthLabels();

    const trendData = (stats?.anomaly_trends || []).map((val, i) => ({
        name: monthLabels[i] || `M${i + 1}`,
        anomalies: val,
    }));

    const distributionData = [
        { name: 'Critical (≥85%)', value: stats?.type_distribution?.critical || 0, color: '#ef4444' },
        { name: 'Major (60–84%)', value: stats?.type_distribution?.minor || 0, color: '#f97316' },
        { name: 'Noise (<60%)', value: stats?.type_distribution?.noise || 0, color: '#6366f1' },
    ];

    const totalPredictions = stats?.total_images || 0;
    const totalAnomalies = stats?.total_anomalies_detected || 0;
    const anomalyRate = totalPredictions > 0 ? ((totalAnomalies / totalPredictions) * 100).toFixed(1) : '0.0';
    const normalRate = (100 - parseFloat(anomalyRate)).toFixed(1);

    // PatchCore model properties (real values from MVTec AD benchmark)
    const modelProps = [
        { label: 'Architecture', value: 'PatchCore', icon: Cpu, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        { label: 'Backbone', value: 'WideResNet-50', icon: Layers, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Image AUROC', value: '99.84%', icon: Target, color: 'text-green-400', bg: 'bg-green-500/10' },
        { label: 'Pixel AUROC', value: '98.17%', icon: Eye, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { label: 'Feature Layers', value: 'layer2 + layer3', icon: GitBranch, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'Feature Dim', value: '1536-dim patches', icon: Database, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        { label: 'Coreset Ratio', value: '10% memory bank', icon: Zap, color: 'text-pink-400', bg: 'bg-pink-500/10' },
        { label: 'k-NN Distance', value: 'k = 9 neighbors', icon: Activity, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    ];

    const generatePDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 38, 'F');
        doc.setFillColor(99, 102, 241);
        doc.roundedRect(14, 10, 18, 18, 3, 3, 'F');
        doc.setFontSize(13);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('AD', 18, 23);
        doc.setFontSize(16);
        doc.text('AnomalyDetect — Intelligence Report', 40, 20);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 180, 200);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 29);

        // System stats
        autoTable(doc, {
            startY: 48,
            head: [['System Metric', 'Value']],
            body: [
                ['Total Inspections', totalPredictions],
                ['Total Anomalies Detected', totalAnomalies],
                ['Anomaly Rate', `${anomalyRate}%`],
                ['Normal Rate', `${normalRate}%`],
                ['Total Users', stats?.total_users || 0],
                ['Critical Defects (≥85%)', stats?.type_distribution?.critical || 0],
                ['Major Anomalies (60–84%)', stats?.type_distribution?.minor || 0],
                ['Noise / Trace (<60%)', stats?.type_distribution?.noise || 0],
            ],
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 10, font: 'helvetica' },
        });

        // Model properties
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 12,
            head: [['Model Property', 'Value']],
            body: modelProps.map(p => [p.label, p.value]),
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 10, font: 'helvetica' },
        });

        const finalY = doc.lastAutoTable.finalY + 12;
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text('AnomalyDetect — Automated AI Anomaly Detection System', 105, finalY, { align: 'center' });

        doc.save(`intelligence-report-${Date.now()}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight font-outfit">Intelligence Reports</h1>
                    <p className="text-zinc-400 text-sm mt-1 font-sans">Model properties, system analytics, and defect distribution.</p>
                </div>
                <button
                    onClick={generatePDF}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
                >
                    <Download size={16} /> Export PDF Report
                </button>
            </div>

            {/* Live System Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Inspections', value: totalPredictions, icon: BarChart3, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
                    { label: 'Anomalies Detected', value: totalAnomalies, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
                    { label: 'Anomaly Rate', value: `${anomalyRate}%`, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                    { label: 'Normal Rate', value: `${normalRate}%`, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
                ].map((s, i) => (
                    <div key={i} className={`bg-zinc-900 border ${s.border} rounded-xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg`}>
                        <div className={`p-2 rounded-lg ${s.bg} ${s.color} w-fit mb-3`}><s.icon size={18} /></div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-sans">{s.label}</p>
                        <p className="text-2xl font-bold text-white font-outfit mt-1">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Model Properties */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Cpu className="text-indigo-400" size={18} />
                    <h3 className="text-base font-bold text-white font-outfit">PatchCore Model Properties</h3>
                    <span className="ml-auto px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[9px] font-bold uppercase tracking-widest border border-indigo-500/20 font-sans">MVTec AD Benchmark</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {modelProps.map((p, i) => (
                        <div key={i} className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all">
                            <div className={`p-1.5 rounded-lg ${p.bg} ${p.color} w-fit mb-3`}><p.icon size={14} /></div>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-sans">{p.label}</p>
                            <p className="text-sm font-bold text-white mt-1 font-outfit">{p.value}</p>
                        </div>
                    ))}
                </div>

                {/* Model description */}
                <div className="mt-6 p-4 bg-zinc-950/40 border border-zinc-800 rounded-xl">
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                        <span className="text-white font-semibold">PatchCore</span> is a state-of-the-art anomaly detection model that uses a
                        <span className="text-indigo-400 font-semibold"> WideResNet-50</span> backbone pretrained on ImageNet to extract
                        patch-level feature embeddings from <span className="text-indigo-400 font-semibold">layer2</span> and <span className="text-indigo-400 font-semibold">layer3</span> (combined 1536-dim).
                        A <span className="text-indigo-400 font-semibold">coreset subsampling</span> strategy retains 10% of the most representative patches in a memory bank.
                        At inference, the <span className="text-indigo-400 font-semibold">k-NN distance (k=9)</span> from the query patch to the memory bank determines the anomaly score.
                        Scores exceeding the calibrated threshold are classified as anomalies.
                        Achieves <span className="text-green-400 font-semibold">99.84% Image AUROC</span> and <span className="text-green-400 font-semibold">98.17% Pixel AUROC</span> on the MVTec AD bottle category.
                    </p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Anomaly Trend */}
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="text-indigo-400" size={18} />
                        <h3 className="text-base font-bold text-white font-outfit">Anomaly Detection Trend</h3>
                        <span className="ml-auto text-[10px] text-zinc-500 font-sans uppercase tracking-widest">Last 12 Months</span>
                    </div>
                    <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorAnomalies" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tick={{ fontFamily: 'Inter, sans-serif', fill: '#71717a' }} />
                                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontFamily: 'Inter, sans-serif', fill: '#71717a' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '10px', fontSize: '11px', fontFamily: 'Inter, sans-serif' }}
                                    itemStyle={{ color: '#818cf8' }}
                                />
                                <Area type="monotone" dataKey="anomalies" name="Anomalies" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorAnomalies)" dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution Pie */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <PieChartIcon className="text-indigo-400" size={18} />
                        <h3 className="text-base font-bold text-white font-outfit">Defect Distribution</h3>
                    </div>
                    <div className="flex-1 min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={distributionData}
                                    cx="50%" cy="50%"
                                    innerRadius={50} outerRadius={72}
                                    paddingAngle={6}
                                    dataKey="value"
                                    animationDuration={1200}
                                >
                                    {distributionData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '10px', fontSize: '11px', fontFamily: 'Inter, sans-serif' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-2.5 mt-2">
                        {distributionData.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-[10px] font-sans">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                    <span className="text-zinc-400 font-medium">{item.name}</span>
                                </div>
                                <span className="text-white font-bold font-mono">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Threshold & Scoring Explanation */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-5">
                    <Target className="text-indigo-400" size={18} />
                    <h3 className="text-base font-bold text-white font-outfit">Anomaly Scoring & Threshold</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-sans mb-2">Scoring Formula</p>
                        <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                            <code className="text-indigo-400 font-mono">score = max(kNN_dist(patch, memory_bank))</code><br />
                            The anomaly score is the maximum k-NN distance from any image patch to its nearest neighbors in the coreset memory bank.
                        </p>
                    </div>
                    <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-sans mb-2">Decision Rule</p>
                        <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                            <code className="text-indigo-400 font-mono">score {'>'} threshold → Anomaly</code><br />
                            The threshold is calibrated on the training set to maximize the F1-score. Scores above it are flagged as anomalies.
                        </p>
                    </div>
                    <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-sans mb-2">Severity Levels</p>
                        <div className="space-y-1.5 text-[10px] font-sans">
                            <div className="flex justify-between"><span className="text-red-400 font-bold">Critical</span><span className="text-zinc-400">score ≥ 85%</span></div>
                            <div className="flex justify-between"><span className="text-amber-400 font-bold">Major</span><span className="text-zinc-400">60% ≤ score &lt; 85%</span></div>
                            <div className="flex justify-between"><span className="text-yellow-400 font-bold">Minor</span><span className="text-zinc-400">40% ≤ score &lt; 60%</span></div>
                            <div className="flex justify-between"><span className="text-blue-400 font-bold">Trace</span><span className="text-zinc-400">score &lt; 40%</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
