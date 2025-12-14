import React, { useState, useRef, useEffect } from 'react';
import { FileUp, Download, HelpCircle, Loader2, ZoomIn, ZoomOut, RotateCcw, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import ProcessingOverlay from '../ProcessingOverlay';

// Safely handle pdfjs-dist import which might be a default export in some CDN environments
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Define the worker src for pdfjs
if (pdfjs && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

interface PageThumbnail {
  index: number; // 0-based index
  imageSrc: string;
  selected: boolean;
}

const ExtractPages: React.FC = () => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageThumbnail[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scale, setScale] = useState(1);
  const [selectionRange, setSelectionRange] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
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

      const limit = Math.min(numPages, 50); 
      
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
            selected: true 
          });
        }
      }
      setPages(newPages);
    } catch (error: any) {
      console.error("Error loading PDF", error);
      let msg = "Error loading PDF. Please try another file.";
      if (error?.name === 'MissingPDFException') {
        msg = "The PDF file is missing or invalid.";
      } else if (error?.name === 'PasswordException') {
        msg = "This file is password protected. Please unlock it first.";
      } else if (error?.message?.includes('worker')) {
        msg = "PDF Worker failed to load. Please check your connection or reload the page.";
      }
      alert(msg);
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const togglePageSelection = (index: number) => {
    setPages(prev => prev.map(p => 
      p.index === index ? { ...p, selected: !p.selected } : p
    ));
  };

  const selectOdd = () => {
    setPages(prev => prev.map(p => ({ ...p, selected: (p.index + 1) % 2 !== 0 })));
  };

  const selectEven = () => {
    setPages(prev => prev.map(p => ({ ...p, selected: (p.index + 1) % 2 === 0 })));
  };

  const resetSelection = () => {
    setPages(prev => prev.map(p => ({ ...p, selected: false })));
  };
  
  // Parse range string (e.g., "1-3, 5, 8-10") and select those pages
  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSelectionRange(val);

    // Debounce or just parse immediately for responsiveness
    if (!val.trim()) return;

    const parts = val.split(',');
    const newSelection = new Set<number>();

    parts.forEach(part => {
        const range = part.trim().split('-').map(Number);
        if (range.length === 1 && !isNaN(range[0])) {
            newSelection.add(range[0] - 1); // 0-based
        } else if (range.length === 2 && !isNaN(range[0]) && !isNaN(range[1])) {
            const start = Math.min(range[0], range[1]);
            const end = Math.max(range[0], range[1]);
            for (let i = start; i <= end; i++) {
                newSelection.add(i - 1);
            }
        }
    });

    setPages(prev => prev.map(p => ({
        ...p,
        selected: newSelection.has(p.index)
    })));
  };

  const handleExtract = async () => {
    if (!file) return;
    const selectedIndices = pages.filter(p => p.selected).map(p => p.index);
    if (selectedIndices.length === 0) {
      alert("Please select at least one page.");
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
      // Fix: Support owner-locked files by passing empty password
      const pdfDoc = await PDFDocument.load(arrayBuffer, { password: '' } as any);
      const newPdf = await PDFDocument.create();
      
      const copiedPages = await newPdf.copyPages(pdfDoc, selectedIndices);
      copiedPages.forEach(page => newPdf.addPage(page));
      
      const pdfBytes = await newPdf.save();
      
      clearInterval(progressInterval);
      setProgress(100);

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `extracted_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error extracting pages", error);
      if (error.message && (error.message.includes('encrypted') || error.message.includes('password'))) {
          alert("This file is password protected. Please unlock it first.");
      } else {
          alert("Failed to extract pages.");
      }
    } finally {
      setProcessing(false);
    }
  };

  // Upload Screen
  if (!file) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 py-20 px-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">Extract pages from PDF online</h1>
        <p className="text-gray-500 text-lg mb-10 text-center">Get a new document containing only the desired pages</p>
        
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
            <h3 className="font-bold text-gray-700 mb-2">How to extract pages from PDF</h3>
            <p className="text-sm text-gray-500">
                Below we show how to extract pages from a PDF document online, for free. Upload your files. Files are safely uploaded over an encrypted connection. Files stay secure. After processing, they are permanently deleted.
            </p>
        </div>
      </div>
    );
  }

  // Selection Screen
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {processing && <ProcessingOverlay status="Extracting pages..." progress={progress} />}
      
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 py-4 px-6 flex flex-col md:flex-row items-center justify-between sticky top-[60px] z-30 shadow-sm gap-4 md:gap-0">
        <div className="text-center md:text-left mb-4 md:mb-0">
          <h2 className="text-xl font-bold text-gray-800">Extract pages from PDF online</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500 justify-center md:justify-start">
             <span>Selected: {file.name}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Sejda uses a link style for reset */}
          <button onClick={resetSelection} className="text-brand-500 text-sm hover:underline">Reset selection</button>
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
                      onClick={() => togglePageSelection(page.index)}
                      className={`relative cursor-pointer transition-all duration-200 group flex flex-col items-center`}
                      style={{ width: `${150 * scale}px` }}
                    >
                        <div 
                          className={`
                            bg-white shadow-sm border-[3px] p-2 transition-all w-full
                            ${page.selected 
                                ? 'border-brand-500 shadow-md scale-105' 
                                : 'border-transparent hover:border-gray-300 opacity-60 grayscale-[0.3]'
                            }
                          `}
                        >
                            <img src={page.imageSrc} alt={`Page ${page.index + 1}`} className="w-full h-auto pointer-events-none select-none" />
                        </div>
                        <div className="text-center mt-2 text-xs font-medium text-gray-500">{page.index + 1}</div>
                        
                        {page.selected && (
                            <div className="absolute top-[-8px] right-[-8px] bg-brand-500 text-white rounded-full p-1 shadow-sm z-10">
                                <Check className="w-3 h-3" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-[#fff9e6] border-t border-orange-100 p-4 sticky bottom-0 z-40">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
                <span className="font-bold text-gray-700 text-sm">Selected pages:</span>
                <div className="flex gap-2 flex-wrap justify-center">
                    <button onClick={selectOdd} className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 text-gray-600">All Odd Pages <HelpCircle className="w-3 h-3 inline ml-1 text-gray-400"/></button>
                    <button onClick={selectEven} className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 text-gray-600">All Even Pages <HelpCircle className="w-3 h-3 inline ml-1 text-gray-400"/></button>
                    <button className="px-3 py-1.5 bg-brand-50 border border-brand-200 text-brand-700 rounded text-sm font-medium">Specific pages</button>
                </div>
            </div>

            <div className="flex-1 w-full md:w-auto md:max-w-xs mx-4">
                <input 
                    type="text" 
                    placeholder="Example: 1-4, 8-10, 15" 
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    value={selectionRange}
                    onChange={handleRangeChange}
                />
            </div>

            <div className="flex items-center gap-2 flex-col">
                 <button 
                   onClick={handleExtract}
                   disabled={processing || pages.filter(p => p.selected).length === 0}
                   className="bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-md shadow-sm transition-colors flex items-center min-w-[160px] justify-center"
                 >
                    Extract pages
                 </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ExtractPages;