import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

import {
    CheckCircle,
    AlertTriangle,
    ArrowLeft,
    RefreshCw,
    Download,
    Share2,
    Maximize2
} from 'lucide-react';
import { SkeletonCard } from '../../components/SkeletonCard';
import clsx from 'clsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Backend URLs are handled by proxy or environment variables

const Results = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [viewMode, setViewMode] = useState('heatmap');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (location.state?.analysisResult) {
            // Use real data passed from Upload or History
            const data = location.state.analysisResult;
            const isAnomaly = data.is_anomaly !== undefined ? data.is_anomaly : data.status === 'Anomaly';
            const score = data.anomaly_score !== undefined ? data.anomaly_score : data.score;

            setResult({
                status: isAnomaly ? 'Anomaly' : 'Normal',
                confidence: (score * 100).toFixed(2),
                score: score, // Store numeric score for condition check
                type: isAnomaly ? 'Detected Defect' : 'None',
                heatmapPath: data.heatmap_path,
                originalPath: data.original_path, // Needed for report
                threshold: data.threshold,
                modelVersion: data.model_version,
                timestamp: data.created_at || new Date().toISOString(),
                details: {
                    width: data.width,
                    height: data.height,
                    original_filename: data.original_filename
                }
            });
            setLoading(false);
        } else {
            // Fallback / Demo mode if no state
            // Simulate API loading delay
            const timer = setTimeout(() => {
                setLoading(false);
                if (!location.state?.image) {
                    // Demo data
                    setResult({
                        status: "Upload Image to Check Status",
                        confidence: '0',
                        score: 0,
                        type: 'Demo Defect',
                        heatmapPath: null // No heatmap for demo
                    });
                } else {
                    // Mock data if image exists but no result (edge case)
                    setResult({
                        status: 'Normal',
                        confidence: '98.00',
                        score: 0.98,
                        type: 'None',
                        heatmapPath: null
                    });
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [location.state, navigate]);

    const generatePDF = () => {
        if (!result || result.score <= 0) {
            alert("Report can only be generated when anomaly score is greater than 0.");
            return;
        }

        const doc = new jsPDF();
        const timestamp = new Date(result.timestamp).toLocaleString();

        // Header with stylized Logo
        doc.setFillColor(30, 41, 59); // Dark blue header
        doc.rect(0, 0, 210, 40, 'F');

        // Stylized "Shield" Logo (Red Square with white S)
        doc.setFillColor(239, 68, 68); // Red-500
        doc.roundedRect(14, 12, 16, 16, 3, 3, 'F');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('A', 19, 24);

        doc.setFontSize(20);
        doc.text('ANOMALY ANALYSIS REPORT', 105, 25, { align: 'center' });

        // Summary Block - Compact for single page
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
        doc.text(`Confidence: ${result.confidence}%`, 85, 62);
        doc.text(`Model: ${result.modelVersion || 'v2.5'}`, 150, 62);

        // Detailed Data Table
        const tableData = [
            ['Metric', 'Detailed Information'],
            ['Original Filename', displayFileName],
            ['Anomaly Type', result.type],
            ['Analysis Score', `${result.confidence}%`],
            ['Threshold', result.threshold || '0.60'],
            ['Date & Time', timestamp],
            ['Image Path', result.originalPath || 'N/A'],
            ['Resolution', result.details?.width ? `${result.details.width}x${result.details.height}` : 'N/A']
        ];

        autoTable(doc, {
            startY: 75,
            head: [tableData[0]],
            body: tableData.slice(1),
            theme: 'grid',
            headStyles: {
                fillColor: [59, 130, 246],
                fontSize: 11,
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 9,
                cellPadding: 4
            },
            columnStyles: {
                0: { cellWidth: 45, fontStyle: 'bold' },
                1: { cellWidth: 'auto' }
            },
            margin: { bottom: 20 } // Ensure footer fits
        });

        // Footer - Compact
        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setDrawColor(200, 200, 200);
        doc.line(14, finalY, 196, finalY);

        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('This report is electronically generated by the AI Anomaly Detection System.', 105, finalY + 8, { align: 'center' });
        doc.text('Anomaly.AI - Integrity Monitoring - 2026', 105, finalY + 13, { align: 'center' });

        doc.save(`Anomaly_Report_${location.state?.analysisResult?.id || 'RES'}.pdf`);
    };

    const shareViaGmail = () => {
        const subject = encodeURIComponent(`Anomaly Detection Report: ${result.status}`);
        const body = encodeURIComponent(
            `Analysis Results for ${displayFileName}:\n\n` +
            `Status: ${result.status}\n` +
            `Score: ${result.confidence}/100\n` +
            `Time: ${new Date(result.timestamp).toLocaleString()}\n` +
            `Type: ${result.type}\n\n` +
            `Report generated via Anomaly.AI`
        );
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=&su=${subject}&body=${body}`, '_blank');
    };

    // Construct display data with fallbacks
    const getFullUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        // Use proxy-friendly relative path
        return path;
    };

    const displayImage = location.state?.image ? getFullUrl(location.state.image) : location.state?.analysisResult?.original_path ? getFullUrl(location.state.analysisResult.original_path) : '';
    const displayFileName = location.state?.fileName || result?.details?.original_filename || 'Analyzed Image';

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="h-[400px] bg-zinc-900 rounded-xl border border-zinc-800 animate-pulse"></div>
                        <div className="h-24 bg-zinc-900 rounded-lg animate-pulse"></div>
                    </div>
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
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link to="/upload" className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                        <ArrowLeft className="text-zinc-400 hover:text-white" />
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Analysis Results</h1>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={shareViaGmail}
                        className="flex items-center px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                        <Share2 size={18} className="mr-2" />
                        Share
                    </button>
                    <button
                        onClick={generatePDF}
                        className={clsx(
                            "flex items-center px-4 py-2 rounded-lg transition-colors font-medium",
                            result.score > 0 ? "bg-white text-black hover:bg-zinc-200" : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        )}
                    >
                        <Download size={18} className="mr-2" />
                        Export Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Image Section */}
                <div
                    className="lg:col-span-2 space-y-4 animate-in fade-in slide-in-from-left-4 duration-500"
                >

                    <div className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 overflow-hidden">
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                            <span className="font-medium text-zinc-300">{displayFileName}</span>
                            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                                <button
                                    onClick={() => setViewMode('original')}
                                    className={clsx(
                                        "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                        viewMode === 'original' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    Original Image
                                </button>
                                <button
                                    onClick={() => setViewMode('heatmap')}
                                    className={clsx(
                                        "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                        viewMode === 'heatmap' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                    disabled={!result.heatmapPath}
                                >
                                    Heatmap Overlay
                                </button>
                            </div>
                        </div>
                        <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden group">
                            {/* Original Image */}
                            <img
                                src={displayImage}
                                alt="Analyzed"
                                className="absolute inset-0 w-full h-full object-contain"
                            />

                            {/* Heatmap Overlay */}
                            {viewMode === 'heatmap' && result.heatmapPath && (
                                <img
                                    src={getFullUrl(result.heatmapPath)}
                                    alt="Heatmap"
                                    className="absolute inset-0 w-full h-full object-contain pointer-events-none mix-blend-normal opacity-70 animate-in fade-in duration-300"
                                />
                            )}

                            <button className="absolute bottom-4 right-4 p-2 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                                <Maximize2 size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <h3 className="font-medium text-blue-400 mb-2">AI Analysis Explanation</h3>
                        <p className="text-sm text-blue-300/80">
                            The model (version {result.modelVersion || 'v1.0'}) analyzed the image.
                            {isAnomaly
                                ? ` It detected anomalies with a confidence score of ${result.confidence}%. The red regions in the heatmap indicate potential defects.`
                                : " No significant anomalies were detected. The image appears normal."}
                        </p>
                    </div>
                </div>


                {/* Results Panel */}
                <div
                    className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500"
                    style={{ animationDelay: '200ms', animationFillMode: 'both' }}
                >

                    {/* Status Card */}
                    <div className={clsx(
                        "rounded-xl p-6 border shadow-sm",
                        isAnomaly ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"
                    )}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={clsx(
                                "text-lg font-bold",
                                isAnomaly ? "text-red-500" : "text-green-500"
                            )}>
                                Detection Status
                            </h3>
                            {isAnomaly ? (
                                <AlertTriangle className="text-red-600" size={28} />
                            ) : (
                                <CheckCircle className="text-green-600" size={28} />
                            )}
                        </div>

                        <div className="text-3xl font-bold mb-1 text-white">
                            {result.status}
                        </div>
                        <div className={clsx(
                            "text-sm font-medium",
                            isAnomaly ? "text-red-400" : "text-green-400"
                        )}>
                            {isAnomaly ? "Potential Defect Detected" : "No Anomalies Found"}
                        </div>
                    </div>

                    {/* Confidence Card */}
                    <div className="bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Anomaly Score</h3>
                        <div className="flex items-end justify-between mb-2">
                            <span className={clsx(
                                "text-3xl font-bold",
                                isAnomaly ? "text-red-500" : "text-green-500"
                            )}>{result.confidence}</span>
                            <span className="text-sm text-zinc-500 mb-1">Score (0-100)</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-3 mb-2">
                            <div
                                className={clsx(
                                    "h-3 rounded-full transition-all duration-1000",
                                    isAnomaly ? "bg-red-500" : "bg-green-500"
                                )}
                                style={{
                                    width: `${result.confidence}%`,
                                    transitionDelay: '500ms'
                                }}
                            />
                        </div>

                        <p className="text-xs text-zinc-500 mt-4">
                            <strong>Details:</strong><br />
                            Threshold: {result.threshold}<br />
                            Model: {result.modelVersion}<br />
                            Pixels: {result.details?.width || 'N/A'}x{result.details?.height || 'N/A'}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/upload')}
                            className="w-full flex items-center justify-center px-4 py-3 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors shadow-lg hover:shadow-xl font-medium"
                        >
                            <RefreshCw size={20} className="mr-2" />
                            Analyze Another Image
                        </button>
                        <Link to="/history">
                            <button className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors mt-3">
                                View History
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Results;
