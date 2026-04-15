import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { RefreshCw, Download, Share2, ArrowLeft, Maximize2, Tag } from 'lucide-react';
import { SkeletonCard } from '../../components/SkeletonCard';
import clsx from 'clsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Gauge Component ───────────────────────────────────────────────────────────
const ScoreGauge = ({ score }) => {
    // Score is 0 to 100
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedScore(score);
        }, 100);
        return () => clearTimeout(timer);
    }, [score]);

    // Color logic
    let colorClass = 'text-green-500';
    let strokeColor = '#22c55e'; // green-500
    if (score >= 70) {
        colorClass = 'text-red-500';
        strokeColor = '#ef4444'; // red-500
    } else if (score >= 40) {
        colorClass = 'text-yellow-500';
        strokeColor = '#eab308'; // yellow-500
    }

    const radius = 50;
    const circumference = Math.PI * radius; // Half circle
    const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center relative w-fullmax-w-[200px] mx-auto py-6">
            <svg viewBox="0 0 120 70" className="w-full h-auto overflow-visible">
                <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22c55e" />   {/* Green */}
                        <stop offset="50%" stopColor="#eab308" />  {/* Yellow */}
                        <stop offset="100%" stopColor="#ef4444" /> {/* Red */}
                    </linearGradient>
                </defs>
                {/* Background Arc */}
                <path
                    d="M 10 60 A 50 50 0 0 1 110 60"
                    fill="none"
                    stroke="#27272a" // zinc-800
                    strokeWidth="12"
                    strokeLinecap="round"
                />
                {/* Foreground Animated Arc */}
                <path
                    d="M 10 60 A 50 50 0 0 1 110 60"
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute bottom-4 flex flex-col items-center">
                <span className={clsx("text-4xl font-bold transition-colors duration-1000", colorClass)}>
                    {animatedScore.toFixed(1)}<span className="text-xl">%</span>
                </span>
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mt-1">Anomaly Score</span>
            </div>
        </div>
    );
};

