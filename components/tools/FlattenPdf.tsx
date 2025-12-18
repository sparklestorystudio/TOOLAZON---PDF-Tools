import React, { useState, useRef } from 'react';
import { FileUp, Printer, Download, Check, Loader2, RefreshCw, ChevronDown, ArrowLeft, ShieldCheck } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useLanguage } from '../../contexts/LanguageContext';
import ProcessingOverlay from '../ProcessingOverlay';

const FlattenPdf: React.FC = () => {
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

  const flattenPdf = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Fix: Support owner-locked files by passing empty password
      const pdfDoc = await PDFDocument.load(arrayBuffer, { password: '' } as any);
      
      const form = pdfDoc.getForm();
      
      // Flattening logic
      // This is a one-liner in pdf-lib that merges all widgets (form fields) into the page appearance layer
      form.flatten();
      
      setProgress(50);
      
      const pdfBytes = await pdfDoc.save();
      setProgress(100);
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResultUrl(URL.createObjectURL(blob));
      setStep('success');

    } catch (e: any) {
      console.error(e);
      if (e.message && (e.message.includes('encrypted') || e.message.includes('password'))) {
          alert("This file is password protected. Please unlock it first.");
      } else {
          alert("Error flattening PDF.");
      }
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
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">Flatten PDF</h1>
        <p className="text-gray-500 text-lg mb-10 text-center">Makes fillable PDFs read-only. Form fields will no longer be editable.</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-3 text-xl group"
           >
             <Printer className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />
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
              {processing && <ProcessingOverlay status="Flattening document..." progress={progress} />}
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Flatten PDF</h2>
              <div className="mb-8 text-sm text-gray-400">Selected: {file?.name}</div>

              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-lg w-full text-center">
                  <div className="mb-8">
                       <ShieldCheck className="w-16 h-16 text-brand-500 mx-auto mb-4" />
                       <h4 className="font-bold text-gray-700 mb-2">Ready to flatten</h4>
                       <p className="text-gray-600 text-sm">This will merge all form fields and annotations permanently into the document structure. They will no longer be interactive.</p>
                  </div>

                  <button 
                      onClick={flattenPdf}
                      disabled={processing}
                      className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-lg shadow-md flex items-center justify-center gap-2 text-lg transition-colors disabled:opacity-70"
                  >
                      {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
                      Flatten PDF
                  </button>
                  <button onClick={reset} className="mt-4 text-gray-500 text-sm hover:underline">Cancel</button>
              </div>
          </div>
      );
  }

  if (step === 'success' && resultUrl) {
    return (
      <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center pt-12 px-4 font-sans">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Flattening Complete</h2>
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-2xl w-full text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8" />
            </div>
            <p className="text-gray-500 mb-8">Your PDF has been flattened and is now read-only.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={resultUrl} download={`flattened_${file?.name}`} className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-md shadow-md flex items-center justify-center gap-2 transition-colors">
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

export default FlattenPdf;