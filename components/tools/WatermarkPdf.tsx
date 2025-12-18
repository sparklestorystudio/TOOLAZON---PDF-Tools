import React, { useState, useRef, useEffect } from 'react';
import { 
  FileUp, Download, Check, Loader2, Stamp, RefreshCw, 
  Type, ImageIcon, Palette, RotateCw, Layers, Plus, Minus, ArrowLeft,
  LayoutGrid
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { useLanguage } from '../../contexts/LanguageContext';
import ProcessingOverlay from '../ProcessingOverlay';

// Safely handle pdfjs-dist import
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

if (pdfjs && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

type WatermarkPosition = 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface WatermarkConfig {
  type: 'text' | 'image';
  text: string;
  imageSrc: string | null;
  opacity: number;
  rotation: number;
  fontSize: number;
  imageScale: number;
  color: string;
  fontFamily: string;
  position: WatermarkPosition;
}

const WatermarkPdf: React.FC = () => {
  const { t } = useLanguage();
  
  // Workflow State
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'editor' | 'success'>('upload');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
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
      imageScale: 0.5,
      color: '#ff0000',
      fontFamily: 'Helvetica',
      position: 'center'
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

  const calculateCoordinates = (pageWidth: number, pageHeight: number, contentWidth: number, contentHeight: number) => {
      let x = 0;
      let y = 0;
      const margin = 40;

      switch (config.position) {
          case 'top-left': x = margin; y = pageHeight - contentHeight - margin; break;
          case 'top-center': x = (pageWidth - contentWidth) / 2; y = pageHeight - contentHeight - margin; break;
          case 'top-right': x = pageWidth - contentWidth - margin; y = pageHeight - contentHeight - margin; break;
          case 'center-left': x = margin; y = (pageHeight - contentHeight) / 2; break;
          case 'center': x = (pageWidth - contentWidth) / 2; y = (pageHeight - contentHeight) / 2; break;
          case 'center-right': x = pageWidth - contentWidth - margin; y = (pageHeight - contentHeight) / 2; break;
          case 'bottom-left': x = margin; y = margin; break;
          case 'bottom-center': x = (pageWidth - contentWidth) / 2; y = margin; break;
          case 'bottom-right': x = pageWidth - contentWidth - margin; y = margin; break;
      }
      return { x, y };
  };

  const handleApply = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);

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

      for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          const { width, height } = page.getSize();
          
          if (config.type === 'text') {
              const textWidth = font.widthOfTextAtSize(config.text, config.fontSize);
              const textHeight = config.fontSize; // Approximate
              const { x, y } = calculateCoordinates(width, height, textWidth, textHeight);
              const { r, g, b } = hexToRgb(config.color);
              
              page.drawText(config.text, {
                  x,
                  y,
                  size: config.fontSize,
                  font: font,
                  color: rgb(r, g, b),
                  opacity: config.opacity,
                  rotate: degrees(config.rotation),
              });
          } else if (watermarkImage) {
              const dims = watermarkImage.scale(config.imageScale);
              const { x, y } = calculateCoordinates(width, height, dims.width, dims.height);
              
              page.drawImage(watermarkImage, {
                  x,
                  y,
                  width: dims.width,
                  height: dims.height,
                  opacity: config.opacity,
                  rotate: degrees(config.rotation),
              });
          }
          setProgress(Math.round(((i + 1) / pages.length) * 100));
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
    setProgress(0);
  };

  if (step === 'upload') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 py-20 px-4 font-sans transition-colors">
        <h1 className="text-4xl font-black text-gray-800 dark:text-gray-100 mb-3 text-center tracking-tight leading-tight">Watermark PDF</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 text-center font-medium max-w-xl">Add text or image watermark to your PDF documents in seconds.</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-7 rounded-2xl shadow-xl shadow-brand-200 dark:shadow-brand-900/20 transition-all flex items-center justify-center gap-3 text-2xl group transform hover:-translate-y-1"
           >
             <Stamp className="w-9 h-9 group-hover:-translate-y-1 transition-transform" />
             Upload PDF file
           </button>
           <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
        </div>
      </div>
    );
  }

  if (step === 'success' && resultUrl) {
    return (
      <div className="min-h-[80vh] bg-gray-50 dark:bg-gray-950 flex flex-col items-center pt-24 px-4 font-sans transition-colors">
        <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-8 tracking-tight">Watermark applied!</h2>
        <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 max-w-2xl w-full text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-8 animate-in zoom-in duration-700">
                <Check className="w-12 h-12" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg font-medium">Your document is ready for download.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={resultUrl} download={`watermarked_${file?.name}`} className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-brand-900/20 flex items-center justify-center gap-3 text-lg transition-all transform hover:-translate-y-1">
                    <Download className="w-6 h-6" /> Download PDF
                </a>
                <button onClick={reset} className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold py-4 px-8 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 transition-all">
                    <RefreshCw className="w-5 h-5" /> Start Over
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col font-sans transition-colors">
        {processing && <ProcessingOverlay status="Applying watermark..." progress={progress} />}
        
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 px-6 flex items-center justify-between sticky top-[70px] z-30 shadow-sm">
            <div className="flex items-center gap-4">
                <button onClick={reset} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><ArrowLeft className="w-5 h-5"/></button>
                <div>
                    <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 tracking-tight">Watermark PDF</h2>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{file?.name}</div>
                </div>
            </div>
            <button 
                onClick={handleApply}
                disabled={processing}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-black py-3 px-8 rounded-xl shadow-lg shadow-brand-100 dark:shadow-brand-900/20 flex items-center justify-center transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
                {processing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Stamp className="w-5 h-5 mr-2" />}
                Apply Watermark
            </button>
        </div>

        <div className="flex-1 flex flex-col lg:row overflow-hidden flex-row">
            {/* Sidebar Controls */}
            <div className="w-full md:w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-6 overflow-y-auto z-20 shadow-xl transition-colors">
                <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Settings</h3>
                
                <div className="flex bg-gray-50 dark:bg-gray-800 p-1 rounded-xl mb-8">
                    <button 
                        onClick={() => setConfig({...config, type: 'text'})}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${config.type === 'text' ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                        <Type className="w-4 h-4" /> Text
                    </button>
                    <button 
                        onClick={() => setConfig({...config, type: 'image'})}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${config.type === 'image' ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                        <ImageIcon className="w-4 h-4" /> Image
                    </button>
                </div>

                {config.type === 'text' ? (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Content</label>
                            <input 
                                type="text" 
                                value={config.text}
                                onChange={(e) => setConfig({...config, text: e.target.value})}
                                className="w-full border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-white rounded-xl p-3 text-sm focus:border-brand-500 outline-none transition-all font-bold"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Color</label>
                                <div className="flex items-center gap-2 border-2 border-gray-50 dark:border-gray-800 rounded-xl p-1.5 bg-gray-50 dark:bg-gray-950">
                                    <input 
                                        type="color" 
                                        value={config.color}
                                        onChange={(e) => setConfig({...config, color: e.target.value})}
                                        className="w-8 h-8 border-0 p-0 rounded-lg cursor-pointer"
                                    />
                                    <span className="text-[10px] text-gray-400 font-black font-mono uppercase">{config.color}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Font Size</label>
                                <input 
                                    type="number" 
                                    value={config.fontSize}
                                    onChange={(e) => setConfig({...config, fontSize: Number(e.target.value)})}
                                    className="w-full border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-white rounded-xl p-3 text-sm font-bold"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Image Source</label>
                            <button 
                                onClick={() => watermarkImageInputRef.current?.click()}
                                className="w-full py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group overflow-hidden bg-gray-50/50 dark:bg-gray-900"
                            >
                                {config.imageSrc ? (
                                    <img src={config.imageSrc} alt="Preview" className="w-24 h-24 object-contain animate-in zoom-in-95 duration-300" />
                                ) : (
                                    <>
                                        <ImageIcon className="w-10 h-10 text-gray-300 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Upload Logo</span>
                                    </>
                                )}
                            </button>
                            <input type="file" ref={watermarkImageInputRef} onChange={handleWatermarkImageUpload} accept="image/*" className="hidden" />
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Image Scale</label>
                                <span className="text-xs text-brand-600 dark:text-brand-400 font-black">{Math.round(config.imageScale * 100)}%</span>
                            </div>
                            <input 
                                type="range" min="0.05" max="2" step="0.05"
                                value={config.imageScale}
                                onChange={(e) => setConfig({...config, imageScale: parseFloat(e.target.value)})}
                                className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                            />
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-8 border-t border-gray-50 dark:border-gray-800 space-y-8">
                    <div>
                        <div className="flex justify-between mb-3">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Opacity</label>
                            <span className="text-xs text-brand-600 dark:text-brand-400 font-black">{Math.round(config.opacity * 100)}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="1" step="0.05"
                            value={config.opacity}
                            onChange={(e) => setConfig({...config, opacity: parseFloat(e.target.value)})}
                            className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between mb-3">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Rotation</label>
                            <span className="text-xs text-brand-600 dark:text-brand-400 font-black">{config.rotation}°</span>
                        </div>
                        <input 
                            type="range" min="-180" max="180" step="1"
                            value={config.rotation}
                            onChange={(e) => setConfig({...config, rotation: parseInt(e.target.value)})}
                            className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <LayoutGrid className="w-3 h-3" /> Positioning
                        </label>
                        <div className="grid grid-cols-3 gap-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl">
                            {(['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'] as WatermarkPosition[]).map((pos) => (
                                <button
                                    key={pos}
                                    onClick={() => setConfig({...config, position: pos})}
                                    className={`aspect-square border-2 rounded-lg transition-all ${config.position === pos ? 'border-brand-500 bg-brand-500 shadow-md' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-brand-300'}`}
                                    title={pos.replace('-', ' ')}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-gray-100 dark:bg-gray-950 p-8 md:p-12 flex items-center justify-center overflow-auto relative transition-colors">
                {loading ? (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Rendering...</span>
                    </div>
                ) : (
                    <div className="relative shadow-2xl bg-white animate-in fade-in zoom-in-95 duration-500" style={{ width: pageSize?.width || 595, height: pageSize?.height || 842 }}>
                        {previewImage && <img src={previewImage} alt="PDF Preview" className="w-full h-full pointer-events-none rounded-sm" />}
                        
                        {/* Interactive Watermark Overlay */}
                        <div 
                            className={`absolute inset-0 flex pointer-events-none overflow-hidden p-10
                                ${config.position.includes('top') ? 'items-start' : config.position.includes('bottom') ? 'items-end' : 'items-center'}
                                ${config.position.includes('left') ? 'justify-start' : config.position.includes('right') ? 'justify-end' : 'justify-center'}
                            `}
                        >
                            <div 
                                style={{ 
                                    opacity: config.opacity, 
                                    transform: `rotate(${config.rotation}deg)`,
                                    color: config.color,
                                    fontSize: `${config.fontSize}px`,
                                    fontFamily: config.fontFamily === 'Helvetica' ? 'sans-serif' : 'serif'
                                }}
                                className="whitespace-nowrap font-black drop-shadow-sm transition-all duration-300"
                            >
                                {config.type === 'text' ? (
                                    config.text
                                ) : (
                                    config.imageSrc && (
                                        <img 
                                            src={config.imageSrc} 
                                            alt="Watermark" 
                                            style={{ width: `${300 * config.imageScale}px` }} 
                                            className="transition-all duration-300"
                                        />
                                    )
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