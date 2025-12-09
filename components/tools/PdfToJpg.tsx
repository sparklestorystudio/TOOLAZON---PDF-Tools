import React, { useState, useRef } from 'react';
import { FileUp, ChevronDown, Check, Loader2, Download, RefreshCw, Image } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { useLanguage } from '../../contexts/LanguageContext';

// Safely handle pdfjs-dist import
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

if (pdfjs && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

const PdfToJpg: React.FC = () => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'options' | 'success'>('upload');
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isSinglePage, setIsSinglePage] = useState(false);
  
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
      const numPages = pdf.numPages;

      setIsSinglePage(numPages === 1);

      if (numPages === 1) {
          // Single Page: Direct JPG Download
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 2.0 }); // High quality
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (context) {
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              await page.render({ canvasContext: context, viewport }).promise;
              const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
              
              // Convert DataURL to Blob for object URL
              const res = await fetch(dataUrl);
              const blob = await res.blob();
              setResultUrl(URL.createObjectURL(blob));
          }
      } else {
          // Multiple Pages: Zip
          const zip = new JSZip();
          
          for (let i = 1; i <= numPages; i++) {
              const page = await pdf.getPage(i);
              const viewport = page.getViewport({ scale: 2.0 });
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              
              if (context) {
                  canvas.width = viewport.width;
                  canvas.height = viewport.height;
                  await page.render({ canvasContext: context, viewport }).promise;
                  
                  // Get blob directly
                  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
                  if (blob) {
                      zip.file(`${file.name.replace('.pdf', '')}_page_${i}.jpg`, blob);
                  }
              }
              setProgress(Math.round((i / numPages) * 100));
          }
          
          const zipContent = await zip.generateAsync({ type: 'blob' });
          setResultUrl(URL.createObjectURL(zipContent));
      }

      setStep('success');

    } catch (e) {
      console.error(e);
      alert("Error converting PDF to JPG.");
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setStep('upload');
    setResultUrl(null);
    setProgress(0);
  };

  if (step === 'upload') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 py-20 px-4 font-sans">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">{t('tool.pdf-jpg.title')}</h1>
        <p className="text-gray-500 text-lg mb-10 text-center">{t('tool.pdf-jpg.desc')}</p>
        
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
      </div>
    );
  }

  if (step === 'options') {
      return (
          <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center pt-12 px-4 font-sans">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('tool.pdf-jpg.title')}</h2>
              <div className="mb-8 text-sm text-gray-400">Selected: {file?.name}</div>

              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-lg w-full text-center">
                  <div className="mb-8">
                       <Image className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                       <p className="text-gray-600">Convert all pages to high-quality JPG images.</p>
                  </div>

                  {processing && (
                      <div className="mb-6">
                           <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-200 mb-2">
                               <div className="bg-brand-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                           </div>
                           <p className="text-xs text-gray-500">Processing... {progress}%</p>
                      </div>
                  )}

                  <button 
                      onClick={convert}
                      disabled={processing}
                      className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-lg shadow-md flex items-center justify-center gap-2 text-lg transition-colors disabled:opacity-70"
                  >
                      {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                      {processing ? 'Converting...' : 'Convert to JPG'}
                  </button>
              </div>
          </div>
      );
  }

  if (step === 'success' && resultUrl) {
    return (
      <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center pt-12 px-4 font-sans">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Your images are ready</h2>
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-2xl w-full text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8" />
            </div>
            <p className="text-gray-500 mb-8">PDF converted successfully.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={resultUrl} download={isSinglePage ? `${file?.name.replace('.pdf', '')}.jpg` : `${file?.name.replace('.pdf', '')}_images.zip`} className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-md shadow-md flex items-center justify-center gap-2 transition-colors">
                    <Download className="w-5 h-5" /> Download {isSinglePage ? 'JPG' : 'ZIP archive'}
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

export default PdfToJpg;