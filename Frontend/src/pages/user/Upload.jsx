import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, X, Image as ImageIcon, ArrowRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const Upload = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState('');

    const [settings, setSettings] = useState({
        model: 'resnet50',
        threshold: '85',
        mode: 'auto'
    });

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (selectedFile) => {
        setError('');
        if (!selectedFile.type.startsWith('image/')) {
            setError('Please upload a valid image file (JPG, PNG).');
            return;
        }

        setFile(selectedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
    };

    const removeFile = () => {
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleAnalyze = () => {
        if (!file) return;

        setAnalyzing(true);

        // Simulate analysis delay
        setTimeout(() => {
            setAnalyzing(false);
            // Navigate to results with mock data
            navigate('/results', {
                state: {
                    image: preview,
                    fileName: file.name,
                    timestamp: new Date().toISOString(),
                    settings: settings
                }
            });
        }, 2000);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-white sm:truncate sm:text-3xl sm:tracking-tight">
                        Upload Image for Analysis
                    </h2>
                    <p className="mt-1 text-sm text-zinc-400">
                        Upload a 2D image of the component to detect potential anomalies.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 shadow sm:rounded-lg overflow-hidden">
                        <div className="p-6 sm:p-8">
                            <h3 className="text-lg font-medium text-white mb-4">Image Upload</h3>
                            <AnimatePresence mode="wait">
                                {!preview ? (
                                    <motion.div
                                        key="upload-zone"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className={clsx(
                                            "relative border-2 border-dashed rounded-lg p-12 text-center hover:bg-zinc-800/50 transition-colors cursor-pointer min-h-[300px] flex flex-col items-center justify-center",
                                            dragActive ? "border-blue-500 bg-blue-500/10" : "border-zinc-700"
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
                                            accept="image/*"
                                            onChange={handleChange}
                                        />
                                        <div className="mx-auto h-12 w-12 text-zinc-500">
                                            <UploadIcon size={48} />
                                        </div>
                                        <div className="mt-4 flex text-sm leading-6 text-zinc-400 justify-center">
                                            <span className="font-semibold text-blue-500 hover:text-blue-400">
                                                Click to upload
                                            </span>
                                            <span className="pl-1">or drag and drop</span>
                                        </div>
                                        <p className="text-xs leading-5 text-zinc-500">PNG, JPG, GIF up to 10MB</p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="preview-zone"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="space-y-6"
                                    >
                                        <div className="relative rounded-lg overflow-hidden bg-black border border-zinc-800">
                                            <button
                                                onClick={removeFile}
                                                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full shadow-sm hover:bg-red-500 text-white transition-colors z-10 backdrop-blur-sm"
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
                                                    <p className="text-xs text-zinc-500">{(file?.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {error && (
                                <div className="mt-4 p-4 rounded-md bg-red-500/10 border border-red-500/20 flex items-center">
                                    <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Settings Section */}
                <div className="lg:col-span-1">
                    <div className="bg-zinc-900 border border-zinc-800 shadow sm:rounded-lg p-6 sticky top-6">
                        <h3 className="text-lg font-medium text-white mb-6">Detection Settings</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Model Selection
                                </label>
                                <select
                                    value={settings.model}
                                    onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                                    className="block w-full rounded-md border-zinc-700 bg-black text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 px-3"
                                >
                                    <option value="resnet50">ResNet-50 (Fast)</option>
                                    <option value="efficientnet">EfficientNet-B4 (Balanced)</option>
                                    <option value="vit">Vision Transformer (Accurate)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Confidence Threshold
                                </label>
                                <select
                                    value={settings.threshold}
                                    onChange={(e) => setSettings({ ...settings, threshold: e.target.value })}
                                    className="block w-full rounded-md border-zinc-700 bg-black text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 px-3"
                                >
                                    <option value="95">95% (Strict)</option>
                                    <option value="90">90% (High)</option>
                                    <option value="85">85% (Balanced)</option>
                                    <option value="75">75% (Relaxed)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Detection Mode
                                </label>
                                <select
                                    value={settings.mode}
                                    onChange={(e) => setSettings({ ...settings, mode: e.target.value })}
                                    className="block w-full rounded-md border-zinc-700 bg-black text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 px-3"
                                >
                                    <option value="auto">Auto</option>
                                    <option value="surface">Surface Defect</option>
                                    <option value="structural">Structural</option>
                                    <option value="texture">Texture Analysis</option>
                                </select>
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handleAnalyze}
                                    disabled={analyzing || !file}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {analyzing ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </>
                                    ) : (
                                        'Start Detection'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Upload;
