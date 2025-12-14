import React, { useState, useRef } from 'react';
import { FileUp, ChevronDown, Check, Loader2, Download, RefreshCw, ArrowRight } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import ProcessingOverlay from '../ProcessingOverlay';

// Safely handle pdfjs-dist import
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

if (pdfjs && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

type ConversionMode = 'layout' | 'legibility';

// Custom Icons
const FileGridIcon = ({ className }: { className?: string }) => (
  <svg width="48" height="60" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M5 0H35C37.7614 0 40 2.23858 40 5V45C40 47.7614 37.7614 50 35 50H5C2.23858 50 0 47.7614 0 45V5C0 2.23858 2.23858 0 5 0Z" fill="white" stroke="currentColor" strokeWidth="2"/>
    <rect x="8" y="10" width="24" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="8" y="22" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="22" y="22" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="8" y="34" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="22" y="34" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const FileTextIcon = ({ className }: { className?: string }) => (
  <svg width="48" height="60" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
     <path d="M5 0H35C37.7614 0 40 2.23858 40 5V45C40 47.7614 37.7614 50 35 50H5C2.23858 50 0 47.7614 0 45V5C0 2.23858 2.23858 0 5 0Z" fill="white" stroke="currentColor" strokeWidth="2"/>
     <line x1="8" y1="12" x2="32" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
     <line x1="8" y1="20" x2="32" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
     <line x1="8" y1="28" x2="32" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
     <line x1="8" y1="36" x2="20" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const PdfToWord: React.FC = () => {
  const { t } = useLanguage();
  const [step, setStep] = useState<'upload' | 'options' | 'success'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<ConversionMode>('layout');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStep('options');
      setResultUrl(null);
    }
  };

  const convert = async () => {
      if (!file) return;
      setProcessing(true);
      setProgress(0);

      try {
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          
          let docContent = `
            <html xmlns:w="urn:schemas-microsoft-com:office:word">
            <head>
                <meta charset="utf-8">
                <style>
                    @page { margin: 0; size: auto; }
                    body { margin: 0; padding: 0; }
                    p { margin: 0; padding: 0; }
                    img { display: block; }
                </style>
            </head>
            <body>
          `;

          for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              
              // Viewport for Layout Calculation (Points)
              const viewportOriginal = page.getViewport({ scale: 1.0 });
              // Viewport for High-Res Image (Pixels)
              const viewportHighRes = page.getViewport({ scale: 2.0 }); 
              
              // Insert Page Break BEFORE content (except first page)
              if (i > 1) {
                  docContent += `<br style="page-break-before:always" />`;
              }

              if (mode === 'layout') {
                  // "Same to Same" Mode: Render Page as High-Res Image
                  const canvas = document.createElement('canvas');
                  const context = canvas.getContext('2d');
                  if (context) {
                      canvas.width = viewportHighRes.width;
                      canvas.height = viewportHighRes.height;
                      await page.render({ canvasContext: context, viewport: viewportHighRes }).promise;
                      const imgData = canvas.toDataURL('image/jpeg', 0.85);
                      
                      // We use CSS width/height in 'pt' to match PDF physical size exactly in Word
                      docContent += `
                        <p style="margin:0; padding:0">
                            <img src="${imgData}" style="width:${viewportOriginal.width}pt; height:${viewportOriginal.height}pt;" />
                        </p>
                      `;
                  }
              } else {
                  // Legibility Mode: Extract Text
                  const textContent = await page.getTextContent();
                  const strings = textContent.items.map((item: any) => 'str' in item ? item.str : '').join(' ');
                  // Use basic paragraph but try to separate blocks roughly
                  docContent += `<p style="margin-bottom: 12pt; padding: 20pt">${strings}</p>`;
              }
              
              setProgress(Math.round((i / pdf.numPages) * 100));
          }
          
          docContent += '</body></html>';

          const blob = new Blob(['\ufeff', docContent], { type: 'application/msword' });
          const url = URL.createObjectURL(blob);
          setResultUrl(url);
          setStep('success');

      } catch (e) {
          console.error(e);
          alert("Error converting PDF: " + e);
      } finally {
          setProcessing(false);
      }
  };

  const reset = () => {
    setFile(null);
    setStep('upload');
    setResultUrl(null);
    setMode('layout');
    setProgress(0);
  };

  if (step === 'upload') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 py-20 px-4 font-sans">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">PDF to Word</h1>
        <p className="text-gray-500 text-lg mb-10 text-center">Convert from PDF to DOC online</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-3 text-xl group"
           >
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
            <h3 className="font-bold text-gray-700 mb-2">How to convert PDF to Word</h3>
            <p className="text-sm text-gray-500">
                Click 'Upload' and select files from your local computer. Dragging and dropping files to the page also works.
            </p>
        </div>
      </div>
    );
  }

  if (step === 'options') {
      return (
          <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center pt-12 px-4 font-sans">
              {processing && <ProcessingOverlay status="Converting to Word..." progress={progress} />}
              
              <h2 className="text-3xl font-bold text-gray-800 mb-2">PDF to Word</h2>
              <div className="mb-8 text-sm text-gray-400">Selected: {file?.name}</div>

              <h3 className="font-bold text-gray-800 mb-6">Choose an option</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full mb-10">
                  <div 
                    onClick={() => setMode('layout')}
                    className={`relative p-8 rounded-lg cursor-pointer flex flex-col items-center text-center transition-all group border-2 h-72 ${mode === 'layout' ? 'border-brand-300 bg-[#e6f7f5]' : 'border-transparent bg-[#e6f7f5] hover:border-brand-200'}`}
                  >
                      <div className="flex items-center gap-4 mb-8 mt-4">
                          <FileGridIcon className="text-brand-500" />
                          <ArrowRight className="w-5 h-5 text-gray-400" />
                          <FileGridIcon className="text-brand-500" />
                      </div>
                      <span className="mt-auto font-bold text-xl text-brand-500 flex items-center mb-4 group-hover:text-brand-600">
                          Keep layout <ArrowRight className="w-5 h-5 ml-2" />
                      </span>
                  </div>

                  <div 
                    onClick={() => setMode('legibility')}
                    className={`relative p-8 rounded-lg cursor-pointer flex flex-col items-center text-center transition-all group border-2 h-72 ${mode === 'legibility' ? 'border-brand-500 bg-white shadow-md' : 'border-gray-200 bg-white hover:border-brand-200 hover:shadow-sm'}`}
                  >
                      <div className="flex items-center gap-4 mb-8 mt-4">
                          <FileGridIcon className="text-gray-400" />
                          <ArrowRight className="w-5 h-5 text-gray-300" />
                          <FileTextIcon className="text-brand-500" />
                      </div>
                      <p className="text-brand-500 text-sm mb-4">Easy reading on Kindle, etc.</p>
                      <span className="mt-auto font-bold text-xl text-brand-500 flex items-center flex-col md:flex-row mb-4 group-hover:text-brand-600">
                          Optimize for legibility <ArrowRight className="w-5 h-5 ml-2" />
                      </span>
                  </div>
              </div>

              <div className="w-full max-w-md mx-auto">
                  <button onClick={convert} disabled={processing} className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded shadow-md text-lg flex items-center justify-center transition-colors disabled:opacity-70">
                      {processing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                      Continue <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
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
            <p className="text-gray-500 mb-8">PDF converted to Word successfully.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={resultUrl} download={`${file?.name.replace('.pdf', '')}.doc`} className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-md shadow-md flex items-center justify-center gap-2 transition-colors">
                    <Download className="w-5 h-5" /> Download Word File
                </a>
                <button onClick={reset} className="bg-white border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors">
                    <RefreshCw className="w-4 h-4" /> Start Over
                </button>
            </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PdfToWord;