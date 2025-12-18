
import React, { useState, useRef } from 'react';
import { FileUp, ChevronDown, Check, Loader2, Download, RefreshCw, Trash2, RotateCw, Plus, GripVertical, ArrowLeft, Layout } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, degrees } from 'pdf-lib';
import { useLanguage } from '../../contexts/LanguageContext';
import ProcessingOverlay from '../ProcessingOverlay';

// Safely handle pdfjs-dist import
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

if (pdfjs && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

interface PageItem {
  id: string;
  originalIndex: number; // -1 for blank pages
  imageSrc: string; // Data URL for preview
  rotation: number; // Current visual rotation (0, 90, 180, 270)
}

const OrganizePdf: React.FC = () => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'editor' | 'success'>('upload');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  
  // Drag and Drop State
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  
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
    setStep('editor');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const newPages: PageItem[] = [];

      // Limit for performance
      const limit = Math.min(numPages, 100); 
      
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
            id: `p-${i}-${Math.random()}`,
            originalIndex: i - 1, // 0-based
            imageSrc: canvas.toDataURL(),
            rotation: 0
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

  const rotatePage = (index: number) => {
      const newPages = [...pages];
      newPages[index].rotation = (newPages[index].rotation + 90) % 360;
      setPages(newPages);
  };

  const deletePage = (index: number) => {
      const newPages = [...pages];
      newPages.splice(index, 1);
      setPages(newPages);
  };

  const insertBlankPage = (index: number) => {
      const canvas = document.createElement('canvas');
      canvas.width = 150;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, 150, 200);
          ctx.strokeStyle = '#eee';
          ctx.strokeRect(0, 0, 150, 200);
          
          const newPage: PageItem = {
              id: `blank-${Math.random()}`,
              originalIndex: -1,
              imageSrc: canvas.toDataURL(),
              rotation: 0
          };
          
          const newPages = [...pages];
          newPages.splice(index, 0, newPage);
          setPages(newPages);
      }
  };

  const onDragStart = (e: React.DragEvent, index: number) => {
      setDraggedItemIndex(index);
      e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (draggedItemIndex === null || draggedItemIndex === dropIndex) return;

      const newPages = [...pages];
      const [draggedItem] = newPages.splice(draggedItemIndex, 1);
      newPages.splice(dropIndex, 0, draggedItem);
      
      setPages(newPages);
      setDraggedItemIndex(null);
  };

  const handleSave = async () => {
      if (!file) return;
      if (pages.length === 0) {
          alert("The document is empty.");
          return;
      }

      setProcessing(true);
      setProgress(0);
      try {
          const arrayBuffer = await file.arrayBuffer();
          const srcDoc = await PDFDocument.load(arrayBuffer, { password: '' } as any);
          const newDoc = await PDFDocument.create();

          for (let i = 0; i < pages.length; i++) {
              const pageItem = pages[i];
              let page;
              if (pageItem.originalIndex === -1) {
                  page = newDoc.addPage([595, 842]);
              } else {
                  const [copiedPage] = await newDoc.copyPages(srcDoc, [pageItem.originalIndex]);
                  page = newDoc.addPage(copiedPage);
              }
              
              const currentRotation = page.getRotation().angle;
              page.setRotation(degrees(currentRotation + pageItem.rotation));
              setProgress(Math.round(((i + 1) / pages.length) * 100));
          }

          const pdfBytes = await newDoc.save();
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setResultUrl(url);
          setStep('success');

      } catch (e: any) {
          console.error(e);
          alert("Error saving PDF: " + e.message);
      } finally {
          setProcessing(false);
      }
  };

  const reset = () => {
      setFile(null);
      setPages([]);
      setStep('upload');
      setResultUrl(null);
      setProgress(0);
  };

  if (step === 'upload') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 py-20 px-4 font-sans transition-colors">
        <h1 className="text-4xl font-black text-gray-800 dark:text-white mb-2 text-center tracking-tight">Organize PDF</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 text-center font-medium max-w-xl">Sort, add, delete and rotate PDF pages with ease.</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-7 rounded-2xl shadow-xl shadow-brand-200 dark:shadow-brand-900/20 transition-all flex items-center justify-center gap-4 text-2xl group transform hover:-translate-y-1"
           >
             <Layout className="w-9 h-9 group-hover:-translate-y-1 transition-transform" />
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
        <h2 className="text-4xl font-black text-gray-800 dark:text-white mb-8 tracking-tighter">PDF Organized!</h2>
        <div className="bg-white dark:bg-gray-900 p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 max-w-2xl w-full text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
                <Check className="w-12 h-12" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-12 font-medium">Your customized document structure is ready for download.</p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <a href={resultUrl} download={`organized_${file?.name}`} className="bg-brand-500 hover:bg-brand-600 text-white font-black py-5 px-12 rounded-2xl shadow-xl shadow-brand-100 dark:shadow-brand-900/20 flex items-center justify-center gap-3 text-xl transition-all transform hover:-translate-y-1 active:scale-95 active:translate-y-0">
                    <Download className="w-6 h-6" /> Download PDF
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
        {processing && <ProcessingOverlay status="Building new PDF..." progress={progress} />}
        
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 px-6 flex flex-col sm:flex-row items-center justify-between sticky top-[70px] z-30 shadow-sm gap-4 transition-colors">
            <div className="flex items-center gap-4">
                <button onClick={reset} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><ArrowLeft className="w-5 h-5"/></button>
                <div>
                    <h2 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">Organize Pages</h2>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px] md:max-w-xs">{file?.name}</div>
                </div>
            </div>
            <div className="flex gap-3">
                <button onClick={() => insertBlankPage(pages.length)} className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-gray-200 dark:border-gray-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Blank Page
                </button>
                <button 
                    onClick={handleSave}
                    disabled={processing}
                    className="bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-black py-2.5 px-8 rounded-xl shadow-lg shadow-brand-100 dark:shadow-brand-900/20 flex items-center justify-center transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-xs uppercase tracking-widest"
                >
                    Apply changes
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 mt-20">
                    <Loader2 className="w-16 h-16 text-brand-500 animate-spin mb-6" />
                    <p className="text-gray-500 dark:text-gray-400 font-bold tracking-tight">Rendering document layout...</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8 max-w-7xl mx-auto pb-32">
                    {pages.map((page, index) => (
                        <div 
                            key={page.id}
                            draggable
                            onDragStart={(e) => onDragStart(e, index)}
                            onDragOver={(e) => onDragOver(e, index)}
                            onDrop={(e) => onDrop(e, index)}
                            className={`
                                relative group bg-white dark:bg-gray-900 p-3 rounded-2xl shadow-md border-2 cursor-grab active:cursor-grabbing transition-all
                                ${draggedItemIndex === index ? 'opacity-30 border-brand-500 scale-95' : 'border-transparent hover:border-brand-200 dark:hover:border-brand-900 hover:shadow-xl'}
                            `}
                        >
                            <div className="relative aspect-[3/4] bg-gray-50 dark:bg-gray-800 mb-3 overflow-hidden rounded-xl flex items-center justify-center border border-gray-100 dark:border-gray-700">
                                <img 
                                    src={page.imageSrc} 
                                    alt={`Page ${index + 1}`} 
                                    className="max-w-full max-h-full object-contain pointer-events-none select-none transition-transform duration-300"
                                    style={{ transform: `rotate(${page.rotation}deg)` }}
                                />
                                {page.originalIndex === -1 && <span className="absolute text-gray-300 dark:text-gray-600 text-[10px] font-black tracking-widest uppercase">Blank Page</span>}
                                
                                <div className="absolute inset-0 bg-black/5 dark:bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <GripVertical className="text-white w-10 h-10 drop-shadow-lg" />
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">#{index + 1}</span>
                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => rotatePage(index)} className="p-2 text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors" title="Rotate 90°">
                                        <RotateCw className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => deletePage(index)} className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Remove Page">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {/* Add Page Button at End */}
                    <button 
                        onClick={() => insertBlankPage(pages.length)}
                        className="aspect-[3/4] border-4 border-dashed border-gray-200 dark:border-gray-800 rounded-[2rem] flex flex-col items-center justify-center text-gray-300 dark:text-gray-700 hover:border-brand-500 hover:text-brand-500 hover:bg-white dark:hover:bg-gray-900 transition-all group"
                    >
                        <Plus className="w-12 h-12 mb-3 group-hover:scale-110 group-hover:rotate-90 transition-transform duration-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Add Page</span>
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

export default OrganizePdf;
