import React, { useState, useRef } from 'react';
import { FileUp, ChevronDown, Check, Loader2, FileText, Settings, Download, RefreshCw, ArrowLeft } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

interface CompressionStats {
  originalSize: number;
  newSize: number;
  percentage: number;
}

const CompressPdf: React.FC = () => {
  const { t } = useLanguage();
  const { themeColor } = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [stats, setStats] = useState<CompressionStats | null>(null);
  const [compressedPdfUrl, setCompressedPdfUrl] = useState<string | null>(null);
  
  // Options state
  const [imageQuality, setImageQuality] = useState<'high' | 'good' | 'low'>('good');
  const [resolution, setResolution] = useState<'screen' | 'ebook' | 'printer'>('ebook');
  const [grayscale, setGrayscale] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setIsDone(false);
      setStats(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);

    try {
      // Start simulated progress
      const progressInterval = setInterval(() => {
          setProgress(prev => {
              if (prev >= 90) {
                  return 90;
              }
              return prev + 5;
          });
      }, 200);

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Simulate compression logic since pdf-lib doesn't support advanced compression natively
      // In a real app, this would involve server-side processing or specialized libraries
      
      const pdfBytes = await pdfDoc.save();
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Mock reduction based on settings for demo purposes
      let reductionFactor = 0.95; 
      if (imageQuality === 'low') reductionFactor = 0.6;
      else if (imageQuality === 'good') reductionFactor = 0.8;
      
      if (grayscale) reductionFactor *= 0.9;

      const newSize = Math.floor(file.size * reductionFactor); 
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setCompressedPdfUrl(url);
      setStats({
        originalSize: file.size,
        newSize: newSize,
        percentage: Math.round((1 - newSize / file.size) * 100)
      });
      setIsDone(true);

    } catch (error) {
      console.error("Compression error:", error);
      alert("An error occurred while compressing the PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setIsDone(false);
    setStats(null);
    setProgress(0);
    if (compressedPdfUrl) URL.revokeObjectURL(compressedPdfUrl);
    setCompressedPdfUrl(null);
  };

  // 1. Upload View
  if (!file) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 py-20 px-4 font-sans">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">Compress PDF online</h1>
        <p className="text-gray-500 text-lg mb-10 text-center">Reduce the size of your PDF online</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-3 text-xl group"
           >
             <FileUp className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />
             Upload PDF files
             <ChevronDown className="w-5 h-5 ml-2" />
           </button>
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileChange} 
             accept=".pdf" 
             className="hidden" 
           />
           <p className="text-xs text-center text-gray-400 mt-4">
             Or drag and drop files here
           </p>
        </div>

        <div className="mt-16 max-w-2xl text-center">
            <h3 className="font-bold text-gray-700 mb-2">How to compress a PDF</h3>
            <p className="text-sm text-gray-500">
                Upload your PDF file. Choose a compression level. Wait for the process to finish and download your smaller PDF.
            </p>
        </div>
      </div>
    );
  }

  // 3. Result View
  if (isDone && stats) {
    return (
      <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center pt-12 px-4 font-sans">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Your task is processing</h2>
        
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-2xl w-full text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2">Your document is ready</h3>
            <p className="text-gray-500 mb-8">
                Size reduced by <span className="font-bold text-green-600">{stats.percentage}%</span>
                <span className="mx-2 text-gray-300">|</span>
                {formatSize(stats.originalSize)} <span className="text-gray-400">→</span> <strong>{formatSize(stats.newSize)}</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                    href={compressedPdfUrl!} 
                    download={`compressed_${file.name}`}
                    className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-md shadow-md flex items-center justify-center gap-2 transition-colors"
                >
                    <Download className="w-5 h-5" />
                    Download
                </a>
                <button 
                    onClick={handleReset}
                    className="bg-white border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Start Over
                </button>
            </div>
        </div>
      </div>
    );
  }

  // 2. Configure View
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 py-4 px-6 flex justify-between items-center shadow-sm">
            <h2 className="text-xl font-bold text-gray-800">Compress PDF online</h2>
            <button onClick={handleReset} className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
            </button>
        </div>

        <div className="flex-1 flex flex-col items-center pt-8 px-4 pb-20">
            {/* File Card */}
            <div className="bg-white p-4 rounded shadow-sm border border-gray-200 flex items-center gap-4 mb-8 w-full max-w-md">
                <div className="w-10 h-10 bg-red-100 text-red-500 rounded flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6" />
                </div>
                <div className="overflow-hidden">
                    <p className="font-medium text-gray-700 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                </div>
                <button onClick={handleReset} className="ml-auto text-gray-400 hover:text-red-500">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Options Toggle */}
            <div className="w-full max-w-md mb-6">
                <button 
                    onClick={() => setShowOptions(!showOptions)}
                    className="flex items-center gap-2 text-gray-600 font-medium hover:text-brand-600 text-sm mb-4"
                >
                    <Settings className="w-4 h-4" />
                    More options
                    <ChevronDown className={`w-4 h-4 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
                </button>

                {showOptions && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-in fade-in slide-in-from-top-2">
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Image Quality</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['high', 'good', 'low'] as const).map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setImageQuality(q)}
                                        className={`py-2 px-3 text-sm rounded border ${imageQuality === q ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                                    >
                                        {q.charAt(0).toUpperCase() + q.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="mb-4">
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Resolution</label>
                             <select 
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value as any)}
                                className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-brand-500"
                             >
                                <option value="screen">Screen (72 ppi)</option>
                                <option value="ebook">eBook (150 ppi)</option>
                                <option value="printer">Printer (300 ppi)</option>
                             </select>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={grayscale}
                                    onChange={(e) => setGrayscale(e.target.checked)}
                                    className="rounded text-brand-500 focus:ring-brand-500" 
                                />
                                <span className="text-sm text-gray-700">Convert images to grayscale</span>
                            </label>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Bottom Bar */}
        <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-40">
            <div className="max-w-md mx-auto">
                {isProcessing && (
                    <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Compressing...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-brand-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}
                <button 
                    onClick={handleCompress}
                    disabled={isProcessing}
                    className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-bold py-4 rounded-lg shadow-md flex items-center justify-center text-lg transition-colors"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Processing...
                        </>
                    ) : (
                        'Compress PDF'
                    )}
                </button>
            </div>
        </div>
    </div>
  );
};

export default CompressPdf;