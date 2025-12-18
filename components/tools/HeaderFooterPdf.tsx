
import React, { useState, useRef, useEffect } from 'react';
import { FileUp, ChevronDown, Check, Loader2, Download, RefreshCw, Type, AlignLeft, AlignCenter, AlignRight, LayoutTemplate, Plus, ArrowLeft, Layout } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { useLanguage } from '../../contexts/LanguageContext';
import ProcessingOverlay from '../ProcessingOverlay';

// Safely handle pdfjs-dist import
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

if (pdfjs && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

interface HeaderFooterConfig {
  topLeft: string;
  topCenter: string;
  topRight: string;
  bottomLeft: string;
  bottomCenter: string;
  bottomRight: string;
  fontSize: number;
  fontFamily: string;
  marginTop: number;
  marginBottom: number;
  color: string;
}

const POSITIONS = [
  { id: 'topLeft', label: 'Left', group: 'Header', align: 'left' },
  { id: 'topCenter', label: 'Center', group: 'Header', align: 'center' },
  { id: 'topRight', label: 'Right', group: 'Header', align: 'right' },
  { id: 'bottomLeft', label: 'Left', group: 'Footer', align: 'left' },
  { id: 'bottomCenter', label: 'Center', group: 'Footer', align: 'center' },
  { id: 'bottomRight', label: 'Right', group: 'Footer', align: 'right' },
] as const;

const HeaderFooterPdf: React.FC = () => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'editor' | 'success'>('upload');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{width: number, height: number} | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  
  const [config, setConfig] = useState<HeaderFooterConfig>({
      topLeft: '', topCenter: '', topRight: '',
      bottomLeft: '', bottomCenter: '', bottomRight: '',
      fontSize: 10,
      fontFamily: 'Helvetica',
      marginTop: 30, // Default margin in points (approx 0.4 inch)
      marginBottom: 30,
      color: '#000000'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const insertMacro = (macro: string, positionId: keyof HeaderFooterConfig) => {
      setConfig(prev => ({
          ...prev,
          [positionId]: (prev[positionId] + ` ${macro}`).trim()
      }));
  };

  const handleApply = async () => {
      if (!file) return;
      setProcessing(true);
      setProgress(0);

      try {
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer, { password: '' } as any);
          const pages = pdfDoc.getPages();
          const totalPages = pages.length;

          // Fonts
          const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const times = await pdfDoc.embedFont(StandardFonts.TimesRoman);
          const courier = await pdfDoc.embedFont(StandardFonts.Courier);
          
          const fontMap: Record<string, any> = {
              'Helvetica': helvetica,
              'Times New Roman': times,
              'Courier New': courier
          };
          
          const font = fontMap[config.fontFamily] || helvetica;
          const { marginTop, marginBottom, fontSize } = config;

          // Helper to draw text
          const draw = (page: any, text: string, x: number, y: number, align: 'left' | 'center' | 'right') => {
              if (!text.trim()) return;
              
              const textWidth = font.widthOfTextAtSize(text, fontSize);
              let drawX = x;
              
              if (align === 'center') drawX = x - (textWidth / 2);
              if (align === 'right') drawX = x - textWidth;

              const r = parseInt(config.color.slice(1, 3), 16) / 255;
              const g = parseInt(config.color.slice(3, 5), 16) / 255;
              const b = parseInt(config.color.slice(5, 7), 16) / 255;

              page.drawText(text, {
                  x: drawX,
                  y: y,
                  size: fontSize,
                  font: font,
                  color: rgb(r, g, b),
              });
          };

          for (let idx = 0; idx < pages.length; idx++) {
              const page = pages[idx];
              const { width, height } = page.getSize();
              const pageNum = idx + 1;
              const dateStr = new Date().toLocaleDateString();
              
              const replaceMacros = (str: string) => {
                  return str
                    .replace(/\[page\]/g, pageNum.toString())
                    .replace(/\[total\]/g, totalPages.toString())
                    .replace(/\[date\]/g, dateStr);
              };

              const headerY = height - marginTop - fontSize;
              const footerY = marginBottom;
              const marginX = 30; 

              draw(page, replaceMacros(config.topLeft), marginX, headerY, 'left');
              draw(page, replaceMacros(config.topCenter), width / 2, headerY, 'center');
              draw(page, replaceMacros(config.topRight), width - marginX, headerY, 'right');

              draw(page, replaceMacros(config.bottomLeft), marginX, footerY, 'left');
              draw(page, replaceMacros(config.bottomCenter), width / 2, footerY, 'center');
              draw(page, replaceMacros(config.bottomRight), width - marginX, footerY, 'right');

              setProgress(Math.round(((idx + 1) / totalPages) * 100));
          }

          const pdfBytes = await pdfDoc.save();
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setResultUrl(url);
          setStep('success');
      } catch (e: any) {
          console.error(e);
          if (e.message && (e.message.includes('encrypted') || e.message.includes('password'))) {
            alert("This file is password protected. Please unlock it first.");
          } else {
            alert("Error processing PDF");
          }
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
      setConfig({
          topLeft: '', topCenter: '', topRight: '',
          bottomLeft: '', bottomCenter: '', bottomRight: '',
          fontSize: 10,
          fontFamily: 'Helvetica',
          marginTop: 30,
          marginBottom: 30,
          color: '#000000'
      });
  };

  if (step === 'upload') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 py-20 px-4 font-sans transition-colors">
        <h1 className="text-4xl font-black text-gray-800 dark:text-white mb-2 text-center tracking-tight">Header & Footer</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 text-center font-medium max-w-xl">Apply dynamic page numbers or custom text labels to your PDF files.</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-7 rounded-2xl shadow-xl shadow-brand-200 dark:shadow-brand-900/20 transition-all flex items-center justify-center gap-4 text-2xl group transform hover:-translate-y-1"
           >
             <LayoutTemplate className="w-9 h-9 group-hover:-translate-y-1 transition-transform" />
             Upload PDF file
           </button>
           <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
           <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4 font-black uppercase tracking-widest">
             Or drag and drop file here
           </p>
        </div>
      </div>
    );
  }

  if (step === 'success' && resultUrl) {
    return (
      <div className="min-h-[80vh] bg-gray-50 dark:bg-gray-950 flex flex-col items-center pt-24 px-4 font-sans transition-colors">
        <h2 className="text-4xl font-black text-gray-800 dark:text-white mb-8 tracking-tighter">Labels Applied!</h2>
        <div className="bg-white dark:bg-gray-900 p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 max-w-2xl w-full text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
                <Check className="w-12 h-12" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-12 font-medium">Header and Footer tags have been applied to every page.</p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <a href={resultUrl} download={`processed_${file?.name}`} className="bg-brand-500 hover:bg-brand-600 text-white font-black py-5 px-12 rounded-2xl shadow-xl shadow-brand-100 dark:shadow-brand-900/20 flex items-center justify-center gap-3 text-xl transition-all transform hover:-translate-y-1 active:scale-95 active:translate-y-0">
                    <Download className="w-6 h-6" /> Download
                </a>
                <button onClick={reset} className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold py-5 px-8 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5" /> Start Over
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col font-sans transition-colors">
        {processing && <ProcessingOverlay status="Stamping pages..." progress={progress} />}
        
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 px-6 flex items-center justify-between sticky top-[70px] z-30 shadow-sm transition-colors">
            <div className="flex items-center gap-4">
                <button onClick={reset} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><ArrowLeft className="w-5 h-5"/></button>
                <div>
                    <h2 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">Header & Footer</h2>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px] md:max-w-xs">{file?.name}</div>
                </div>
            </div>
            <button 
                onClick={handleApply}
                disabled={processing}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-black py-3 px-10 rounded-xl shadow-lg shadow-brand-100 dark:shadow-brand-900/20 flex items-center justify-center transition-all transform hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-widest text-xs"
            >
                Apply changes
            </button>
        </div>

        <div className="flex-1 flex flex-col lg:row overflow-hidden flex-row">
            {/* Left Sidebar - Config */}
            <div className="w-full md:w-96 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-y-auto transition-colors z-20 shadow-xl">
                {/* Style Settings */}
                <div className="p-8 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <Type className="w-3.5 h-3.5" /> Appearance Settings
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Font Family</label>
                            <select 
                                value={config.fontFamily}
                                onChange={(e) => setConfig({...config, fontFamily: e.target.value})}
                                className="w-full border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 rounded-xl px-3 py-2.5 text-sm font-bold focus:border-brand-500 outline-none transition-all cursor-pointer"
                            >
                                <option value="Helvetica">Helvetica</option>
                                <option value="Times New Roman">Times New Roman</option>
                                <option value="Courier New">Courier</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                             <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Size (pts)</label>
                             <input 
                                type="number" 
                                value={config.fontSize}
                                onChange={(e) => setConfig({...config, fontSize: Number(e.target.value)})}
                                className="w-full border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 rounded-xl px-3 py-2.5 text-sm font-bold"
                             />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Color</label>
                            <div className="flex items-center gap-3 border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 rounded-xl p-1.5 pr-4">
                                <input 
                                    type="color" 
                                    value={config.color}
                                    onChange={(e) => setConfig({...config, color: e.target.value})}
                                    className="w-8 h-8 p-0 border-0 rounded-lg cursor-pointer flex-shrink-0"
                                />
                                <span className="text-[10px] text-gray-400 font-mono font-black uppercase truncate">{config.color}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Top Margin</label>
                            <input 
                                type="number" 
                                value={config.marginTop}
                                onChange={(e) => setConfig({...config, marginTop: Number(e.target.value)})}
                                className="w-full border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 rounded-xl px-3 py-2.5 text-sm font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Bottom Margin</label>
                            <input 
                                type="number" 
                                value={config.marginBottom}
                                onChange={(e) => setConfig({...config, marginBottom: Number(e.target.value)})}
                                className="w-full border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 rounded-xl px-3 py-2.5 text-sm font-bold"
                            />
                        </div>
                    </div>
                </div>

                {/* Content Settings */}
                <div className="flex-1 p-8 space-y-10">
                    <div>
                        <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <Layout className="w-3.5 h-3.5" /> Header Content
                        </h3>
                        <div className="space-y-4">
                            {POSITIONS.filter(p => p.group === 'Header').map(pos => (
                                <div key={pos.id} className="space-y-1.5">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{pos.label} Alignment</label>
                                        <div className="flex gap-1">
                                            <button onClick={() => insertMacro('[page]', pos.id as any)} className="text-[9px] font-black uppercase text-brand-500 hover:text-brand-600 transition-colors">Add Page #</button>
                                            <span className="text-gray-200">|</span>
                                            <button onClick={() => insertMacro('[date]', pos.id as any)} className="text-[9px] font-black uppercase text-brand-500 hover:text-brand-600 transition-colors">Add Date</button>
                                        </div>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 group-hover:text-brand-500 transition-colors pointer-events-none">
                                            {pos.align === 'left' ? <AlignLeft className="w-4 h-4"/> : pos.align === 'center' ? <AlignCenter className="w-4 h-4"/> : <AlignRight className="w-4 h-4"/>}
                                        </div>
                                        <input 
                                            type="text" 
                                            value={(config as any)[pos.id]}
                                            onChange={(e) => setConfig({...config, [pos.id]: e.target.value})}
                                            placeholder={`Type header text...`}
                                            className="w-full border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold focus:border-brand-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <LayoutTemplate className="w-3.5 h-3.5" /> Footer Content
                        </h3>
                        <div className="space-y-4">
                            {POSITIONS.filter(p => p.group === 'Footer').map(pos => (
                                <div key={pos.id} className="space-y-1.5">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{pos.label} Alignment</label>
                                        <div className="flex gap-1">
                                            <button onClick={() => insertMacro('[page]', pos.id as any)} className="text-[9px] font-black uppercase text-brand-500 hover:text-brand-600 transition-colors">Add Page #</button>
                                            <span className="text-gray-200">|</span>
                                            <button onClick={() => insertMacro('[date]', pos.id as any)} className="text-[9px] font-black uppercase text-brand-500 hover:text-brand-600 transition-colors">Add Date</button>
                                        </div>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 group-hover:text-brand-500 transition-colors pointer-events-none">
                                            {pos.align === 'left' ? <AlignLeft className="w-4 h-4"/> : pos.align === 'center' ? <AlignCenter className="w-4 h-4"/> : <AlignRight className="w-4 h-4"/>}
                                        </div>
                                        <input 
                                            type="text" 
                                            value={(config as any)[pos.id]}
                                            onChange={(e) => setConfig({...config, [pos.id]: e.target.value})}
                                            placeholder={`Type footer text...`}
                                            className="w-full border-2 border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold focus:border-brand-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right - Preview */}
            <div className="flex-1 bg-gray-100 dark:bg-gray-950 p-8 md:p-12 flex items-center justify-center overflow-auto relative transition-colors">
                {loading ? (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-brand-500 animate-spin" />
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Generating Live Preview</span>
                    </div>
                ) : previewImage && (
                    <div className="relative shadow-2xl bg-white rounded-sm border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-500">
                        <img src={previewImage} alt="Preview" className="max-h-[75vh] w-auto pointer-events-none" />
                        
                        {/* Overlay Preview Elements */}
                        {/* Header Zone */}
                        <div className="absolute top-0 left-0 right-0 px-[6%]" style={{ paddingTop: `${(config.marginTop / (pageSize?.height || 792)) * 100}%` }}>
                            <div className="flex justify-between items-start text-xs leading-none" 
                                 style={{ 
                                     fontFamily: config.fontFamily === 'Helvetica' ? 'sans-serif' : 'serif', 
                                     fontSize: `${config.fontSize}px`, 
                                     color: config.color 
                                 }}
                            >
                                <div className="w-1/3 text-left whitespace-pre-wrap truncate">{config.topLeft.replace(/\[page\]/g, '1').replace(/\[total\]/g, '5').replace(/\[date\]/g, new Date().toLocaleDateString())}</div>
                                <div className="w-1/3 text-center whitespace-pre-wrap truncate">{config.topCenter.replace(/\[page\]/g, '1').replace(/\[total\]/g, '5').replace(/\[date\]/g, new Date().toLocaleDateString())}</div>
                                <div className="w-1/3 text-right whitespace-pre-wrap truncate">{config.topRight.replace(/\[page\]/g, '1').replace(/\[total\]/g, '5').replace(/\[date\]/g, new Date().toLocaleDateString())}</div>
                            </div>
                        </div>

                        {/* Footer Zone */}
                        <div className="absolute bottom-0 left-0 right-0 px-[6%]" style={{ paddingBottom: `${(config.marginBottom / (pageSize?.height || 792)) * 100}%` }}>
                             <div className="flex justify-between items-end text-xs leading-none" 
                                 style={{ 
                                     fontFamily: config.fontFamily === 'Helvetica' ? 'sans-serif' : 'serif', 
                                     fontSize: `${config.fontSize}px`, 
                                     color: config.color 
                                 }}
                            >
                                <div className="w-1/3 text-left whitespace-pre-wrap truncate">{config.bottomLeft.replace(/\[page\]/g, '1').replace(/\[total\]/g, '5').replace(/\[date\]/g, new Date().toLocaleDateString())}</div>
                                <div className="w-1/3 text-center whitespace-pre-wrap truncate">{config.bottomCenter.replace(/\[page\]/g, '1').replace(/\[total\]/g, '5').replace(/\[date\]/g, new Date().toLocaleDateString())}</div>
                                <div className="w-1/3 text-right whitespace-pre-wrap truncate">{config.bottomRight.replace(/\[page\]/g, '1').replace(/\[total\]/g, '5').replace(/\[date\]/g, new Date().toLocaleDateString())}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default HeaderFooterPdf;
