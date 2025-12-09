import React, { useState, useRef, useEffect } from 'react';
import { FileUp, ChevronDown, Check, Loader2, Download, RefreshCw, Type, AlignLeft, AlignCenter, AlignRight, LayoutTemplate, Plus } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { useLanguage } from '../../contexts/LanguageContext';

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
          [positionId]: prev[positionId] + ` ${macro}`
      }));
  };

  const handleApply = async () => {
      if (!file) return;
      setProcessing(true);

      try {
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer);
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

              // Parse Color
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

          pages.forEach((page, idx) => {
              const { width, height } = page.getSize();
              const pageNum = idx + 1;
              const dateStr = new Date().toLocaleDateString();
              
              const replaceMacros = (str: string) => {
                  return str
                    .replace(/\[page\]/g, pageNum.toString())
                    .replace(/\[total\]/g, totalPages.toString())
                    .replace(/\[date\]/g, dateStr);
              };

              // Header Y position (top down margin)
              const headerY = height - marginTop - fontSize;
              // Footer Y position (bottom up margin)
              const footerY = marginBottom;

              // Header
              // For header, we use a fixed horizontal margin of 30 for left/right alignment or user defined logic?
              // The original code used `margin` for both vertical Y and horizontal X padding.
              // Let's use 30 as a safe horizontal margin or reuse the vertical margin if no horizontal is specified.
              // We'll stick to a default horizontal padding of 30pts for now to keep it simple, or use marginTop as approximate.
              const marginX = 30; 

              draw(page, replaceMacros(config.topLeft), marginX, headerY, 'left');
              draw(page, replaceMacros(config.topCenter), width / 2, headerY, 'center');
              draw(page, replaceMacros(config.topRight), width - marginX, headerY, 'right');

              // Footer
              draw(page, replaceMacros(config.bottomLeft), marginX, footerY, 'left');
              draw(page, replaceMacros(config.bottomCenter), width / 2, footerY, 'center');
              draw(page, replaceMacros(config.bottomRight), width - marginX, footerY, 'right');
          });

          const pdfBytes = await pdfDoc.save();
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setResultUrl(url);
          setStep('success');
      } catch (e) {
          console.error(e);
          alert("Error processing PDF");
      } finally {
          setProcessing(false);
      }
  };

  const reset = () => {
      setFile(null);
      setStep('upload');
      setResultUrl(null);
      setPreviewImage(null);
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

  // UPLOAD VIEW
  if (step === 'upload') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 py-20 px-4 font-sans">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">{t('tool.header-footer.title')}</h1>
        <p className="text-gray-500 text-lg mb-10 text-center">{t('tool.header-footer.desc')}</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-3 text-xl group"
           >
             <FileUp className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />
             {t('ui.upload', 'Upload PDF file')}
             <ChevronDown className="w-5 h-5 ml-2" />
           </button>
           <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
           <p className="text-xs text-center text-gray-400 mt-4">
             Or drag and drop file here
           </p>
        </div>

        <div className="mt-16 max-w-2xl text-center">
            <h3 className="font-bold text-gray-700 mb-2">How to add header and footer to PDF</h3>
            <p className="text-sm text-gray-500">
                Upload your PDF document. Type text or insert page numbers in the header or footer sections. Click 'Apply Header & Footer' to save.
            </p>
        </div>
      </div>
    );
  }

  // SUCCESS VIEW
  if (step === 'success' && resultUrl) {
    return (
      <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center pt-12 px-4 font-sans">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Your document is ready</h2>
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-2xl w-full text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8" />
            </div>
            <p className="text-gray-500 mb-8">Header and Footer applied successfully.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={resultUrl} download={`processed_${file?.name}`} className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-md shadow-md flex items-center justify-center gap-2 transition-colors">
                    <Download className="w-5 h-5" /> Download
                </a>
                <button onClick={reset} className="bg-white border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors">
                    <RefreshCw className="w-4 h-4" /> Start Over
                </button>
            </div>
        </div>
      </div>
    );
  }

  // EDITOR VIEW
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between sticky top-[60px] z-30 shadow-sm">
            <div>
                <h2 className="text-xl font-bold text-gray-800">{t('tool.header-footer.title')}</h2>
                <div className="text-sm text-gray-500">{file?.name}</div>
            </div>
            <button 
                onClick={handleApply}
                disabled={processing}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-bold py-2 px-6 rounded shadow-sm flex items-center justify-center transition-colors"
            >
                {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {t('headerfooter.apply', 'Apply changes')}
            </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Sidebar - Config */}
            <div className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
                {/* Style Settings */}
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Type className="w-4 h-4" /> {t('headerfooter.style', 'Style')}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Font Family</label>
                            <select 
                                value={config.fontFamily}
                                onChange={(e) => setConfig({...config, fontFamily: e.target.value})}
                                className="w-full border border-gray-300 rounded p-2 text-sm"
                            >
                                <option value="Helvetica">Helvetica</option>
                                <option value="Times New Roman">Times New Roman</option>
                                <option value="Courier New">Courier</option>
                            </select>
                        </div>
                        <div>
                             <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
                             <input 
                                type="number" 
                                value={config.fontSize}
                                onChange={(e) => setConfig({...config, fontSize: Number(e.target.value)})}
                                className="w-full border border-gray-300 rounded p-2 text-sm"
                             />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="color" 
                                    value={config.color}
                                    onChange={(e) => setConfig({...config, color: e.target.value})}
                                    className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                />
                                <span className="text-xs text-gray-500">{config.color}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Top Margin (pts)</label>
                            <input 
                                type="number" 
                                value={config.marginTop}
                                onChange={(e) => setConfig({...config, marginTop: Number(e.target.value)})}
                                className="w-full border border-gray-300 rounded p-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Bottom Margin (pts)</label>
                            <input 
                                type="number" 
                                value={config.marginBottom}
                                onChange={(e) => setConfig({...config, marginBottom: Number(e.target.value)})}
                                className="w-full border border-gray-300 rounded p-2 text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Content Settings */}
                <div className="flex-1 p-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <LayoutTemplate className="w-4 h-4" /> {t('headerfooter.content', 'Content')}
                    </h3>

                    <div className="space-y-6">
                        {/* Header Inputs */}
                        <div>
                            <span className="text-sm font-bold text-gray-700 block mb-2">{t('headerfooter.header', 'Header')}</span>
                            <div className="space-y-2">
                                {POSITIONS.filter(p => p.group === 'Header').map(pos => (
                                    <div key={pos.id} className="relative">
                                        <div className="absolute left-2 top-2 text-gray-400 pointer-events-none">
                                            {pos.align === 'left' ? <AlignLeft className="w-3 h-3"/> : pos.align === 'center' ? <AlignCenter className="w-3 h-3"/> : <AlignRight className="w-3 h-3"/>}
                                        </div>
                                        <input 
                                            type="text" 
                                            value={(config as any)[pos.id]}
                                            onChange={(e) => setConfig({...config, [pos.id]: e.target.value})}
                                            placeholder={`${pos.label} Text`}
                                            className="w-full border border-gray-300 rounded pl-8 pr-2 py-1.5 text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none"
                                        />
                                        <div className="flex gap-1 mt-1 justify-end">
                                            <button onClick={() => insertMacro('[page]', pos.id as any)} className="text-[10px] bg-gray-100 hover:bg-gray-200 px-2 rounded text-gray-600 flex items-center"><Plus className="w-3 h-3 mr-0.5"/> Page #</button>
                                            <button onClick={() => insertMacro('[date]', pos.id as any)} className="text-[10px] bg-gray-100 hover:bg-gray-200 px-2 rounded text-gray-600 flex items-center"><Plus className="w-3 h-3 mr-0.5"/> Date</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer Inputs */}
                        <div>
                            <span className="text-sm font-bold text-gray-700 block mb-2">{t('headerfooter.footer', 'Footer')}</span>
                            <div className="space-y-2">
                                {POSITIONS.filter(p => p.group === 'Footer').map(pos => (
                                    <div key={pos.id} className="relative">
                                        <div className="absolute left-2 top-2 text-gray-400 pointer-events-none">
                                            {pos.align === 'left' ? <AlignLeft className="w-3 h-3"/> : pos.align === 'center' ? <AlignCenter className="w-3 h-3"/> : <AlignRight className="w-3 h-3"/>}
                                        </div>
                                        <input 
                                            type="text" 
                                            value={(config as any)[pos.id]}
                                            onChange={(e) => setConfig({...config, [pos.id]: e.target.value})}
                                            placeholder={`${pos.label} Text`}
                                            className="w-full border border-gray-300 rounded pl-8 pr-2 py-1.5 text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none"
                                        />
                                        <div className="flex gap-1 mt-1 justify-end">
                                            <button onClick={() => insertMacro('[page]', pos.id as any)} className="text-[10px] bg-gray-100 hover:bg-gray-200 px-2 rounded text-gray-600 flex items-center"><Plus className="w-3 h-3 mr-0.5"/> Page #</button>
                                            <button onClick={() => insertMacro('[date]', pos.id as any)} className="text-[10px] bg-gray-100 hover:bg-gray-200 px-2 rounded text-gray-600 flex items-center"><Plus className="w-3 h-3 mr-0.5"/> Date</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right - Preview */}
            <div className="flex-1 bg-gray-100 p-8 flex items-center justify-center overflow-auto relative">
                {loading && <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />}
                {!loading && previewImage && (
                    <div className="relative shadow-lg bg-white">
                        <img src={previewImage} alt="Preview" className="max-h-[80vh] w-auto border border-gray-200" />
                        
                        {/* Overlay Preview Elements */}
                        {/* Note: We use relative positioning percentages to approximate standard page layout for preview */}
                        {/* Header Zone */}
                        <div className="absolute top-0 left-0 right-0 px-[5%]" style={{ paddingTop: `${(config.marginTop / (pageSize?.height || 792)) * 100}%` }}>
                            <div className="flex justify-between items-start text-xs leading-none" 
                                 style={{ 
                                     fontFamily: config.fontFamily, 
                                     fontSize: `${config.fontSize}px`, 
                                     color: config.color 
                                 }}
                            >
                                <div className="w-1/3 text-left whitespace-pre-wrap">{config.topLeft.replace(/\[page\]/g, '1').replace(/\[total\]/g, '5').replace(/\[date\]/g, '12/31/2024')}</div>
                                <div className="w-1/3 text-center whitespace-pre-wrap">{config.topCenter.replace(/\[page\]/g, '1').replace(/\[total\]/g, '5').replace(/\[date\]/g, '12/31/2024')}</div>
                                <div className="w-1/3 text-right whitespace-pre-wrap">{config.topRight.replace(/\[page\]/g, '1').replace(/\[total\]/g, '5').replace(/\[date\]/g, '12/31/2024')}</div>
                            </div>
                        </div>

                        {/* Footer Zone */}
                        <div className="absolute bottom-0 left-0 right-0 px-[5%]" style={{ paddingBottom: `${(config.marginBottom / (pageSize?.height || 792)) * 100}%` }}>
                             <div className="flex justify-between items-end text-xs leading-none" 
                                 style={{ 
                                     fontFamily: config.fontFamily, 
                                     fontSize: `${config.fontSize}px`, 
                                     color: config.color 
                                 }}
                            >
                                <div className="w-1/3 text-left whitespace-pre-wrap">{config.bottomLeft.replace(/\[page\]/g, '1').replace(/\[total\]/g, '5').replace(/\[date\]/g, '12/31/2024')}</div>
                                <div className="w-1/3 text-center whitespace-pre-wrap">{config.bottomCenter.replace(/\[page\]/g, '1').replace(/\[total\]/g, '5').replace(/\[date\]/g, '12/31/2024')}</div>
                                <div className="w-1/3 text-right whitespace-pre-wrap">{config.bottomRight.replace(/\[page\]/g, '1').replace(/\[total\]/g, '5').replace(/\[date\]/g, '12/31/2024')}</div>
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