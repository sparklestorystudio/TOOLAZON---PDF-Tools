import React, { useState, useRef } from 'react';
import { FileUp, Wand2, Download, Check, Loader2, RefreshCw, ChevronDown, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { useLanguage } from '../../contexts/LanguageContext';
import ProcessingOverlay from '../ProcessingOverlay';

// Safely handle pdfjs-dist import
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

if (pdfjs && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

const GrayscalePdf: React.FC = () => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'options' | 'success'>('upload');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStep('options');
      setResultUrl(null);
    }
  };

  const convertToGrayscale = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const doc = new jsPDF('p', 'pt', 'a4');

      for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 }); // High quality render
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (context) {
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              await page.render({ canvasContext: context, viewport }).promise;

              // Apply Grayscale Filter to Pixels
              const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
              const data = imageData.data;
              for (let j = 0; j < data.length; j += 4) {
                  const avg = (data[j] * 0.299 + data[j + 1] * 0.587 + data[j + 2] * 0.114);
                  data[j] = avg;     // R
                  data[j + 1] = avg; // G
                  data[j + 2] = avg; // B
              }
              context.putImageData(imageData, 0, 0);

              // Add to jsPDF
              const imgData = canvas.toDataURL('image/jpeg', 0.85);
              const pageWidth = doc.internal.pageSize.getWidth();
              const pageHeight = doc.internal.pageSize.getHeight();
              
              if (i > 1) doc.addPage();
              doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
          }
          
          setProgress(Math.round((i / numPages) * 100));
      }

      const pdfBlob = doc.output('blob');
      setResultUrl(URL.createObjectURL(pdfBlob));
      setStep('success');

    } catch (e) {
      console.error(e);
      alert("Error converting PDF to grayscale.");
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
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">Grayscale PDF</h1>
        <p className="text-gray-500 text-lg mb-10 text-center">Make a PDF text and images grayscale. Black and white PDF.</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-3 text-xl group"
           >
             <Wand2 className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />
             Upload PDF file
             <ChevronDown className="w-5 h-5 ml-2" />
           </button>
           <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />
        </div>
      </div>
    );
  }

  if (step === 'options') {
      return (
          <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center pt-12 px-4 font-sans">
              {processing && <ProcessingOverlay status="Converting to Grayscale..." progress={progress} />}
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Grayscale PDF</h2>
              <div className="mb-8 text-sm text-gray-400">Selected: {file?.name}</div>

              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-lg w-full text-center">
                  <div className="mb-8">
                       <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className="w-32 h-40 bg-gradient-to-br from-blue-500 to-purple-600 rounded shadow-lg transform -rotate-6"></div>
                                <div className="absolute top-0 left-0 w-32 h-40 bg-gray-400 rounded shadow-lg transform translate-x-4 translate-y-4 flex items-center justify-center">
                                    <ImageIcon className="w-12 h-12 text-white/50" />
                                </div>
                            </div>
                       </div>
                       <p className="text-gray-600 text-sm">Every page will be converted to grayscale, reducing color ink consumption when printing.</p>
                  </div>

                  <button 
                      onClick={convertToGrayscale}
                      disabled={processing}
                      className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-lg shadow-md flex items-center justify-center gap-2 text-lg transition-colors disabled:opacity-70"
                  >
                      {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                      Start Grayscale
                  </button>
                  <button onClick={reset} className="mt-4 text-gray-500 text-sm hover:underline">Choose a different file</button>
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
            <p className="text-gray-500 mb-8">PDF converted to grayscale successfully.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={resultUrl} download={`grayscale_${file?.name}`} className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-md shadow-md flex items-center justify-center gap-2 transition-colors">
                    <Download className="w-5 h-5" /> Download PDF
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

export default GrayscalePdf;