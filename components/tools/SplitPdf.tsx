
import React, { useState, useRef } from 'react';
import { FileUp, ChevronDown, Check, Loader2, Download, RefreshCw, Scissors, ZoomIn, ZoomOut, Search, ScanLine } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import Tesseract from 'tesseract.js';
import { useLanguage } from '../../contexts/LanguageContext';
import ProcessingOverlay from '../ProcessingOverlay';

// Safely handle pdfjs-dist import
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

if (pdfjs && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

interface PageThumbnail {
  index: number;
  imageSrc: string;
}

const SplitPdf: React.FC = () => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'options' | 'success'>('upload');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pages, setPages] = useState<PageThumbnail[]>([]);
  const [splitPoints, setSplitPoints] = useState<Set<number>>(new Set());
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  
  // OCR / Text Search State
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setStep('options');
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

      // Limit preview for performance
      const limit = Math.min(numPages, 50); 
      
      for (let i = 1; i <= limit; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.25 });
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
          });
        }
      }
      setPages(newPages);
    } catch (error: any) {
      console.error("Error loading PDF", error);
      if (error?.name === 'PasswordException') {
          alert("This file is password protected. Please unlock it first.");
      } else {
          alert("Error loading PDF");
      }
      setFile(null);
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  const toggleSplit = (index: number) => {
      if (index === pages.length - 1) return;

      setSplitPoints(prev => {
          const next = new Set(prev);
          if (next.has(index)) {
              next.delete(index);
          } else {
              next.add(index);
          }
          return next;
      });
  };

  const handleAutoSplit = async () => {
      if (!file || !searchText.trim()) return;
      setOcrProcessing(true);
      setOcrProgress(0);
      
      try {
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          const newSplitPoints = new Set<number>();
          
          for (let i = 1; i <= pdf.numPages; i++) {
              setOcrProgress(Math.round((i / pdf.numPages) * 100));
              const page = await pdf.getPage(i);
              
              const textContent = await page.getTextContent();
              let text = textContent.items.map((item: any) => 'str' in item ? item.str : '').join(' ');
              
              if (text.length < 20) {
                  const viewport = page.getViewport({ scale: 1.5 });
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                      canvas.width = viewport.width;
                      canvas.height = viewport.height;
                      await page.render({ canvasContext: ctx, viewport }).promise;
                      
                      const ocrResult = await Tesseract.recognize(
                          canvas.toDataURL(),
                          'eng',
                          { logger: () => {} }
                      );
                      text = ocrResult.data.text;
                  }
              }
              
              if (text.toLowerCase().includes(searchText.toLowerCase())) {
                  if (i > 1) {
                      newSplitPoints.add(i - 2);
                  }
              }
          }
          
          setSplitPoints(newSplitPoints);
          if (newSplitPoints.size === 0) {
              alert(`No matches found for "${searchText}". Try a different keyword.`);
          } else {
              alert(`Found ${newSplitPoints.size} split points.`);
          }
      } catch (e) {
          console.error(e);
          alert("Error analyzing PDF text.");
      } finally {
          setOcrProcessing(false);
          setShowSearch(false);
      }
  };

  const handleSplit = async () => {
    if (!file) return;
    if (splitPoints.size === 0) {
        alert("Please select at least one split point.");
        return;
    }
    
    setProcessing(true);
    setProgress(0);

    try {
        const arrayBuffer = await file.arrayBuffer();
        // Fix: Support owner-locked files by passing empty password
        const srcDoc = await PDFDocument.load(arrayBuffer, { password: '' } as any);
        const totalPages = srcDoc.getPageCount();
        
        const zip = new JSZip();
        
        const sortedSplits: number[] = (Array.from(splitPoints) as number[]).sort((a: number, b: number) => a - b);
        
        let startIndex = 0;
        
        for (let i = 0; i <= sortedSplits.length; i++) {
            const endIndex: number = i < sortedSplits.length ? sortedSplits[i] : totalPages - 1;
            
            const newPdf = await PDFDocument.create();
            const rangeIndices = [];
            for(let j = startIndex; j <= endIndex; j++) rangeIndices.push(j);
            
            const copiedPages = await newPdf.copyPages(srcDoc, rangeIndices);
            copiedPages.forEach(p => newPdf.addPage(p));
            
            const pdfBytes = await newPdf.save();
            const partNum = i + 1;
            zip.file(`${file.name.replace('.pdf', '')}_part_${partNum}.pdf`, pdfBytes);
            
            startIndex = endIndex + 1;
            
            // Update progress
            setProgress(Math.round(((i + 1) / (sortedSplits.length + 1)) * 100));
        }

        const zipContent = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipContent);
        setResultUrl(url);
        setStep('success');

    } catch (e: any) {
        console.error(e);
        if (e.message && (e.message.includes('encrypted') || e.message.includes('password'))) {
            alert("This file is password protected. Please unlock it first.");
        } else {
            alert("Failed to split PDF");
        }
    } finally {
        setProcessing(false);
    }
  };

  const reset = () => {
      setFile(null);
      setPages([]);
      setSplitPoints(new Set());
      setStep('upload');
      setResultUrl(null);
      setSearchText('');
      setProgress(0);
  };

  if (step === 'upload') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 py-20 px-4 font-sans transition-colors duration-300">
        <h1 className="text-4xl font-black text-gray-800 dark:text-gray-100 mb-2 text-center tracking-tight leading-tight">Split PDF</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 text-center font-medium max-w-xl">Split specific page ranges or extract every page into a separate document</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-7 rounded-2xl shadow-xl shadow-brand-200 dark:shadow-brand-900/20 transition-all flex items-center justify-center gap-3 text-2xl group transform hover:-translate-y-1"
           >
             <FileUp className="w-9 h-9 group-hover:-translate-y-1 transition-transform" />
             Upload PDF file
           </button>
           <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
           <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4 uppercase tracking-widest font-bold">
             Or drag and drop file here
           </p>
        </div>

        <div className="mt-20 max-w-2xl text-center">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">How to split a PDF file</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                Upload your file. Click on the scissors icon between pages to mark where you want to split the document. Click 'Split PDF' to download a ZIP file with all parts.
            </p>
        </div>
      </div>
    );
  }

  if (step === 'success' && resultUrl) {
    return (
      <div className="min-h-[80vh] bg-gray-50 dark:bg-gray-950 flex flex-col items-center pt-12 px-4 font-sans transition-colors duration-300">
        <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-8 tracking-tight">Your document is ready</h2>
        <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 max-w-2xl w-full text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-8 animate-in zoom-in duration-700">
                <Check className="w-12 h-12" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg font-medium">PDF split successfully.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={resultUrl} download={`split_${file?.name.replace('.pdf', '')}.zip`} className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-brand-100 dark:shadow-brand-900/20 flex items-center justify-center gap-3 text-lg transition-all transform hover:-translate-y-1">
                    <Download className="w-6 h-6" /> Download Zip
                </a>
                <button onClick={reset} className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold py-4 px-8 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5" /> Start Over
                </button>
            </div>
        </div>
      </div>
    );
  }

  // Options/Editor View
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col font-sans transition-colors duration-300">
        {processing && <ProcessingOverlay status="Splitting PDF parts..." progress={progress} />}
        {ocrProcessing && <ProcessingOverlay status={`Analyzing text for splits... ${ocrProgress}%`} progress={ocrProgress} />}
        
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 px-6 flex flex-col md:flex-row items-center justify-between sticky top-[60px] z-30 shadow-sm gap-4 md:gap-0">
            <div className="text-center md:text-left">
                <h2 className="text-xl font-black text-gray-800 dark:text-gray-100 tracking-tight">Split PDF by pages</h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">Selected: {file?.name}</div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowSearch(!showSearch)} 
                        className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${showSearch ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                        <ScanLine className="w-4 h-4" /> Split by Text
                    </button>
                    <button onClick={() => setSplitPoints(new Set())} className="text-brand-500 dark:text-brand-400 text-sm font-bold hover:underline">Reset</button>
                </div>
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
                    <button onClick={() => setScale(Math.max(0.5, scale - 0.1))} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"><ZoomOut className="w-4 h-4 text-gray-600 dark:text-gray-400" /></button>
                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 w-10 text-center uppercase">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(Math.min(2, scale + 0.1))} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"><ZoomIn className="w-4 h-4 text-gray-600 dark:text-gray-400" /></button>
                </div>
            </div>
        </div>

        {/* Text Split UI */}
        {showSearch && (
            <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 animate-in slide-in-from-top-2">
                <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-3">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">Split BEFORE pages containing:</span>
                    <div className="relative flex-1 w-full group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 group-focus-within:text-brand-500 transition-colors" />
                        <input 
                            type="text" 
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="Enter keyword (e.g., 'Chapter', 'Invoice')"
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-950 border-2 border-transparent focus:border-brand-500 rounded-2xl text-sm font-bold text-gray-800 dark:text-white outline-none transition-all shadow-inner"
                        />
                    </div>
                    <button 
                        onClick={handleAutoSplit}
                        disabled={ocrProcessing || !searchText.trim()}
                        className="bg-brand-500 hover:bg-brand-600 text-white font-black px-6 py-3 rounded-2xl text-sm transition-all shadow-lg shadow-brand-100 dark:shadow-brand-900/20 disabled:opacity-50 flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                        {ocrProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Find Splits
                    </button>
                </div>
            </div>
        )}

        {/* Workspace */}
        <div className="flex-1 overflow-y-auto p-8">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 mt-20">
                    <Loader2 className="w-16 h-16 text-brand-500 animate-spin mb-6" />
                    <p className="text-gray-500 dark:text-gray-400 font-bold tracking-tight">Generating document preview...</p>
                </div>
            ) : (
                <div className="flex flex-wrap justify-center gap-y-10 gap-x-2 pb-32">
                    {pages.map((page) => {
                        const isSplit = splitPoints.has(page.index);
                        return (
                            <div key={page.index} className="flex items-center">
                                {/* Page Card */}
                                <div className="flex flex-col items-center group/page" style={{ width: `${140 * scale}px` }}>
                                    <div className={`bg-white dark:bg-gray-900 p-2 shadow-lg transition-all rounded-sm ring-2 ${isSplit ? 'ring-brand-500 shadow-brand-500/10' : 'ring-transparent hover:ring-brand-200'}`}>
                                        <img src={page.imageSrc} alt={`Page ${page.index + 1}`} className="w-full h-auto pointer-events-none select-none" />
                                    </div>
                                    <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 group-hover/page:text-brand-500 transition-colors">Page {page.index + 1}</div>
                                </div>

                                {/* Split Point (Scissor) */}
                                {page.index < pages.length - 1 && (
                                    <div className="relative mx-2 flex flex-col items-center justify-center h-full group/split">
                                         <button 
                                            onClick={() => toggleSplit(page.index)}
                                            className={`
                                                w-9 h-9 rounded-full flex items-center justify-center transition-all z-10 border-2
                                                ${isSplit 
                                                    ? 'bg-brand-500 text-white border-brand-500 shadow-[0_5px_15px_rgba(147,51,234,0.4)] scale-110' 
                                                    : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-100 dark:border-gray-700 hover:text-brand-500 hover:border-brand-500 hover:scale-105'
                                                }
                                            `}
                                            title="Click to split here"
                                         >
                                             <Scissors className="w-4 h-4" />
                                         </button>
                                         
                                         {/* Visual Divider Line */}
                                         <div className={`absolute top-0 bottom-0 w-0.5 border-l-2 border-dashed h-[150%] -z-0 transition-all ${isSplit ? 'border-brand-500 opacity-100' : 'border-gray-300 dark:border-gray-700 opacity-0 group-hover/split:opacity-50'}`}></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Bottom Bar */}
        <div className="bg-[#fff9e6] dark:bg-gray-900 border-t border-orange-100 dark:border-gray-800 p-5 sticky bottom-0 z-40 shadow-[0_-10px_50px_rgba(0,0,0,0.05)] transition-colors">
             <div className="max-w-md mx-auto">
                 <button 
                     onClick={handleSplit}
                     disabled={processing || splitPoints.size === 0}
                     className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-black py-4 rounded-2xl shadow-xl shadow-brand-100 dark:shadow-black/20 flex items-center justify-center gap-3 text-xl transition-all transform hover:-translate-y-1 active:translate-y-0"
                 >
                     {processing ? <Loader2 className="w-7 h-7 animate-spin" /> : <Scissors className="w-7 h-7" />}
                     Split PDF ({splitPoints.size + 1} parts)
                 </button>
             </div>
        </div>
    </div>
  );
};

export default SplitPdf;
