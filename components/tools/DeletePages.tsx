
import React, { useState, useRef } from 'react';
import { FileUp, ChevronDown, Check, Loader2, ZoomIn, ZoomOut, Trash2, HelpCircle, Download, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import ProcessingOverlay from '../ProcessingOverlay';

// Safely handle pdfjs-dist import
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

if (pdfjs && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

interface PageThumbnail {
  index: number;
  imageSrc: string;
  deleted: boolean;
}

const DeletePages: React.FC = () => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageThumbnail[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scale, setScale] = useState(1);
  const [deleteRange, setDeleteRange] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setResultUrl(null);
      await loadPdfPages(selectedFile);
    }
  };

  const loadPdfPages = async (file: File) => {
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const newPages: PageThumbnail[] = [];

      const limit = Math.min(numPages, 100); 
      
      for (let i = 1; i <= limit; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
          
          newPages.push({
            index: i - 1,
            imageSrc: canvas.toDataURL(),
            deleted: false 
          });
        }
      }
      setPages(newPages);
    } catch (error: any) {
      console.error("Error loading PDF", error);
      if (error?.name === 'PasswordException') {
          alert("This file is password protected. Please unlock it first.");
      } else {
          alert("Error loading PDF. Please try another file.");
      }
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const togglePageDeletion = (index: number) => {
    setPages(prev => prev.map(p => 
      p.index === index ? { ...p, deleted: !p.deleted } : p
    ));
  };

  const resetSelection = () => {
    setPages(prev => prev.map(p => ({ ...p, deleted: false })));
    setDeleteRange('');
  };
  
  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDeleteRange(val);

    if (!val.trim()) {
        return;
    }

    const parts = val.split(',');
    const newDeletionSet = new Set<number>();

    parts.forEach(part => {
        const range = part.trim().split('-').map(Number);
        if (range.length === 1 && !isNaN(range[0]) && range[0] > 0) {
            newDeletionSet.add(range[0] - 1); 
        } else if (range.length === 2 && !isNaN(range[0]) && !isNaN(range[1])) {
            const start = Math.min(range[0], range[1]);
            const end = Math.max(range[0], range[1]);
            for (let i = start; i <= end; i++) {
                if (i > 0) newDeletionSet.add(i - 1);
            }
        }
    });

    setPages(prev => prev.map(p => ({
        ...p,
        deleted: newDeletionSet.has(p.index)
    })));
  };

  const handleApply = async () => {
    if (!file) return;
    const keepIndices = pages.filter(p => !p.deleted).map(p => p.index);
    
    if (keepIndices.length === 0) {
      alert("You cannot delete all pages!");
      return;
    }
    
    if (keepIndices.length === pages.length) {
       alert("No pages selected for deletion.");
       return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(90, prev + 10));
      }, 300);

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { password: '' } as any);
      const newPdf = await PDFDocument.create();
      
      const copiedPages = await newPdf.copyPages(pdfDoc, keepIndices);
      copiedPages.forEach(page => newPdf.addPage(page));
      
      const pdfBytes = await newPdf.save();
      
      clearInterval(progressInterval);
      setProgress(100);

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (error: any) {
      console.error("Error processing PDF", error);
      if (error.message && (error.message.includes('encrypted') || error.message.includes('password'))) {
          alert("This file is password protected. Please unlock it first.");
      } else {
          alert("Failed to delete pages.");
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleStartOver = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setFile(null);
    setPages([]);
    setDeleteRange('');
    setProgress(0);
  };

  if (!file) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 py-20 px-4 font-sans transition-colors">
        <h1 className="text-4xl font-black text-gray-800 dark:text-white mb-4 text-center tracking-tight">Delete PDF Pages</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 text-center font-medium">Remove pages from a PDF document</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-6 rounded-2xl shadow-xl shadow-brand-200 dark:shadow-brand-900/20 transition-all flex items-center justify-center gap-3 text-xl group"
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
           <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4 font-black uppercase tracking-widest">
             Or drag and drop files here
           </p>
        </div>

        <div className="mt-20 max-w-2xl text-center">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">How to delete pages from PDF</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                Click on the pages you want to remove. Click 'Apply changes' to download your new PDF. Files are safely uploaded over an encrypted connection and deleted permanently after processing.
            </p>
        </div>
      </div>
    );
  }

  if (resultUrl) {
    return (
      <div className="min-h-[80vh] bg-gray-50 dark:bg-gray-950 flex flex-col items-center pt-12 px-4 font-sans transition-colors">
        <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-8 tracking-tight">Your document is ready</h2>
        
        <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 max-w-2xl w-full text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-8 animate-in zoom-in duration-700">
                <Check className="w-12 h-12" />
            </div>
            
            <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg font-medium">
                Pages deleted successfully from your document.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                    href={resultUrl} 
                    download={`deleted_pages_${file.name}`}
                    className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-brand-100 dark:shadow-brand-900/20 flex items-center justify-center gap-3 text-lg transition-all transform hover:-translate-y-1"
                >
                    <Download className="w-6 h-6" />
                    Download PDF
                </a>
                <button 
                    onClick={handleStartOver}
                    className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold py-4 px-8 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                >
                    <RefreshCw className="w-5 h-5" />
                    Start Over
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col font-sans transition-colors">
      {processing && <ProcessingOverlay status="Deleting pages..." progress={progress} />}
      
      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 px-6 flex flex-col md:flex-row items-center justify-between sticky top-[60px] z-30 shadow-sm gap-4 md:gap-0">
        <div className="text-center md:text-left">
          <h2 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">Delete PDF Pages</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500 justify-center md:justify-start">
             <span className="truncate max-w-[200px] md:max-w-md">Selected: {file.name}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={resetSelection} className="text-brand-500 dark:text-brand-400 text-sm font-bold hover:underline">Reset selection</button>
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
             <button onClick={() => setScale(Math.max(0.5, scale - 0.1))} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"><ZoomOut className="w-4 h-4 text-gray-600 dark:text-gray-400" /></button>
             <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 w-10 text-center uppercase">{Math.round(scale * 100)}%</span>
             <button onClick={() => setScale(Math.min(2, scale + 0.1))} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"><ZoomIn className="w-4 h-4 text-gray-600 dark:text-gray-400" /></button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-y-auto p-8 bg-gray-100 dark:bg-gray-950">
        {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
                <p className="text-gray-500 font-bold tracking-tight">Loading document preview...</p>
            </div>
        ) : (
            <div className="flex flex-wrap justify-center gap-8">
                {pages.map((page) => (
                    <div 
                      key={page.index}
                      onClick={() => togglePageDeletion(page.index)}
                      className="relative cursor-pointer transition-all duration-200 group flex flex-col items-center"
                      style={{ width: `${150 * scale}px` }}
                    >
                        <div className={`relative w-full shadow-lg transition-all rounded-sm overflow-hidden ring-4 ring-offset-4 dark:ring-offset-gray-950 ${page.deleted ? 'ring-red-500/20 grayscale scale-95' : 'ring-transparent hover:ring-brand-500/10'}`}>
                           <img 
                             src={page.imageSrc} 
                             alt={`Page ${page.index + 1}`} 
                             className={`w-full h-auto pointer-events-none select-none transition-opacity ${page.deleted ? 'opacity-40' : 'opacity-100'}`} 
                           />

                           {!page.deleted && (
                               <div className="absolute inset-0 bg-white/60 dark:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-[1px]">
                                   <div className="bg-red-500 text-white p-3 rounded-full shadow-xl transform scale-0 group-hover:scale-100 transition-transform duration-300">
                                      <Trash2 className="w-6 h-6" />
                                   </div>
                               </div>
                           )}

                           {page.deleted && (
                               <div className="absolute inset-0 bg-red-500/5 flex flex-col items-center justify-center backdrop-blur-[2px]">
                                   <div className="bg-white/90 dark:bg-gray-800/90 p-2 rounded-lg shadow-sm border border-red-100 dark:border-red-900 flex items-center gap-2">
                                       <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                       <span className="text-red-600 dark:text-red-400 font-black text-[10px] uppercase tracking-widest">Delete</span>
                                   </div>
                               </div>
                           )}
                        </div>
                        
                        <div className={`text-center mt-4 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${page.deleted ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                            {page.deleted ? 'Deleted' : `Page ${page.index + 1}`}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-[#fff9e6] dark:bg-gray-900 border-t border-orange-100 dark:border-gray-800 p-5 sticky bottom-0 z-40 transition-colors">
        <div className="max-w-[900px] mx-auto flex flex-col items-center text-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                <span className="font-black text-gray-800 dark:text-gray-200 text-xs uppercase tracking-widest whitespace-nowrap">Bulk Delete Ranges:</span>
                <div className="relative flex-1 w-full group">
                    <input 
                        type="text" 
                        placeholder="Examples: 1-10, 13, 14, 100-" 
                        className="w-full border-2 border-orange-100 dark:border-gray-800 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-brand-500 bg-white dark:bg-gray-950 text-gray-800 dark:text-white transition-all shadow-inner"
                        value={deleteRange}
                        onChange={handleRangeChange}
                    />
                    <HelpCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-brand-500 transition-colors" />
                </div>
            </div>

            <button 
                onClick={handleApply}
                disabled={processing || pages.filter(p => !p.deleted).length === 0}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-black py-4 px-12 rounded-2xl shadow-xl shadow-brand-100 dark:shadow-brand-900/20 transition-all flex items-center justify-center min-w-[240px] text-lg active:scale-95"
            >
                Apply changes
            </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePages;
