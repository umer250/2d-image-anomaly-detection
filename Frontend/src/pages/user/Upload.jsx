import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Image as ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { mlAPI } from '../../services/mlApi';

// ── Constants ─────────────────────────────────────────────────────────────────
const VALID_CATEGORIES = [
    'bottle', 'bottle_latest', 'bottle_v2', 'cable', 'capsule', 'carpet', 'grid',
    'hazelnut', 'leather', 'metal_nut', 'pill', 'screw',
    'tile', 'toothbrush', 'transistor', 'wood', 'zipper',
];

// ── Upload icon (inline SVG so we don't clash with the named import) ──────────
const UploadSVG = ({ size = 48, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
        className={className}>
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
);

// ── Progress bar component ────────────────────────────────────────────────────
const UploadProgress = ({ percent, phase }) => {
    const isAnalyzing = phase === 'analyzing';
    return (
        <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
                <span className="text-indigo-400 font-medium">
                    {isAnalyzing ? 'Analyzing image…' : `Uploading… ${percent}%`}
                </span>
                {isAnalyzing && (
                    <span className="flex items-center gap-1.5 text-zinc-400 text-xs">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse inline-block" />
                        AI Processing
                    </span>
                )}
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                <div
                    className={clsx(
                        'h-full rounded-full transition-all duration-300',
                        isAnalyzing
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse w-full'
                            : 'bg-indigo-600'
                    )}
                    style={{ width: isAnalyzing ? '100%' : `${percent}%` }}
                />
            </div>
            {!isAnalyzing && (
                <p className="text-xs text-zinc-500">
                    {percent < 100 ? 'Sending file to server…' : 'Upload complete. Starting analysis…'}
                </p>
            )}
        </div>
    );
};

// ── Main component ────────────────────────────────────────────────────────────
const Upload = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState('');
    const [uploadPercent, setUploadPercent] = useState(0);
    const [uploadPhase, setUploadPhase] = useState('uploading'); // 'uploading' | 'analyzing'
    const [apiThreshold, setApiThreshold] = useState(null); // filled after response

    const [selectedCategory, setSelectedCategory] = useState('bottle');
    const [removeBg, setRemoveBg] = useState(false);

    // ── Drag & drop handlers ──────────────────────────────────────────────────
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === 'dragenter' || e.type === 'dragover');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files?.[0]) handleFile(e.target.files[0]);
    };

    const handleFile = (selectedFile) => {
        setError('');
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowed.includes(selectedFile.type)) {
            setError('Please upload a valid image file (JPG, PNG, WEBP).');
            return;
        }
        if (selectedFile.size > 20 * 1024 * 1024) {
            setError('File size must be under 20 MB.');
            return;
        }
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(selectedFile);
    };

    const removeFile = () => {
        setFile(null);
        setPreview(null);
        setApiThreshold(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── Analyze handler ───────────────────────────────────────────────────────
    const handleAnalyze = async () => {
        if (!file) return;
        setAnalyzing(true);
        setError('');
        setUploadPercent(0);
        setUploadPhase('uploading');

        try {
            const result = await mlAPI.predict(
                file,
                selectedCategory,
                removeBg,
                (percent, phase) => {
                    setUploadPercent(percent);
                    setUploadPhase(phase);
                }
            );

            setApiThreshold(result.threshold);
            setAnalyzing(false);

            navigate('/results', {
                state: {
                    image: preview,
                    fileName: file.name,
                    timestamp: new Date().toISOString(),
                    category: selectedCategory,
                    analysisResult: result,
                },
            });
        } catch (err) {
            console.error('Analysis failed:', err);
            setError(err.message || 'Analysis failed. Please try again.');
            setAnalyzing(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-white sm:truncate sm:text-3xl sm:tracking-tight">
                        Upload Image for Analysis
                    </h2>
                    <p className="mt-1 text-sm text-zinc-400">
                        Select a product category, then upload a 2D image to detect anomalies.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── Left: Drop zone ─────────────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 shadow sm:rounded-lg overflow-hidden">
                        <div className="p-6 sm:p-8">
                            <h3 className="text-lg font-medium text-white mb-4">Image Upload</h3>

                            {!preview ? (
                                <div
                                    className={clsx(
                                        'relative border-2 border-dashed rounded-lg p-12 text-center',
                                        'hover:bg-zinc-800/50 transition-colors cursor-pointer min-h-[300px]',
                                        'flex flex-col items-center justify-center',
                                        dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-700'
                                    )}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        onChange={handleChange}
                                    />
                                    <div className="mx-auto h-12 w-12 text-zinc-500">
                                        <UploadSVG size={48} />
                                    </div>
                                    <div className="mt-4 flex text-sm leading-6 text-zinc-400 justify-center">
                                        <span className="font-semibold text-indigo-400 hover:text-indigo-300">
                                            Click to upload
                                        </span>
                                        <span className="pl-1">or drag and drop</span>
                                    </div>
                                    <p className="text-xs leading-5 text-zinc-500 mt-1">
                                        PNG, JPG, WEBP — max 20 MB
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="relative rounded-lg overflow-hidden bg-black border border-zinc-800">
                                        <button
                                            onClick={removeFile}
                                            disabled={analyzing}
                                            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full shadow-sm hover:bg-red-500 text-white transition-colors z-10 backdrop-blur-sm disabled:opacity-40"
                                        >
                                            <X size={20} />
                                        </button>
                                        <div className="aspect-video w-full flex items-center justify-center bg-zinc-950">
                                            <img
                                                src={preview}
                                                alt="Preview"
                                                className="max-h-[400px] w-auto object-contain"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-zinc-800 rounded-md border border-zinc-700">
                                                <ImageIcon size={24} className="text-zinc-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{file?.name}</p>
                                                <p className="text-xs text-zinc-500">
                                                    {(file?.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold capitalize">
                                            {selectedCategory}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Progress bar */}
                            {analyzing && (
                                <UploadProgress percent={uploadPercent} phase={uploadPhase} />
                            )}

                            {/* Error */}
                            {error && (
                                <div className="mt-4 p-4 rounded-md bg-red-500/10 border border-red-500/20 flex items-center">
                                    <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Right: Settings panel ────────────────────────────────────── */}
                <div className="lg:col-span-1">
                    <div className="bg-zinc-900 border border-zinc-800 shadow sm:rounded-lg p-6 sticky top-6 space-y-6">
                        <h3 className="text-lg font-medium text-white">Detection Settings</h3>

                        {/* Category selector */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Product Category
                            </label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                disabled={analyzing}
                                className="block w-full rounded-md border border-zinc-700 bg-black text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 capitalize disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {VALID_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat} className="capitalize">
                                        {cat.replace('_', ' ')}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1.5 text-xs text-zinc-500">
                                Select the MVTec AD product type that matches your image.
                            </p>
                        </div>

                        {/* Background Removal Toggle */}
                        <div className="flex items-center justify-between bg-zinc-800/40 p-3 rounded-md border border-zinc-700">
                            <div>
                                <label className="text-sm font-medium text-white block">
                                    Isolate Object
                                </label>
                                <p className="text-xs text-zinc-500 mt-0.5 max-w-[200px]">
                                    Remove background noise before analysis.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRemoveBg(!removeBg)}
                                disabled={analyzing}
                                className={clsx(
                                    "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50",
                                    removeBg ? "bg-indigo-500" : "bg-zinc-600"
                                )}
                            >
                                <span
                                    className={clsx(
                                        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                        removeBg ? "translate-x-4" : "translate-x-0"
                                    )}
                                />
                            </button>
                        </div>

                        {/* Threshold display — real value after analysis */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Anomaly Threshold
                            </label>
                            <div className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-700 rounded-md py-2.5 px-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                                <span className="text-white text-sm font-mono">
                                    {apiThreshold != null ? apiThreshold.toFixed(2) : '0.60'}
                                </span>
                                <span className="text-zinc-500 text-xs ml-auto">
                                    {apiThreshold != null ? 'from model' : 'default'}
                                </span>
                            </div>
                            <p className="mt-1.5 text-xs text-zinc-500">
                                Scores above this value are classified as anomalies.
                            </p>
                        </div>

                        {/* Supported formats */}
                        <div className="bg-zinc-800/40 rounded-lg p-4 border border-zinc-700/50">
                            <p className="text-xs font-semibold text-zinc-400 mb-2">Supported Formats</p>
                            <div className="flex flex-wrap gap-1.5">
                                {['JPG', 'JPEG', 'PNG', 'WEBP'].map((fmt) => (
                                    <span key={fmt}
                                        className="px-2 py-0.5 bg-zinc-700 text-zinc-300 rounded text-xs font-mono">
                                        {fmt}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Analyze button */}
                        <button
                            onClick={handleAnalyze}
                            disabled={analyzing || !file}
                            className={clsx(
                                'w-full flex justify-center items-center gap-2 py-3 px-4 rounded-md shadow-sm text-sm font-semibold',
                                'transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
                                analyzing || !file
                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40 shadow-lg'
                            )}
                        >
                            {analyzing ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
                                        fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10"
                                            stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    {uploadPhase === 'uploading' ? `Uploading ${uploadPercent}%` : 'Analyzing…'}
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={16} />
                                    Start Detection
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Upload;
