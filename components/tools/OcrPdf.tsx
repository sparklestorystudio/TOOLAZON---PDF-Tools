import React, { useState, useRef } from 'react';
import { FileUp, ChevronDown, Check, Loader2, Download, RefreshCw, FileSearch, Copy } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import { useLanguage } from '../../contexts/LanguageContext';

// Safely handle pdfjs-dist import
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

if (pdfjs && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

const OcrPdf: React.FC = () => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'options' | 'success'>('upload');
  const [processing, setProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStep('options');
      setExtractedText('');
    }
  };

  const processOcr = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setExtractedText('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      let fullText = '';

      for (let i = 1; i <= numPages; i++) {
          setStatus(`Processing page ${i} of ${numPages}...`);
          
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 }); // High scale for better OCR
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (context) {
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              await page.render({ canvasContext: context, viewport }).promise;
              
              const { data: { text } } = await Tesseract.recognize(
                  canvas.toDataURL(),
                  'eng', // Default to English for MVP, could expand to language selector
                  {
                      logger: m => {
                          if (m.status === 'recognizing text') {
                              // Local progress for the page, mapped to global progress
                              const pageProgress = m.progress * (100 / numPages);
                              const baseProgress = ((i - 1) / numPages) * 100;
                              setProgress(Math.round(baseProgress + pageProgress));
                          }
                      }
                  }
              );

              fullText += `--- Page ${i} ---\n\n${text}\n\n`;
          }
      }

      setExtractedText(fullText);
      setStep('success');

    } catch (e) {
      console.error(e);
      alert("Error performing OCR.");
    } finally {
      setProcessing(false);
    }
  };

  const downloadText = () => {
      const blob = new Blob([extractedText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file?.name.replace('.pdf', '')}_ocr.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(extractedText);
      alert("Text copied to clipboard!");
  };

  const reset = () => {
    setFile(null);
    setStep('upload');
    setExtractedText('');
    setProgress(0);
  };

  if (step === 'upload') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 py-20 px-4 font-sans">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">{t('tool.ocr.title')}</h1>
        <p className="text-gray-500 text-lg mb-10 text-center">{t('tool.ocr.desc')}</p>
        
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
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('tool.ocr.title')}</h2>
              <div className="mb-8 text-sm text-gray-400">Selected: {file?.name}</div>

              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-lg w-full text-center">
                  <div className="mb-8">
                       <FileSearch className="w-16 h-16 text-orange-600 mx-auto mb-4" />
                       <p className="text-gray-600">Recognize and extract text from scanned documents.</p>
                  </div>

                  {processing && (
                      <div className="mb-6">
                           <div className="flex justify-between text-xs text-gray-500 mb-1">
                               <span>{status}</span>
                               <span>{progress}%</span>
                           </div>
                           <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-200 mb-2">
                               <div className="bg-brand-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                           </div>
                      </div>
                  )}

                  <button 
                      onClick={processOcr}
                      disabled={processing}
                      className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-lg shadow-md flex items-center justify-center gap-2 text-lg transition-colors disabled:opacity-70"
                  >
                      {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                      {processing ? 'Scanning...' : 'Start OCR'}
                  </button>
              </div>
          </div>
      );
  }

  if (step === 'success') {
    return (
      <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center pt-12 px-4 font-sans">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">OCR Completed</h2>
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-4xl w-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700">Extracted Text</h3>
                <button onClick={copyToClipboard} className="text-brand-500 hover:text-brand-600 text-sm font-medium flex items-center gap-1">
                    <Copy className="w-4 h-4" /> Copy
                </button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded border border-gray-200 max-h-[400px] overflow-y-auto mb-6 font-mono text-sm whitespace-pre-wrap text-gray-700">
                {extractedText}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={downloadText} className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-md shadow-md flex items-center justify-center gap-2 transition-colors">
                    <Download className="w-5 h-5" /> Download Text File
                </button>
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

export default OcrPdf;