import React, { useState, useRef, useEffect } from 'react';
import { 
  FileUp, Download, Check, Loader2, Stamp, RefreshCw, 
  Type, ImageIcon, Palette, RotateCw, Layers, Plus, Minus, ArrowLeft 
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { useLanguage } from '../../contexts/LanguageContext';

// Safely handle pdfjs-dist import
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

if (pdfjs && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

interface WatermarkConfig {
  type: 'text' | 'image';
  text: string;
  imageSrc: string | null;
  opacity: number;
  rotation: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

const WatermarkPdf: React.FC = () => {
  const { t } = useLanguage();
  
  // Workflow State
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'editor' | 'success'>('upload');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  
  // Editor State
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{width: number, height: number} | null>(null);
  const [config, setConfig] = useState<WatermarkConfig>({
      type: 'text',
      text: 'CONFIDENTIAL',
      imageSrc: null,
      opacity: 0.3,
      rotation: -45,
      fontSize: 60,
      color: '#ff0000',
      fontFamily: 'Helvetica'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const watermarkImageInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setStep('editor');
      await loadPreview(selectedFile);
    }
  };

  const loadPreview = async (file: File) => {
      setLoading(true);
      try {
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(1);
          
          const viewport = page.getViewport({ scale: 1.0 });
          setPageSize({ width: viewport.width, height: viewport.height });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (context) {
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              await page.render({ canvasContext: context, viewport }).promise;
              setPreviewImage(canvas.toDataURL());
          }
      } catch (e) {
          console.error(e);
          alert("Error loading PDF preview");
      } finally {
          setLoading(false);
      }
  };

  const handleWatermarkImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  setConfig({ ...config, type: 'image', imageSrc: event.target.result as string });
              }
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r, g, b };
  };

  const handleApply = async () => {
    if (!file) return;
    setProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { password: '' } as any);
      const pages = pdfDoc.getPages();
      
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const times = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const courier = await pdfDoc.embedFont(StandardFonts.Courier);
      const fontMap: any = { 'Helvetica': helvetica, 'Times New Roman': times, 'Courier New': courier };
      const font = fontMap[config.fontFamily] || helvetica;

      let watermarkImage: any = null;
      if (config.type === 'image' && config.imageSrc) {
          const imgBytes = await fetch(config.imageSrc).then(res => res.arrayBuffer());
          if (config.imageSrc.includes('png')) {
              watermarkImage = await pdfDoc.embedPng(imgBytes);
          } else {
              watermarkImage = await pdfDoc.embedJpg(imgBytes);
          }
      }

      for (const page of pages) {
          const { width, height } = page.getSize();
          
          if (config.type === 'text') {
              const textWidth = font.widthOfTextAtSize(config.text, config.fontSize);
              const { r, g, b } = hexToRgb(config.color);
              
              page.drawText(config.text, {
                  x: (width - textWidth) / 2,
                  y: height / 2,
                  size: config.fontSize,
                  font: font,
                  color: rgb(r, g, b),
                  opacity: config.opacity,
                  rotate: degrees(config.rotation),
              });
          } else if (watermarkImage) {
              const dims = watermarkImage.scale(0.5);
              page.drawImage(watermarkImage, {
                  x: (width - dims.width) / 2,
                  y: (height - dims.height) / 2,
                  width: dims.width,
                  height: dims.height,
                  opacity: config.opacity,
                  rotate: degrees(config.rotation),
              });
          }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setStep('success');
    } catch (e: any) {
      console.error(e);
      alert("Error applying watermark: " + e.message);
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setStep('upload');
    setResultUrl(null);
    setPreviewImage(null);
  };

  if (step === 'upload') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 py-20 px-4 font-sans">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">Watermark PDF</h1>
        <p className="text-gray-500 text-lg mb-10 text-center">Add text or image watermark to your PDF documents</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-3 text-xl group"
           >
             <Stamp className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />
             Upload PDF file
           </button>
           <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
        </div>
      </div>
    );
  }

  if (step === 'success' && resultUrl) {
    return (
      <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center pt-24 px-4 font-sans">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Watermark applied!</h2>
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-2xl w-full text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8" />
            </div>
            <p className="text-gray-500 mb-8">Your document is ready for download.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={resultUrl} download={`watermarked_${file?.name}`} className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-md shadow-md flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" /> Download PDF
                </a>
                <button onClick={reset} className="bg-white border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Start Over
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
        <div className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between sticky top-[60px] z-30 shadow-sm">
            <div className="flex items-center gap-4">
                <button onClick={reset} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5"/></button>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Watermark PDF</h2>
                    <div className="text-sm text-gray-500">{file?.name}</div>
                </div>
            </div>
            <button 
                onClick={handleApply}
                disabled={processing}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-bold py-2 px-6 rounded shadow-sm flex items-center justify-center transition-colors"
            >
                {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Apply Watermark
            </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Controls */}
            <div className="w-full md:w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Watermark Settings</h3>
                
                <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                    <button 
                        onClick={() => setConfig({...config, type: 'text'})}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${config.type === 'text' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Type className="w-4 h-4" /> Text
                    </button>
                    <button 
                        onClick={() => setConfig({...config, type: 'image'})}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${config.type === 'image' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <ImageIcon className="w-4 h-4" /> Image
                    </button>
                </div>

                {config.type === 'text' ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Text Content</label>
                            <input 
                                type="text" 
                                value={config.text}
                                onChange={(e) => setConfig({...config, text: e.target.value})}
                                className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-brand-500 outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Color</label>
                                <div className="flex items-center gap-2 border border-gray-300 rounded p-1">
                                    <input 
                                        type="color" 
                                        value={config.color}
                                        onChange={(e) => setConfig({...config, color: e.target.value})}
                                        className="w-6 h-6 border-0 p-0 rounded-full cursor-pointer"
                                    />
                                    <span className="text-[10px] text-gray-400 font-mono uppercase">{config.color}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Size</label>
                                <input 
                                    type="number" 
                                    value={config.fontSize}
                                    onChange={(e) => setConfig({...config, fontSize: Number(e.target.value)})}
                                    className="w-full border border-gray-300 rounded p-2 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <button 
                            onClick={() => watermarkImageInputRef.current?.click()}
                            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                        >
                            {config.imageSrc ? (
                                <img src={config.imageSrc} alt="Preview" className="w-20 h-20 object-contain" />
                            ) : (
                                <>
                                    <Plus className="w-6 h-6 text-gray-400" />
                                    <span className="text-xs text-gray-500">Upload Logo</span>
                                </>
                            )}
                        </button>
                        <input type="file" ref={watermarkImageInputRef} onChange={handleWatermarkImageUpload} accept="image/*" className="hidden" />
                    </div>
                )}

                <div className="mt-8 space-y-6">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Opacity</label>
                            <span className="text-xs text-brand-600 font-bold">{Math.round(config.opacity * 100)}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="1" step="0.05"
                            value={config.opacity}
                            onChange={(e) => setConfig({...config, opacity: parseFloat(e.target.value)})}
                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Rotation</label>
                            <span className="text-xs text-brand-600 font-bold">{config.rotation}°</span>
                        </div>
                        <input 
                            type="range" min="-180" max="180" step="1"
                            value={config.rotation}
                            onChange={(e) => setConfig({...config, rotation: parseInt(e.target.value)})}
                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                        />
                    </div>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-gray-200 p-8 flex items-center justify-center overflow-auto">
                {loading ? (
                    <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
                ) : (
                    <div className="relative shadow-2xl bg-white" style={{ width: pageSize?.width || 595, height: pageSize?.height || 842 }}>
                        {previewImage && <img src={previewImage} alt="PDF Preview" className="w-full h-full pointer-events-none" />}
                        
                        {/* Interactive Watermark Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                            <div 
                                style={{ 
                                    opacity: config.opacity, 
                                    transform: `rotate(${config.rotation}deg)`,
                                    color: config.color,
                                    fontSize: `${config.fontSize}px`,
                                    fontFamily: config.fontFamily === 'Helvetica' ? 'sans-serif' : 'serif'
                                }}
                                className="whitespace-nowrap font-bold"
                            >
                                {config.type === 'text' ? (
                                    config.text
                                ) : (
                                    config.imageSrc && <img src={config.imageSrc} alt="Watermark" style={{ width: '200px' }} />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default WatermarkPdf;