const Results = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api.*$/, '') : 'http://localhost:8000';

    useEffect(() => {
        if (location.state?.analysisResult) {
            const data = location.state.analysisResult;
            
            // Score handling mapping
            let rawScore = data.anomaly_score !== undefined ? data.anomaly_score : (data.score || 0);
            rawScore = typeof rawScore === 'string' ? parseFloat(rawScore) : rawScore;
            // Handle cases where DB has rawScore > 1
            if (rawScore > 1.0 && rawScore <= 100) {
                rawScore = rawScore / 100;
            }

            const confidencePercent = Math.round(rawScore * 100);
            const isAnomaly = data.is_anomaly !== undefined ? data.is_anomaly : data.status === 'Anomaly';

            setResult({
                status: isAnomaly ? 'Anomaly' : 'Normal',
                confidence: confidencePercent,
                score: rawScore, // Store normalized 0-1 score
                type: isAnomaly ? 'Detected Defect' : 'None',
                heatmapPath: data.heatmap_path,
                hotMapPath: data.hot_map_path,
                contourPath: data.contour_path,
                originalPath: data.original_path,
                threshold: data.threshold,
                modelVersion: data.model_version || 'v1.0',
                category: data.category || location.state.category || 'bottle',
                timestamp: data.created_at || new Date().toISOString(),
                details: {
                    width: data.width,
                    height: data.height,
                    original_filename: data.original_filename
                }
            });
            setLoading(false);
        } else {
            // Fallback mock
            const timer = setTimeout(() => {
                setLoading(false);
                setResult({
                    status: 'Normal',
                    confidence: 12,
                    score: 0.12,
                    type: 'None',
                    heatmapPath: null,
                    hotMapPath: null,
                    contourPath: null,
                    category: 'bottle',
                    threshold: 0.60
                });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [location.state, navigate]);

    // Report Generation
    const generatePDF = () => {
        if (!result) return;

        const doc = new jsPDF();
        const timestamp = new Date(result.timestamp).toLocaleString();

        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setFillColor(99, 102, 241); // indigo-500
        doc.roundedRect(14, 12, 16, 16, 3, 3, 'F');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('AD', 17, 24);

        doc.setFontSize(20);
        doc.text('ANOMALY ANALYSIS REPORT', 105, 25, { align: 'center' });

        doc.setFillColor(248, 250, 252);
        doc.rect(14, 45, 182, 25, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(14, 45, 182, 25);

        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text('ANALYSIS SUMMARY', 20, 53);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Status: ${result.status.toUpperCase()}`, 20, 62);
        doc.text(`Score: ${result.confidence}%`, 85, 62);
        doc.text(`Category: ${result.category.toUpperCase()}`, 150, 62);

        const tableData = [
            ['Metric', 'Information'],
            ['Original Filename', displayFileName],
            ['Category', result.category],
            ['Status', result.status],
            ['Anomaly Score', `${result.confidence}%`],
            ['Detection Threshold', result.threshold || '0.60'],
            ['Date & Time', timestamp],
        ];

        autoTable(doc, {
            startY: 75,
            head: [tableData[0]],
            body: tableData.slice(1),
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241] },
        });

        doc.save(`Anomaly_Report_${Date.now()}.pdf`);
    };

    const shareViaGmail = () => {
        const subject = encodeURIComponent(`Anomaly Detection Report: ${result.status}`);
        const body = encodeURIComponent(
            `Analysis Results for ${displayFileName}:\n\n` +
            `Category: ${result.category}\n` +
            `Status: ${result.status}\n` +
            `Score: ${result.confidence}%\n` +
            `Time: ${new Date(result.timestamp).toLocaleString()}\n\n` +
            `Generated via AnomalyDetect AI`
        );
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=&su=${subject}&body=${body}`, '_blank');
    };

    const getFullUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        return `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
    };

    const displayImage = location.state?.image ? getFullUrl(location.state.image) : location.state?.analysisResult?.original_path ? getFullUrl(location.state.analysisResult.original_path) : '';
    const displayFileName = location.state?.fileName || result?.details?.original_filename || 'Analyzed Image';

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse"></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-[400px] bg-zinc-900 rounded-xl animate-pulse" />
                    <div className="space-y-6">
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                </div>
            </div>
        );
    }

    if (!result) return null;

    const isAnomaly = result.status === 'Anomaly';

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link to="/upload" className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-800">
                        <ArrowLeft className="text-zinc-400 hover:text-white" size={20} />
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Analysis Results</h1>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={shareViaGmail}
                        className="flex items-center px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                        <Share2 size={18} className="mr-2" /> Share
                    </button>
                    <button
                        onClick={generatePDF}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium shadow-lg shadow-indigo-900/20"
                    >
                        <Download size={18} className="mr-2" /> Export PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── Left: Image Section ────────────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 overflow-hidden">
                        <div className="p-4 border-b border-zinc-800 flex flex-wrap gap-4 justify-between items-center bg-zinc-900/80">
                            <div className="flex items-center gap-3">
                                <span className="font-medium text-white max-w-[200px] truncate" title={displayFileName}>
                                    {displayFileName}
                                </span>
                                {/* Category Badge */}
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-xs font-semibold capitalize">
                                    <Tag size={12} />
                                    {result.category}
                                </div>
                            </div>

                        </div>

                        {/* 4-Panel Image Grid */}
                        <div className="bg-[#09090b] p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            
                            {/* Panel 1 */}
                            <div className="flex flex-col gap-2 group">
                                <h4 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider pl-1 font-mono">1. Original Image</h4>
                                <div className="relative bg-black rounded-lg overflow-hidden border border-zinc-800 p-2 flex items-center justify-center h-[280px]">
                                    <img src={displayImage} alt="Original" className="max-h-full w-auto object-contain rounded isolate transition-transform duration-300 group-hover:scale-105" onError={(e) => { e.target.src = 'https://placehold.co/600x400/18181b/52525b?text=Unavailable' }} />
                                </div>
                            </div>
                            
                            {/* Panel 2 */}
                            <div className="flex flex-col gap-2 group">
                                <h4 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider pl-1 font-mono">2. Anomaly Map (Hot)</h4>
                                <div className="relative bg-black rounded-lg overflow-hidden border border-zinc-800 p-2 flex items-center justify-center h-[280px]">
                                    {result.hotMapPath ? <img src={getFullUrl(result.hotMapPath)} alt="Hot Map" className="max-h-full w-auto object-contain rounded isolate transition-transform duration-300 group-hover:scale-105" /> : <div className="text-zinc-600 text-xs flex flex-col items-center"><Maximize2 className="mb-2 opacity-50"/> Not Available</div>}
                                </div>
                            </div>

                            {/* Panel 3 */}
                            <div className="flex flex-col gap-2 group">
                                <h4 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider pl-1 font-mono">3. Heatmap Overlay</h4>
                                <div className="relative bg-black rounded-lg overflow-hidden border border-zinc-800 p-2 flex items-center justify-center h-[280px]">
                                    {result.heatmapPath ? <img src={getFullUrl(result.heatmapPath)} alt="Overlay" className="max-h-full w-auto object-contain rounded isolate transition-transform duration-300 group-hover:scale-105" /> : <div className="text-zinc-600 text-xs flex flex-col items-center"><Maximize2 className="mb-2 opacity-50"/> Not Available</div>}
                                </div>
                            </div>

                            {/* Panel 4 */}
                            <div className="flex flex-col gap-2 group">
                                <h4 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider pl-1 font-mono">4. Red Contour</h4>
                                <div className="relative bg-black rounded-lg overflow-hidden border border-zinc-800 p-2 flex items-center justify-center h-[280px]">
                                    {result.contourPath ? <img src={getFullUrl(result.contourPath)} alt="Contour" className="max-h-full w-auto object-contain rounded isolate transition-transform duration-300 group-hover:scale-105" /> : <div className="text-zinc-600 text-xs flex flex-col items-center"><Maximize2 className="mb-2 opacity-50"/> Not Available</div>}
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <p className="text-sm text-zinc-400">
                            Model <span className="text-zinc-300 font-mono">({result.modelVersion})</span> analyzed this <span className="text-white capitalize font-semibold">{result.category}</span> image.
                            {isAnomaly
                                ? ` Defect regions are highlighted in warmer colors (red/yellow) on the heatmap overlay. Score exceeded threshold (${result.threshold}).`
                                : ` No significant discrepancies found. Structural integrity matches baseline standards (Score < ${result.threshold}).`}
                        </p>
                    </div>
                </div>


                {/* ── Right: Results Panel ────────────────────────────────────────── */}
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                    
                    {/* Status Summary */}
                    <div className={clsx(
                        "rounded-xl p-6 border shadow-sm relative overflow-hidden",
                        isAnomaly ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"
                    )}>
                        {/* Background Glow */}
                        <div className={clsx(
                            "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none",
                            isAnomaly ? "bg-red-500" : "bg-green-500"
                        )} />

                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
                                Inspection Result
                            </h3>
                        </div>

                        <div className="flex items-center gap-3 mb-1">
                            {isAnomaly ? <span className="text-red-500 font-bold text-3xl">Anomaly</span> : <span className="text-green-500 font-bold text-3xl">Normal</span>}
                        </div>
                        <p className="text-sm text-zinc-400">
                            {isAnomaly ? 'Potential defect or damage identified.' : 'Image conforms to safety standards.'}
                        </p>
                    </div>

                    {/* Gauge Chart Card */}
                    <div className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 p-6 flex flex-col items-center">
                        <ScoreGauge score={result.confidence} />
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-2">
                        <button
                            onClick={() => navigate('/upload')}
                            className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-semibold shadow-lg shadow-indigo-900/20"
                        >
                            <RefreshCw size={18} className="mr-2" /> Check Another Image
                        </button>
                        <Link to="/history" className="block w-full">
                            <button className="w-full flex justify-center px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg transition-colors font-medium">
                                View Full History
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Results;
