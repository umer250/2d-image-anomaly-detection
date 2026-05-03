import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { RefreshCw, Download, Share2, ArrowLeft, Maximize2, Tag } from 'lucide-react';
import { SkeletonCard } from '../../components/SkeletonCard';
import clsx from 'clsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Gauge Component ───────────────────────────────────────────────────────────
const ScoreGauge = ({ score, isAnomaly }) => {
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setAnimatedScore(score), 100);
        return () => clearTimeout(timer);
    }, [score]);

    // Color based on anomaly status, not just score value
    const strokeColor = isAnomaly ? '#ef4444' : '#22c55e';
    const colorClass = isAnomaly ? 'text-red-500' : 'text-green-500';

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
            // No result state — show 0 score (not random)
            const timer = setTimeout(() => {
                setLoading(false);
                setResult({
                    status: 'Normal',
                    confidence: 0,
                    score: 0,
                    type: 'None',
                    heatmapPath: null,
                    hotMapPath: null,
                    contourPath: null,
                    category: 'bottle',
                    threshold: 0.7544
                });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [location.state, navigate]);

    // Report Generation
    const generatePDF = () => {
        if (!result) return;

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = 210;
        const margin = 14;
        const contentW = pageW - margin * 2;
        const ts = result.timestamp ? new Date(result.timestamp).toLocaleString() : new Date().toLocaleString();
        const scoreRaw = result.score ?? 0;
        const scorePct = result.confidence ?? Math.round(scoreRaw * 100);
        const thresholdRaw = result.threshold ?? 0.7544;
        const thresholdPct = (thresholdRaw * 100).toFixed(2);
        const isAnom = result.status === 'Anomaly';

        // ── Professional Header with Logo ────────────────────────────────────
        // Dark header background
        doc.setFillColor(15, 23, 42);  // slate-900
        doc.rect(0, 0, pageW, 45, 'F');

        // Logo - Modern hexagon design
        doc.setFillColor(99, 102, 241);  // indigo-500
        doc.circle(margin + 10, 18, 10, 'F');
        doc.setFillColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('AD', margin + 5.5, 21);

        // Project Title
        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('2D Industrial Anomaly Detection System', margin + 28, 15);
        
        // Subtitle
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);  // slate-400
        doc.text('PatchCore Algorithm · WideResNet-50 Backbone · Deep Learning', margin + 28, 22);
        
        // University/Project Info
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);  // slate-500
        doc.text('Final Year Project 2026 · Department of Computer Science', margin + 28, 28);

        // Report metadata box
        doc.setFillColor(30, 41, 59);  // slate-800
        doc.roundedRect(margin, 33, contentW, 8, 1, 1, 'F');
        doc.setFontSize(7);
        doc.setTextColor(203, 213, 225);  // slate-300
        doc.text(`Report Generated: ${ts}`, margin + 2, 38);
        doc.text(`Category: ${result.category?.toUpperCase() || 'BOTTLE'}`, pageW - margin - 2, 38, { align: 'right' });

        // ── Status banner ────────────────────────────────────────────────────
        const bannerColor = isAnom ? [220, 38, 38] : [22, 163, 74];
        doc.setFillColor(...bannerColor);
        doc.rect(0, 45, pageW, 14, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        const statusText = isAnom 
            ? `⚠  ANOMALY DETECTED  —  Score: ${scorePct}%  |  Threshold: ${thresholdPct}%`
            : `✓  NORMAL  —  Score: ${scorePct}%  |  Threshold: ${thresholdPct}%`;
        doc.text(statusText, pageW / 2, 54, { align: 'center' });

        let y = 67;

        // ── Analysis Details table ───────────────────────────────────────────
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text('Analysis Details', margin, y);
        y += 4;

        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            tableWidth: contentW,
            head: [['Field', 'Value']],
            body: [
                ['Image Filename', displayFileName],
                ['Category', result.category?.toUpperCase() || 'BOTTLE'],
                ['Detection Result', result.status],
                ['Anomaly Score', `${scorePct}% (raw: ${scoreRaw.toFixed(6)})`],
                ['Decision Threshold', `${thresholdPct}% (raw: ${thresholdRaw.toFixed(6)})`],
                ['Model Version', result.modelVersion || 'PatchCore-WideResNet50-v1'],
                ['Analysis Date & Time', ts],
            ],
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 9, textColor: [30, 30, 30] },
            alternateRowStyles: { fillColor: [248, 248, 255] },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
        });

        y = doc.lastAutoTable.finalY + 8;

        // ── Model & Scoring Methodology ──────────────────────────────────────
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text('Model & Scoring Methodology', margin, y);
        y += 4;

        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            tableWidth: contentW,
            head: [['Component', 'Detail']],
            body: [
                ['Algorithm', 'PatchCore (Memory-Bank K-NN)'],
                ['Backbone', 'WideResNet-50 (wide_resnet50_2)'],
                ['Feature Layers', 'layer2 + layer3 (1536-dim embeddings)'],
                ['Patch Size', '28 × 28 patches per image'],
                ['Coreset Ratio', '10% of training patches stored in memory bank'],
                ['K Neighbours', '9-NN average distance per patch'],
                ['Input Size', '224 × 224 px — ImageNet normalization'],
                ['Training Dataset', 'MVTec AD — Bottle category'],
                ['Image AUROC', '99.84%'],
                ['Pixel AUROC', '98.17%'],
            ],
            theme: 'grid',
            headStyles: { fillColor: [55, 65, 81], textColor: 255, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 8.5, textColor: [30, 30, 30] },
            alternateRowStyles: { fillColor: [248, 248, 248] },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
        });

        y = doc.lastAutoTable.finalY + 8;

        // ── Scoring Formula ──────────────────────────────────────────────────
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text('Scoring Formula & Decision Logic', margin, y);
        y += 5;

        const formulaLines = [
            '1. FEATURE EXTRACTION',
            '   WideResNet-50 processes the 224×224 image. Patch embeddings are extracted from',
            '   layer2 and layer3, then concatenated → 1536-dim vector per patch (28×28 grid).',
            '',
            '2. K-NN DISTANCE SCORING (per patch)',
            '   For each of the 784 patches, compute the average distance to its 9 nearest',
            '   neighbours in the memory bank (coreset of normal training patches):',
            '   patch_score(p) = (1/9) × Σ ||p − m_k||₂   for k = 1..9',
            '',
            '3. IMAGE-LEVEL SCORE',
            '   The image anomaly score is the maximum patch score across all patches:',
            '   raw_max = max { patch_score(p) : p ∈ patches }',
            '',
            '4. NORMALIZATION',
            '   The raw score is normalized to [0, 1] using the formula:',
            '   anomaly_score = raw_max / (raw_max + 1)',
            `   This image: raw_max → normalized score = ${scoreRaw.toFixed(6)}  (${scorePct}%)`,
            '',
            '5. DECISION',
            `   If anomaly_score > threshold  →  ANOMALY`,
            `   If anomaly_score ≤ threshold  →  NORMAL`,
            `   Threshold = ${thresholdRaw.toFixed(6)}  (${thresholdPct}%)`,
            `   This image score = ${scoreRaw.toFixed(6)}  →  ${isAnom ? 'ANOMALY DETECTED ⚠' : 'NORMAL ✓'}`,
        ];

        doc.setFontSize(8.2);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(40, 40, 40);

        // Light background box for formula
        doc.setFillColor(245, 245, 255);
        doc.setDrawColor(200, 200, 230);
        doc.roundedRect(margin, y - 2, contentW, formulaLines.length * 4.8 + 4, 2, 2, 'FD');

        formulaLines.forEach((line) => {
            const isBold = /^\d\./.test(line.trim());
            doc.setFont('helvetica', isBold ? 'bold' : 'normal');
            doc.setTextColor(isBold ? 30 : 50, isBold ? 30 : 50, isBold ? 30 : 50);
            doc.text(line, margin + 3, y + 2);
            y += 4.8;
        });

        y += 6;

        // ── Verdict summary ──────────────────────────────────────────────────
        doc.setFillColor(...bannerColor, 0.1);
        doc.setFillColor(isAnom ? 255 : 240, isAnom ? 240 : 255, isAnom ? 240 : 240);
        doc.setDrawColor(...bannerColor);
        doc.roundedRect(margin, y, contentW, 14, 2, 2, 'FD');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...bannerColor);
        doc.text(
            isAnom
                ? `VERDICT: Anomaly score ${scorePct}% exceeds threshold ${thresholdPct}% — defect detected.`
                : `VERDICT: Anomaly score ${scorePct}% is below threshold ${thresholdPct}% — image is normal.`,
            pageW / 2, y + 9, { align: 'center' }
        );

        // ── Footer ───────────────────────────────────────────────────────────
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(150, 150, 150);
            doc.text('AnomalyDetect — 2D Image Anomaly Detection System | FYP Batch 2022–2026', margin, 292);
            doc.text(`Page ${i} of ${pageCount}`, pageW - margin, 292, { align: 'right' });
        }

        doc.save(`AnomalyReport_${displayFileName.replace(/\.[^.]+$/, '')}_${Date.now()}.pdf`);
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4 min-w-0">
                    <Link to="/upload" className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-800 shrink-0">
                        <ArrowLeft className="text-zinc-400 hover:text-white" size={20} />
                    </Link>
                    <h1 className="text-xl md:text-2xl font-bold text-white truncate">Analysis Results</h1>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={shareViaGmail}
                        className="flex-1 md:flex-none flex justify-center items-center px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors whitespace-nowrap"
                    >
                        <Share2 size={18} className="mr-2 shrink-0" /> Share
                    </button>
                    <button
                        onClick={generatePDF}
                        className="flex-1 md:flex-none flex justify-center items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium shadow-lg shadow-indigo-900/20 whitespace-nowrap"
                    >
                        <Download size={18} className="mr-2 shrink-0" /> Export PDF
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
                                <h4 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider pl-1 font-mono">4. Defect Contours</h4>
                                <div className="relative bg-black rounded-lg overflow-hidden border border-zinc-800 p-2 flex items-center justify-center h-[280px]">
                                    {result.contourPath ? <img src={getFullUrl(result.contourPath)} alt="Contour" className="max-h-full w-auto object-contain rounded isolate transition-transform duration-300 group-hover:scale-105" /> : <div className="text-zinc-600 text-xs flex flex-col items-center"><Maximize2 className="mb-2 opacity-50"/> Not Available</div>}
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                        <p className="text-sm text-zinc-400">
                            {isAnomaly
                                ? <>
                                    <span className="text-red-400 font-semibold">Anomaly detected</span> in this <span className="text-white capitalize font-semibold">{result.category}</span> image.
                                    Defect regions are highlighted in warmer colors (red/yellow) on the heatmap overlay.
                                    Anomaly score <span className="font-mono text-white">{result.confidence}%</span> exceeded threshold <span className="font-mono text-white">{result.threshold ? (result.threshold * 100).toFixed(1) : '75.4'}%</span>.
                                  </>
                                : <>
                                    <span className="text-green-400 font-semibold">No anomaly detected</span> in this <span className="text-white capitalize font-semibold">{result.category}</span> image.
                                    Structural integrity matches baseline standards. Score <span className="font-mono text-white">{result.confidence}%</span> is below threshold <span className="font-mono text-white">{result.threshold ? (result.threshold * 100).toFixed(1) : '75.4'}%</span>.
                                  </>
                            }
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
                        <ScoreGauge score={result.confidence} isAnomaly={isAnomaly} />
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
