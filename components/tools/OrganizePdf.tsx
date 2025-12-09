import React, { useState, useRef } from 'react';
import { FileUp, ChevronDown, Check, Loader2, Download, RefreshCw, Trash2, RotateCw, Plus, GripVertical } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, degrees } from 'pdf-lib';
import { useLanguage } from '../../contexts/LanguageContext';

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
    } catch (error) {
      console.error("Error loading PDF", error);
      alert("Error loading PDF");
      setFile(null);
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---

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
      // Create a white placeholder image for the blank page
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
              originalIndex: -1, // Flag for blank
              imageSrc: canvas.toDataURL(),
              rotation: 0
          };
          
          const newPages = [...pages];
          newPages.splice(index, 0, newPage);
          setPages(newPages);
      }
  };

  // --- DRAG AND DROP ---

  const onDragStart = (e: React.DragEvent, index: number) => {
      setDraggedItemIndex(index);
      e.dataTransfer.effectAllowed = "move";
      // Transparent drag image or default
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault(); // Necessary to allow dropping
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
    try {
        const arrayBuffer = await file.arrayBuffer();
        const srcDoc = await PDFDocument.load(arrayBuffer);
        const newDoc = await PDFDocument.create();
        
        for (const pageItem of pages) {
            let pdfPage;
            
            if (pageItem.originalIndex === -1) {
                // Insert Blank Page (Letter size default)
                pdfPage = newDoc.addPage([612, 792]);
            } else {
                // Copy original page
                const [copiedPage] = await newDoc.copyPages(srcDoc, [pageItem.originalIndex]);
                pdfPage = newDoc.addPage(copiedPage);
            }
            
            // Apply new rotation on top of existing rotation
            const existingRotation = pdfPage.getRotation().angle;
            pdfPage.setRotation(degrees(existingRotation + pageItem.rotation));
        }

        const pdfBytes = await newDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
        setStep('success');

    } catch (e) {
        console.error(e);
        alert("Failed to organize PDF");
    } finally {
        setProcessing(false);
    }
  };

  const reset = () => {
      setFile(null);
      setPages([]);
      setStep('upload');
      setResultUrl(null);
  };

  if (step === 'upload') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 py-20 px-4 font-sans">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">Organize PDF</h1>
        <p className="text-gray-500 text-lg mb-10 text-center">Sort pages, delete pages, rotate pages and insert blank pages</p>
        
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
            <h3 className="font-bold text-gray-700 mb-2">How to organize PDF pages</h3>
            <p className="text-sm text-gray-500">
                Upload your file. Drag and drop thumbnails to reorder them. Use the buttons to rotate or delete pages. Click 'Organize' to save.
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
            <p className="text-gray-500 mb-8">PDF pages organized successfully.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={resultUrl} download={`organized_${file?.name}`} className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-md shadow-md flex items-center justify-center gap-2 transition-colors">
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 py-4 px-6 flex flex-col md:flex-row items-center justify-between sticky top-[60px] z-30 shadow-sm gap-4 md:gap-0">
            <div className="text-center md:text-left mb-4 md:mb-0">
                <h2 className="text-xl font-bold text-gray-800">Organize PDF pages</h2>
                <div className="text-sm text-gray-500">Selected: {file?.name}</div>
            </div>
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => insertPageAtEnd()}
                    className="flex items-center gap-1 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded transition-colors"
                >
                    <Plus className="w-4 h-4" /> Insert blank page at end
                </button>
                <button onClick={reset} className="text-gray-500 text-sm hover:text-gray-700">Start Over</button>
            </div>
        </div>

        {/* Grid Workspace */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
                    <p className="text-gray-500">Loading pages...</p>
                </div>
            ) : (
                <div className="flex flex-wrap justify-center gap-6">
                    {pages.map((page, index) => (
                        <div 
                            key={page.id}
                            className="relative group flex flex-col items-center"
                            draggable
                            onDragStart={(e) => onDragStart(e, index)}
                            onDragOver={(e) => onDragOver(e, index)}
                            onDrop={(e) => onDrop(e, index)}
                        >
                            {/* Insert Button (Before) */}
                            <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => insertBlankPage(index)}
                                    className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                                    title="Insert blank page here"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            <div 
                                className={`
                                    w-36 bg-white p-2 shadow-sm border border-gray-200 cursor-move transition-all
                                    ${draggedItemIndex === index ? 'opacity-50 scale-95 border-brand-300' : 'hover:shadow-md'}
                                `}
                            >
                                <div className="relative aspect-[3/4] flex items-center justify-center bg-gray-50 overflow-hidden">
                                    <img 
                                        src={page.imageSrc} 
                                        alt={`Page ${index + 1}`} 
                                        className="w-full h-full object-contain pointer-events-none select-none transition-transform duration-200"
                                        style={{ transform: `rotate(${page.rotation}deg)` }}
                                    />
                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-1 gap-1">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); rotatePage(index); }}
                                            className="p-1 bg-white rounded text-gray-600 hover:text-brand-600 shadow-sm"
                                            title="Rotate"
                                        >
                                            <RotateCw className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); deletePage(index); }}
                                            className="p-1 bg-white rounded text-gray-600 hover:text-red-500 shadow-sm"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {/* Drag Handle Indicator */}
                                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-gray-300 opacity-50">
                                        <GripVertical className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 text-xs font-medium text-gray-500">
                                {page.originalIndex === -1 ? 'Blank' : `Page ${page.originalIndex + 1}`}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Bottom Bar */}
        <div className="bg-[#fff9e6] border-t border-orange-100 p-4 sticky bottom-0 z-40">
             <div className="max-w-md mx-auto">
                 <button 
                     onClick={handleSave}
                     disabled={processing}
                     className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-bold py-4 rounded-lg shadow-md flex items-center justify-center text-lg transition-colors"
                 >
                     {processing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                     Organize
                 </button>
             </div>
        </div>
    </div>
  );

  function insertPageAtEnd() {
      insertBlankPage(pages.length);
  }
};

export default OrganizePdf;