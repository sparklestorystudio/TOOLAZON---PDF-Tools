import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FileUp, ChevronDown, Check, Loader2, Crop, Download, RefreshCw, ZoomIn, ZoomOut, ArrowLeft, Layers, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

// Safely handle pdfjs-dist import
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

if (pdfjs && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

type CropMode = 'all-same' | 'max-crop' | 'preview';
type EditorMode = 'blended' | 'page-by-page' | 'odd-even';
type CropGroup = 'global' | 'odd' | 'even';

interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

const INCH_TO_PT = 72;
const CM_TO_PT = 28.3465;

const CropPdf: React.FC = () => {
  const { t } = useLanguage();
  const { themeColor } = useTheme();
  
  // Workflow State
  const [step, setStep] = useState<'upload' | 'options' | 'editor' | 'success'>('upload');
  
  // Data State
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);

  // Editor State
  const [editorMode, setEditorMode] = useState<EditorMode>('blended');
  const [canvasImage, setCanvasImage] = useState<string | null>(null); // The rendered visual
  const [pdfPageSize, setPdfPageSize] = useState<{width: number, height: number} | null>(null); // In Points
  const [currentPage, setCurrentPage] = useState(1); // 1-based index for UI

  // Crop Configurations
  const [cropConfigs, setCropConfigs] = useState<{global: Box, odd: Box, even: Box}>({
      global: { x: 0, y: 0, width: 0, height: 0 },
      odd: { x: 0, y: 0, width: 0, height: 0 },
      even: { x: 0, y: 0, width: 0, height: 0 }
  });

  const [activeGroup, setActiveGroup] = useState<CropGroup>('global');
  
  // UI State
  const [scale, setScale] = useState(1.0); 
  const [unit, setUnit] = useState<'inch' | 'cm'>('inch');
  
  // Dragging
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const unitToPt = unit === 'inch' ? INCH_TO_PT : CM_TO_PT;

  useEffect(() => {
      if (editorMode === 'blended' || editorMode === 'page-by-page') {
          setActiveGroup('global');
      } else if (editorMode === 'odd-even') {
          setActiveGroup('odd');
      }
  }, [editorMode]);

  const getCurrentBox = () => cropConfigs[activeGroup];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setResultUrl(null);
      setStep('options');
      
      const arrayBuffer = await selectedFile.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      setNumPages(pdf.numPages);
      
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      setPdfPageSize({ width: viewport.width, height: viewport.height });
      
      const defaultBox = {
        x: viewport.width * 0.1,
        y: viewport.height * 0.1,
        width: viewport.width * 0.8,
        height: viewport.height * 0.8
      };

      setCropConfigs({
          global: { ...defaultBox },
          odd: { ...defaultBox },
          even: { ...defaultBox }
      });
    }
  };

  // Helper: Scan canvas for content bounding box
  const analyzeContent = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    
    // Simple scan for non-white pixels
    for (let y = 0; y < height; y += 5) {
        for (let x = 0; x < width; x += 5) {
            const i = (y * width + x) * 4;
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            const alpha = data[i+3];

            if (alpha > 0 && (r < 250 || g < 250 || b < 250)) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    
    if (maxX < minX) return null; 

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  };

  const renderView = useCallback(async () => {
    if (!file || !pdfPageSize) return;
    setLoading(true);

    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        const renderScale = 1.0; 
        canvas.width = pdfPageSize.width * renderScale;
        canvas.height = pdfPageSize.height * renderScale;

        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);

        if (editorMode === 'blended') {
            const limit = Math.min(numPages, 5);
            context.globalAlpha = 1 / limit + 0.1; 
            
            for(let i=1; i<=limit; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: renderScale });
                await page.render({ canvasContext: context, viewport }).promise;
            }
        } 
        else if (editorMode === 'page-by-page') {
            const page = await pdf.getPage(currentPage);
            const viewport = page.getViewport({ scale: renderScale });
            context.globalAlpha = 1.0;
            await page.render({ canvasContext: context, viewport }).promise;
        }
        else if (editorMode === 'odd-even') {
            const start = activeGroup === 'odd' ? 1 : 2;
            context.globalAlpha = 0.4; 
            
            let count = 0;
            for(let i = start; i <= numPages && count < 3; i += 2) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: renderScale });
                await page.render({ canvasContext: context, viewport }).promise;
                count++;
            }
        }

        setCanvasImage(canvas.toDataURL());
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  }, [file, numPages, pdfPageSize, editorMode, currentPage, activeGroup]);

  useEffect(() => {
    if (step === 'editor') {
        renderView();
    }
  }, [step, renderView]);

  const handleAutoCrop = async () => {
     if (!canvasImage || !pdfPageSize) return;
     
     const img = new Image();
     img.src = canvasImage;
     img.onload = () => {
         const canvas = document.createElement('canvas');
         canvas.width = img.width;
         canvas.height = img.height;
         const ctx = canvas.getContext('2d');
         if (!ctx) return;
         ctx.drawImage(img, 0, 0);
         
         const bbox = analyzeContent(ctx, canvas.width, canvas.height);
         if (bbox) {
             const padding = 10;
             const newBox = {
                 x: Math.max(0, bbox.x - padding),
                 y: Math.max(0, bbox.y - padding),
                 width: Math.min(pdfPageSize.width - (bbox.x - padding), bbox.width + (padding*2)),
                 height: Math.min(pdfPageSize.height - (bbox.y - padding), bbox.height + (padding*2))
             };
             
             setCropConfigs(prev => ({
                 ...prev,
                 [activeGroup]: newBox
             }));

         } else {
             alert("Could not detect content boundaries.");
         }
     };
  };

  const handleOptionSelect = (mode: CropMode) => {
      if (mode === 'preview') {
          setEditorMode('blended');
          setStep('editor');
      } else if (mode === 'all-same') {
          setEditorMode('blended');
          setStep('editor');
          setTimeout(handleAutoCrop, 500);
      } else {
           processCrop('max-crop');
      }
  };

  const processCrop = async (mode: CropMode | 'manual' = 'manual') => {
      if (!file || !pdfPageSize) return;
      setProcessing(true);
      setProgress(0);

      try {
          const arrayBuffer = await file.arrayBuffer();
          // Fix: Support owner-locked files by passing empty password
          const pdfDoc = await PDFDocument.load(arrayBuffer, { password: '' } as any);
          const pages = pdfDoc.getPages();

          if (mode === 'max-crop') {
             for (let i = 0; i < pages.length; i++) {
                 const page = pages[i];
                 const { width, height } = page.getSize();
                 page.setCropBox(width * 0.1, height * 0.1, width * 0.8, height * 0.8);
                 setProgress(Math.round(((i + 1) / pages.length) * 90));
             }
          } else {
              for (let i = 0; i < pages.length; i++) {
                  const page = pages[i];
                  const pageIndex = i + 1; // 1-based
                  let boxToUse: Box;

                  if (editorMode === 'odd-even') {
                      boxToUse = (pageIndex % 2 !== 0) ? cropConfigs.odd : cropConfigs.even;
                  } else {
                      boxToUse = cropConfigs.global;
                  }

                  const { x, width, height } = boxToUse;
                  // Invert Y for PDF coordinate system
                  const y = pdfPageSize.height - (boxToUse.y + height);
                  
                  page.setCropBox(x, y, width, height);
                  setProgress(Math.round(((i + 1) / pages.length) * 90));
              }
          }

          const pdfBytes = await pdfDoc.save();
          setProgress(100);
          
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setResultUrl(url);
          setStep('success');

      } catch (err: any) {
          console.error(err);
          if (err.message && (err.message.includes('encrypted') || err.message.includes('password'))) {
              alert("This file is password protected. Please unlock it first.");
          } else {
              alert("Error processing PDF");
          }
      } finally {
          setProcessing(false);
      }
  };

  // --- Input Handlers ---
  const handleInputChange = (field: 'x' | 'y' | 'w' | 'h' | 'right' | 'bottom', valStr: string) => {
     if (!pdfPageSize) return;
     const val = parseFloat(valStr) || 0;
     const pt = val * unitToPt;

     setCropConfigs(prev => {
         const currentBox = prev[activeGroup];
         const newBox = { ...currentBox };
         
         if (field === 'x') { // Left
             const delta = pt - newBox.x;
             newBox.x = pt;
             newBox.width -= delta; 
         }
         else if (field === 'y') { // Top
             const delta = pt - newBox.y;
             newBox.y = pt;
             newBox.height -= delta;
         }
         else if (field === 'w') { // Width
             newBox.width = pt;
         }
         else if (field === 'h') { // Height
             newBox.height = pt;
         }
         else if (field === 'right') { // Margin Right
             newBox.width = pdfPageSize.width - pt - newBox.x;
         }
         else if (field === 'bottom') { // Margin Bottom
             newBox.height = pdfPageSize.height - pt - newBox.y;
         }
         
         return { ...prev, [activeGroup]: newBox };
     });
  };

  // --- Drag Logic ---
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current || !pdfPageSize) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ptX = x / scale;
    const ptY = y / scale;

    setCropConfigs(prev => {
        const currentBox = prev[activeGroup];
        let newBox = { ...currentBox };
        
        if (dragHandle?.includes('w')) { // West
             newBox.x = Math.max(0, ptX);
             newBox.width -= (newBox.x - currentBox.x);
        }
        if (dragHandle?.includes('e')) { // East
             newBox.width = Math.max(10, ptX - newBox.x);
        }
        if (dragHandle?.includes('n')) { // North
             newBox.y = Math.max(0, ptY);
             newBox.height -= (newBox.y - currentBox.y);
        }
        if (dragHandle?.includes('s')) { // South
             newBox.height = Math.max(10, ptY - newBox.y);
        }
        return { ...prev, [activeGroup]: newBox };
    });
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setResultUrl(null);
    setCropConfigs({
        global: { x: 0, y: 0, width: 0, height: 0 },
        odd: { x: 0, y: 0, width: 0, height: 0 },
        even: { x: 0, y: 0, width: 0, height: 0 }
    });
    setEditorMode('blended');
    setCurrentPage(1);
    setProgress(0);
  };

  const cropBox = getCurrentBox();

  // --- Views ---

  if (step === 'upload') {
     return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 py-20 px-4 font-sans">
            <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">Crop PDF online</h1>
            <p className="text-gray-500 text-lg mb-10 text-center">Trim PDF margins, change PDF page size</p>
            <div className="w-full max-w-xl">
                <button onClick={() => fileInputRef.current?.click()} className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-6 rounded-lg shadow-md flex items-center justify-center gap-3 text-xl group transition-all">
                    <FileUp className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />
                    Upload PDF files
                    <ChevronDown className="w-5 h-5 ml-2" />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
                <p className="text-xs text-center text-gray-400 mt-4">
                  Or drag and drop files here
                </p>
            </div>

            <div className="mt-16 max-w-2xl text-center">
                <h3 className="font-bold text-gray-700 mb-2">How to crop a PDF</h3>
                <p className="text-sm text-gray-500">
                    Upload your PDF. Choose an option to crop pages automatically or manually select the area you want to keep. Click 'Crop PDF' to download your cropped document.
                </p>
            </div>
        </div>
     );
  }

  if (step === 'options') {
      return (
          <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center pt-12 px-4 font-sans">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Crop PDF Online</h2>
              <p className="text-gray-500 mb-8">Trim PDF margins, change PDF page size</p>
              
              <div className="mb-8 text-sm text-gray-400">Selected: {file?.name}</div>

              <h3 className="font-bold text-gray-800 mb-6">Choose an option</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
                  {/* Option 1 */}
                  <div 
                    onClick={() => handleOptionSelect('all-same')}
                    className="bg-[#e6f7f5] hover:bg-[#d0f0ec] border-2 border-transparent hover:border-brand-300 p-8 rounded-lg cursor-pointer flex flex-col items-center text-center transition-all group"
                  >
                      <Copy className="w-12 h-12 text-brand-500 mb-4" />
                      <p className="text-brand-700 font-medium mb-8">Same crop size across all pages</p>
                      <span className="mt-auto font-bold text-xl text-brand-600 flex items-center">
                          Automatic <ArrowLeft className="w-5 h-5 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                      </span>
                  </div>

                  {/* Option 2 */}
                  <div 
                    onClick={() => handleOptionSelect('max-crop')}
                    className="bg-white hover:shadow-lg border border-gray-200 p-8 rounded-lg cursor-pointer flex flex-col items-center text-center transition-all group"
                  >
                      <Layers className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 font-medium mb-8">Crop each page as much as possible</p>
                      <span className="mt-auto font-bold text-xl text-brand-500 flex flex-col items-center">
                          Automatic <br/> maximum crop
                          <ArrowLeft className="w-5 h-5 mt-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                      </span>
                  </div>

                  {/* Option 3 */}
                  <div 
                    onClick={() => handleOptionSelect('preview')}
                    className="bg-white hover:shadow-lg border border-gray-200 p-8 rounded-lg cursor-pointer flex flex-col items-center text-center transition-all group"
                  >
                      <Crop className="w-12 h-12 text-brand-500 mb-4" />
                      <p className="text-gray-600 font-medium mb-8">Preview pages and choose crop areas</p>
                      <span className="mt-auto font-bold text-xl text-brand-500 flex flex-col items-center">
                          Preview pages & <br/> select
                          <ArrowLeft className="w-5 h-5 mt-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                      </span>
                  </div>
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
                <p className="text-gray-500 mb-8">PDF cropped successfully.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href={resultUrl} download={`cropped_${file?.name}`} className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-md shadow-md flex items-center justify-center gap-2 transition-colors">
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
    <div 
        className="min-h-screen bg-[#f7f7f7] flex flex-col font-sans" 
        onMouseMove={handleMouseMove} 
        onMouseUp={() => { setIsDragging(false); setDragHandle(null); }}
    >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 py-4 px-6 text-center">
             <h2 className="text-2xl font-bold text-gray-800">Crop PDF Online</h2>
             <p className="text-gray-400 text-sm">Trim PDF margins, change PDF page size</p>
             <div className="mt-2 text-xs text-gray-400">Selected: {file?.name}</div>
             
             <div className="mt-4 font-bold text-gray-700">Preview mode</div>
             <div className="flex justify-center mt-2">
                 <div className="flex border border-gray-300 rounded overflow-hidden text-sm flex-wrap justify-center sm:flex-nowrap">
                     <button 
                       onClick={() => setEditorMode('blended')}
                       className={`px-4 py-2 ${editorMode === 'blended' ? 'bg-[#e6f7f5] text-brand-700 font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                     >
                         Blended
                     </button>
                     <button 
                       onClick={() => setEditorMode('page-by-page')}
                       className={`px-4 py-2 border-l border-r border-gray-300 ${editorMode === 'page-by-page' ? 'bg-[#e6f7f5] text-brand-700 font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                     >
                         Page by page
                     </button>
                     <button 
                       onClick={() => setEditorMode('odd-even')}
                       className={`px-4 py-2 ${editorMode === 'odd-even' ? 'bg-[#e6f7f5] text-brand-700 font-medium' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                     >
                         Odd & even
                     </button>
                 </div>
             </div>
        </div>

        {/* Dynamic Sub-Controls (Pagination or Odd/Even Toggles) */}
        <div className="bg-gray-100 py-2 border-b border-gray-200 flex justify-center items-center h-12">
            {editorMode === 'page-by-page' && (
                <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <span className="text-sm font-medium text-gray-700">
                        Page {currentPage} of {numPages}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
                      disabled={currentPage === numPages}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            )}
            {editorMode === 'odd-even' && (
                <div className="flex gap-4">
                    <button 
                        onClick={() => setActiveGroup('odd')}
                        className={`text-sm font-medium px-3 py-1 rounded transition-colors ${activeGroup === 'odd' ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        Odd Pages
                    </button>
                    <button 
                        onClick={() => setActiveGroup('even')}
                        className={`text-sm font-medium px-3 py-1 rounded transition-colors ${activeGroup === 'even' ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        Even Pages
                    </button>
                </div>
            )}
            {editorMode === 'blended' && (
                <span className="text-xs text-gray-400 italic">Showing first 5 pages blended</span>
            )}
        </div>

        {/* Controls Grid */}
        <div className="max-w-4xl mx-auto w-full px-4 mb-8 mt-6">
            <div className="bg-[#f0f0f0] p-6 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                 {/* Left Inputs */}
                 <div className="space-y-4">
                     <div className="flex items-center justify-end gap-2">
                         <label className="text-gray-500 font-medium">Top</label>
                         <input 
                            type="number" 
                            className="w-20 p-2 border border-gray-300 rounded text-center"
                            value={(cropBox.y / unitToPt).toFixed(2)}
                            onChange={(e) => handleInputChange('y', e.target.value)}
                         />
                     </div>
                     <div className="flex items-center justify-end gap-2">
                         <label className="text-gray-500 font-medium">Bottom</label>
                         <input 
                            type="number" 
                            className="w-20 p-2 border border-gray-300 rounded text-center"
                            value={((pdfPageSize ? pdfPageSize.height - (cropBox.y + cropBox.height) : 0) / unitToPt).toFixed(2)}
                            onChange={(e) => handleInputChange('bottom', e.target.value)}
                         />
                     </div>
                 </div>

                 {/* Center Inputs */}
                 <div className="space-y-4">
                     <div className="flex items-center justify-center gap-2">
                         <label className="text-gray-500 font-medium">Width</label>
                         <input 
                            type="number" 
                            className="w-20 p-2 border border-gray-300 rounded text-center"
                            value={(cropBox.width / unitToPt).toFixed(2)}
                            onChange={(e) => handleInputChange('w', e.target.value)}
                         />
                     </div>
                     <div className="flex items-center justify-center gap-2">
                         <label className="text-gray-500 font-medium">Height</label>
                         <input 
                            type="number" 
                            className="w-20 p-2 border border-gray-300 rounded text-center"
                            value={(cropBox.height / unitToPt).toFixed(2)}
                            onChange={(e) => handleInputChange('h', e.target.value)}
                         />
                     </div>
                     <div className="flex justify-center gap-4 text-sm mt-2">
                         <div className="flex rounded border border-gray-300 overflow-hidden">
                             <button onClick={() => setUnit('inch')} className={`px-2 py-1 ${unit === 'inch' ? 'bg-brand-500 text-white' : 'bg-white'}`}>inch</button>
                             <button onClick={() => setUnit('cm')} className={`px-2 py-1 ${unit === 'cm' ? 'bg-brand-500 text-white' : 'bg-white'}`}>cm</button>
                         </div>
                     </div>
                 </div>

                 {/* Right Inputs */}
                 <div className="space-y-4">
                     <div className="flex items-center justify-start gap-2">
                         <input 
                            type="number" 
                            className="w-20 p-2 border border-gray-300 rounded text-center"
                            value={(cropBox.x / unitToPt).toFixed(2)}
                            onChange={(e) => handleInputChange('x', e.target.value)}
                         />
                         <label className="text-gray-500 font-medium">Left</label>
                     </div>
                     <div className="flex items-center justify-start gap-2">
                         <input 
                            type="number" 
                            className="w-20 p-2 border border-gray-300 rounded text-center"
                            value={((pdfPageSize ? pdfPageSize.width - (cropBox.x + cropBox.width) : 0) / unitToPt).toFixed(2)}
                            onChange={(e) => handleInputChange('right', e.target.value)}
                         />
                         <label className="text-gray-500 font-medium">Right</label>
                     </div>
                     <div className="text-center mt-2">
                         <button onClick={handleAutoCrop} className="text-brand-500 hover:underline text-sm font-medium">Auto-crop</button>
                     </div>
                 </div>
            </div>
        </div>

        {/* Canvas Editor */}
        <div className="flex-1 overflow-auto flex justify-center pb-24 relative bg-[#f7f7f7]">
            {loading ? (
                <div className="flex flex-col items-center justify-center mt-20">
                    <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
                    <p className="text-gray-500">Rendering preview...</p>
                </div>
            ) : (
                <div className="relative shadow-2xl bg-white" style={{ width: pdfPageSize ? pdfPageSize.width * scale : 0, height: pdfPageSize ? pdfPageSize.height * scale : 0 }}>
                    {/* Image */}
                    {canvasImage && (
                        <img src={canvasImage} alt="PDF Preview" className="w-full h-full pointer-events-none" />
                    )}
                    
                    {/* Container for crop box handling */}
                    <div 
                        ref={containerRef}
                        className="absolute inset-0"
                    >
                         {/* Dark Overlays based on current box */}
                         <div className="absolute bg-black/40 top-0 left-0 right-0" style={{ height: (cropBox.y * scale) }}></div>
                         <div className="absolute bg-black/40 bottom-0 left-0 right-0" style={{ top: (cropBox.y + cropBox.height) * scale }}></div>
                         <div className="absolute bg-black/40 left-0" style={{ top: cropBox.y * scale, height: cropBox.height * scale, width: cropBox.x * scale }}></div>
                         <div className="absolute bg-black/40 right-0" style={{ top: cropBox.y * scale, height: cropBox.height * scale, left: (cropBox.x + cropBox.width) * scale }}></div>

                         {/* The Crop Box */}
                         <div
                            className="absolute border border-brand-500 cursor-move shadow-[0_0_0_1px_rgba(255,255,255,0.5)]"
                            style={{
                                top: cropBox.y * scale,
                                left: cropBox.x * scale,
                                width: cropBox.width * scale,
                                height: cropBox.height * scale,
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                setIsDragging(true);
                                setDragHandle('move');
                            }}
                         >
                            {/* Handles */}
                            {['nw', 'ne', 'sw', 'se'].map(pos => (
                                <div
                                    key={pos}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        setIsDragging(true);
                                        setDragHandle(pos);
                                    }}
                                    className={`absolute w-3 h-3 bg-brand-500 border border-white z-20 
                                        ${pos === 'nw' ? '-top-1.5 -left-1.5 cursor-nw-resize' : ''}
                                        ${pos === 'ne' ? '-top-1.5 -right-1.5 cursor-ne-resize' : ''}
                                        ${pos === 'sw' ? '-bottom-1.5 -left-1.5 cursor-sw-resize' : ''}
                                        ${pos === 'se' ? '-bottom-1.5 -right-1.5 cursor-se-resize' : ''}
                                    `}
                                />
                            ))}
                            {/* Grid Lines */}
                            <div className="absolute top-0 bottom-0 left-1/3 w-px bg-brand-500/30 pointer-events-none"></div>
                            <div className="absolute top-0 bottom-0 left-2/3 w-px bg-brand-500/30 pointer-events-none"></div>
                            <div className="absolute left-0 right-0 top-1/3 h-px bg-brand-500/30 pointer-events-none"></div>
                            <div className="absolute left-0 right-0 top-2/3 h-px bg-brand-500/30 pointer-events-none"></div>
                         </div>
                    </div>
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
                     onClick={() => processCrop('manual')}
                     disabled={processing}
                     className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-bold py-4 rounded-lg shadow-md flex items-center justify-center text-lg transition-colors"
                 >
                     {processing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                     Crop PDF
                 </button>
             </div>
        </div>
    </div>
  );
};

export default CropPdf;