
import React, { useState, useRef } from 'react';
import { FileUp, ChevronDown, Check, Loader2, Download, RefreshCw, Image } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { useLanguage } from '../../contexts/LanguageContext';
import ProcessingOverlay from '../ProcessingOverlay';

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
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 2.0 }); 
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (context) {
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              await page.render({ canvasContext: context, viewport }).promise;
              const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
              
              const res = await fetch(dataUrl);
              const blob = await res.blob();
              setProgress(100);
              setResultUrl(URL.createObjectURL(blob));
          }
      } else {
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 py-20 px-4 font-sans transition-colors duration-300">
        <h1 className="text-4xl font-black text-gray-800 dark:text-gray-100 mb-3 text-center tracking-tight leading-tight">{t('tool.pdf-jpg.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 text-center font-medium max-w-xl">{t('tool.pdf-jpg.desc')}</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-7 rounded-2xl shadow-xl shadow-brand-200 dark:shadow-brand-900/20 transition-all flex items-center justify-center gap-4 text-2xl group transform hover:-translate-y-1"
           >
             <Image className="w-9 h-9 group-hover:-translate-y-1 transition-transform" />
             Upload PDF file
           </button>
           <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
           <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4 font-bold uppercase tracking-widest">
             Or drag and drop file here
           </p>
        </div>
      </div>
    );
  }

  if (step === 'options') {
      return (
          <div className="min-h-[80vh] bg-gray-50 dark:bg-gray-950 flex flex-col items-center pt-12 px-4 pb-24 font-sans transition-colors duration-300">
              {processing && <ProcessingOverlay status="Extracting images from pages..." progress={progress} />}
              
              <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-2 tracking-tight leading-tight">{t('tool.pdf-jpg.title')}</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-10 font-medium">Selected: <span className="text-gray-800 dark:text-gray-200">{file?.name}</span></p>

              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 max-w-lg w-full text-center animate-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-10">
                       <div className="w-24 h-24 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500 dark:text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                           <Image className="w-12 h-12" />
                       </div>
                       <h4 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-2">Ready to convert</h4>
                       <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed font-medium px-4">Every page will be rendered as a high-quality JPEG image. Multiple pages will be bundled into a ZIP file.</p>
                  </div>

                  <div className="flex flex-col gap-3">
                      <button 
                          onClick={convert}
                          disabled={processing}
                          className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-brand-100 dark:shadow-brand-900/20 flex items-center justify-center gap-3 text-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
                      >
                          {processing ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCw className="w-6 h-6" />}
                          Convert to JPG
                      </button>
                      <button 
                          onClick={reset}
                          className="w-full py-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-bold uppercase tracking-widest transition-colors"
                      >
                          Choose different file
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  if (step === 'success' && resultUrl) {
    return (
      <div className="min-h-[80vh] bg-gray-50 dark:bg-gray-950 flex flex-col items-center pt-24 px-4 font-sans transition-colors duration-300">
        <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-8 tracking-tight">Your images are ready</h2>
        <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 max-w-2xl w-full text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner animate-in zoom-in duration-700">
                <Check className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-3 tracking-tight">Export Successful</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg font-medium leading-relaxed">All pages have been successfully rendered as images.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={resultUrl} download={isSinglePage ? `${file?.name.replace('.pdf', '')}.jpg` : `${file?.name.replace('.pdf', '')}_images.zip`} className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-brand-100 dark:shadow-brand-900/20 flex items-center justify-center gap-3 text-lg transition-all transform hover:-translate-y-1 active:scale-95 active:translate-y-0">
                    <Download className="w-6 h-6" /> Download {isSinglePage ? 'JPG' : 'ZIP Archive'}
                </a>
                <button onClick={reset} className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold py-4 px-8 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5" /> Start Over
                </button>
            </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PdfToJpg;
