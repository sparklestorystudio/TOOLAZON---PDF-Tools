import React, { useState, useRef } from 'react';
import { FileUp, ChevronDown, Check, Loader2, Download, RefreshCw, Scissors, ZoomIn, ZoomOut, Search, ScanLine } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import Tesseract from 'tesseract.js';
import { useLanguage } from '../../contexts/LanguageContext';

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
    } catch (error) {
      console.error("Error loading PDF", error);
      alert("Error loading PDF");
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
        const srcDoc = await PDFDocument.load(arrayBuffer);
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

    } catch (e) {
        console.error(e);
        alert("Failed to split PDF");
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 py-20 px-4 font-sans">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">Split PDF</h1>
        <p className="text-gray-500 text-lg mb-10 text-center">Split specific page ranges or extract every page into a separate document</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-3 text-xl group"
           >
             <FileUp className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />
             Upload PDF file
             <ChevronDown className="w-5 h-5 ml-2" />
           </button>
           <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
           <p className="text-xs text-center text-gray-400 mt-4">
             Or drag and drop file here
           </p>
        </div>

        <div className="mt-16 max-w-2xl text-center">
            <h3 className="font-bold text-gray-700 mb-2">How to split a PDF file</h3>
            <p className="text-sm text-gray-500">
                Upload your file. Click on the scissors icon between pages to mark where you want to split the document. Click 'Split PDF' to download a ZIP file with all parts.
            </p>
        </div>
      </div>
    );
  }

  if (step === 'success' && resultUrl) {
    return (
      <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center pt-12 px-4 font-sans">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Your document is ready</h2>
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-2xl w-full text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8" />
            </div>
            <p className="text-gray-500 mb-8">PDF split successfully.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={resultUrl} download={`split_${file?.name.replace('.pdf', '')}.zip`} className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-md shadow-md flex items-center justify-center gap-2 transition-colors">
                    <Download className="w-5 h-5" /> Download Zip
                </a>
                <button onClick={reset} className="bg-white border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors">
                    <RefreshCw className="w-4 h-4" /> Start Over
                </button>
            </div>
        </div>
      </div>
    );
  }

  // Options/Editor View
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 py-4 px-6 flex flex-col md:flex-row items-center justify-between sticky top-[60px] z-30 shadow-sm gap-4 md:gap-0">
            <div className="text-center md:text-left">
                <h2 className="text-xl font-bold text-gray-800">Split PDF by pages</h2>
                <div className="text-sm text-gray-500">Selected: {file?.name}</div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowSearch(!showSearch)} 
                        className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded transition-colors ${showSearch ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <ScanLine className="w-4 h-4" /> Split by Text
                    </button>
                    <button onClick={() => setSplitPoints(new Set())} className="text-brand-500 text-sm hover:underline">Reset</button>
                </div>
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button onClick={() => setScale(Math.max(0.5, scale - 0.1))} className="p-1 hover:bg-gray-200 rounded"><ZoomOut className="w-4 h-4 text-gray-600" /></button>
                    <span className="text-xs text-gray-500 w-8 text-center">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(Math.min(2, scale + 0.1))} className="p-1 hover:bg-gray-200 rounded"><ZoomIn className="w-4 h-4 text-gray-600" /></button>
                </div>
            </div>
        </div>

        {/* Text Split UI */}
        {showSearch && (
            <div className="bg-gray-50 border-b border-gray-200 p-4 animate-in slide-in-from-top-2">
                <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Split BEFORE pages containing:</span>
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="Enter text keyword (e.g., 'Chapter', 'Invoice #')"
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                        />
                    </div>
                    <button 
                        onClick={handleAutoSplit}
                        disabled={ocrProcessing || !searchText.trim()}
                        className="bg-brand-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-600 disabled:opacity-50 flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                        {ocrProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {ocrProcessing ? `Scanning... ${ocrProgress}%` : 'Find Splits'}
                    </button>
                </div>
                <div className="max-w-2xl mx-auto mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <ScanLine className="w-3 h-3" />
                    <span>Includes OCR for scanned documents</span>
                </div>
            </div>
        )}

        {/* Workspace */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
                    <p className="text-gray-500">Loading pages...</p>
                </div>
            ) : (
                <div className="flex flex-wrap justify-center gap-y-8 gap-x-2">
                    {pages.map((page) => {
                        const isSplit = splitPoints.has(page.index);
                        return (
                            <div key={page.index} className="flex items-center">
                                {/* Page Card */}
                                <div className="flex flex-col items-center" style={{ width: `${140 * scale}px` }}>
                                    <div className="bg-white p-2 shadow-sm border border-gray-200">
                                        <img src={page.imageSrc} alt={`Page ${page.index + 1}`} className="w-full h-auto pointer-events-none select-none" />
                                    </div>
                                    <div className="mt-2 text-xs font-medium text-gray-500">Page {page.index + 1}</div>
                                </div>

                                {/* Split Point (Scissor) */}
                                {page.index < pages.length - 1 && (
                                    <div className="relative mx-1 flex flex-col items-center justify-center h-full group">
                                         <button 
                                            onClick={() => toggleSplit(page.index)}
                                            className={`
                                                w-8 h-8 rounded-full flex items-center justify-center transition-all z-10
                                                ${isSplit ? 'bg-brand-500 text-white shadow-md scale-110' : 'bg-white text-gray-400 border border-gray-200 hover:text-brand-500 hover:border-brand-500'}
                                            `}
                                            title="Click to split here"
                                         >
                                             <Scissors className="w-4 h-4" />
                                         </button>
                                         
                                         {/* Visual Divider Line */}
                                         <div className={`absolute top-0 bottom-0 w-0.5 border-l-2 border-dashed h-[120%] -z-0 transition-colors ${isSplit ? 'border-brand-500 opacity-100' : 'border-gray-300 opacity-0 group-hover:opacity-50'}`}></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Bottom Bar */}
        <div className="bg-[#fff9e6] border-t border-orange-100 p-4 sticky bottom-0 z-40">
             <div className="max-w-md mx-auto">
                 {processing && (
                    <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Processing...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-brand-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                 )}
                 <button 
                     onClick={handleSplit}
                     disabled={processing || splitPoints.size === 0}
                     className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg shadow-md flex items-center justify-center text-lg transition-colors"
                 >
                     {processing ? (
                         <>
                             <Loader2 className="w-5 h-5 animate-spin mr-2" />
                             Processing...
                         </>
                     ) : (
                         `Split PDF (${splitPoints.size + 1} parts)`
                     )}
                 </button>
             </div>
        </div>
    </div>
  );
};

export default SplitPdf;