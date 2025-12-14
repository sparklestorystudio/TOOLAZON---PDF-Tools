import React, { useState, useRef } from 'react';
import { FileUp, ChevronDown, Check, Loader2, ZoomIn, ZoomOut, Trash2, HelpCircle, Download, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

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

      const limit = Math.min(numPages, 50); // Limit for demo performance
      
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
    // Indices to KEEP are those NOT deleted
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
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(90, prev + 10));
      }, 300);

      const arrayBuffer = await file.arrayBuffer();
      // Fix: Support owner-locked files
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

  // 1. Upload Screen
  if (!file) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 py-20 px-4 font-sans">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">Delete PDF Pages</h1>
        <p className="text-gray-500 text-lg mb-10 text-center">Remove pages from a PDF document</p>
        
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
            <h3 className="font-bold text-gray-700 mb-2">How to delete pages from PDF</h3>
            <p className="text-sm text-gray-500">
                Click on the pages you want to remove. Click 'Apply changes' to download your new PDF.
            </p>
        </div>
      </div>
    );
  }

  // 3. Success/Download Screen
  if (resultUrl) {
    return (
      <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center pt-12 px-4 font-sans">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Your document is ready</h2>
        
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-2xl w-full text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8" />
            </div>
            
            <p className="text-gray-500 mb-8">
                Pages deleted successfully.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                    href={resultUrl} 
                    download={`deleted_pages_${file.name}`}
                    className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-md shadow-md flex items-center justify-center gap-2 transition-colors"
                >
                    <Download className="w-5 h-5" />
                    Download
                </a>
                <button 
                    onClick={handleStartOver}
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

  // 2. Editor Screen
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 py-4 px-6 flex flex-col md:flex-row items-center justify-between sticky top-[60px] z-30 shadow-sm gap-4 md:gap-0">
        <div className="text-center md:text-left mb-4 md:mb-0">
          <h2 className="text-xl font-bold text-gray-800">Delete PDF Pages</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500 justify-center md:justify-start">
             <span>Selected: {file.name}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={resetSelection} className="text-brand-500 text-sm hover:underline">Reset</button>
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
             <button onClick={() => setScale(Math.max(0.5, scale - 0.1))} className="p-1 hover:bg-gray-200 rounded"><ZoomOut className="w-4 h-4 text-gray-600" /></button>
             <span className="text-xs text-gray-500 w-8 text-center">{Math.round(scale * 100)}%</span>
             <button onClick={() => setScale(Math.min(2, scale + 0.1))} className="p-1 hover:bg-gray-200 rounded"><ZoomIn className="w-4 h-4 text-gray-600" /></button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
        {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
                <p className="text-gray-500">Processing PDF pages...</p>
            </div>
        ) : (
            <div className="flex flex-wrap justify-center gap-6">
                {pages.map((page) => (
                    <div 
                      key={page.index}
                      onClick={() => togglePageDeletion(page.index)}
                      className="relative cursor-pointer transition-all duration-200 group flex flex-col items-center"
                      style={{ width: `${150 * scale}px` }}
                    >
                        <div className="relative w-full shadow-sm bg-white">
                           {/* Page Image */}
                           <img 
                             src={page.imageSrc} 
                             alt={`Page ${page.index + 1}`} 
                             className={`w-full h-auto pointer-events-none select-none ${page.deleted ? 'opacity-50' : ''}`} 
                           />

                           {/* Hover "Delete" Overlay (only if not deleted) */}
                           {!page.deleted && (
                               <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center border-2 border-transparent group-hover:border-red-100">
                                   <Trash2 className="w-8 h-8 text-red-500 mb-1" />
                                   <span className="text-red-500 font-medium text-sm">Delete</span>
                               </div>
                           )}

                           {/* "Deleted" State Overlay */}
                           {page.deleted && (
                               <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center border border-gray-200">
                                   <Trash2 className="w-8 h-8 text-gray-300 mb-1" />
                                   <span className="text-gray-300 font-medium text-sm">Deleted</span>
                               </div>
                           )}
                        </div>
                        
                        <div className="text-center mt-2 text-xs font-medium text-gray-500">{page.index + 1}</div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-[#fff9e6] border-t border-orange-100 p-4 sticky bottom-0 z-40">
        <div className="max-w-[900px] mx-auto flex flex-col items-center text-center gap-3">
            <span className="font-bold text-gray-800 text-sm">Deleting many pages? Type an interval here:</span>
            
            <div className="flex items-center gap-2 w-full max-w-xl">
                 <div className="relative flex-1">
                    <input 
                        type="text" 
                        placeholder="Examples: 1-10,13,14,100-" 
                        className="w-full border border-gray-300 rounded px-3 py-3 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                        value={deleteRange}
                        onChange={handleRangeChange}
                    />
                    <HelpCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 </div>
            </div>

            {processing && (
                <div className="w-full max-w-[200px] mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Processing...</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-brand-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            )}

            <button 
                onClick={handleApply}
                disabled={processing}
                className="bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white font-bold py-3 px-8 rounded-md shadow-sm transition-colors flex items-center justify-center min-w-[160px] mt-2"
            >
                {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Apply changes
            </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePages;