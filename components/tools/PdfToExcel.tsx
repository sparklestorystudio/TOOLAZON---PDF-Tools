
import React, { useState, useRef } from 'react';
import { FileUp, ChevronDown, Check, Loader2, Download, RefreshCw, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { useLanguage } from '../../contexts/LanguageContext';
import ProcessingOverlay from '../ProcessingOverlay';

// Safely handle pdfjs-dist import
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

if (pdfjs && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

const PdfToExcel: React.FC = () => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'options' | 'success'>('upload');
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
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
    setStatus('Analyzing document structure...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const workbook = XLSX.utils.book_new();

      for (let i = 1; i <= pdf.numPages; i++) {
          setStatus(`Extracting data from Page ${i} of ${pdf.numPages}...`);
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          const items = textContent.items.map((item: any) => ({
              text: item.str,
              x: item.transform[4],
              y: item.transform[5], 
              width: item.width
          })).filter(item => item.text.trim() !== '');

          items.sort((a, b) => {
              if (Math.abs(a.y - b.y) > 5) return b.y - a.y; 
              return a.x - b.x; 
          });

          const rows: any[][] = [];
          if (items.length > 0) {
              let currentRow: any[] = [];
              let currentY = items[0].y;

              for (const item of items) {
                  if (Math.abs(item.y - currentY) > 5) {
                      rows.push(currentRow);
                      currentRow = [];
                      currentY = item.y;
                  }
                  currentRow.push(item.text);
              }
              if (currentRow.length > 0) rows.push(currentRow);
          }

          const worksheet = XLSX.utils.aoa_to_sheet(rows);
          XLSX.utils.book_append_sheet(workbook, worksheet, `Page ${i}`);
          
          setProgress(Math.round((i / pdf.numPages) * 90));
      }

      setStatus('Finalizing Excel file...');
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      setProgress(100);
      setResultUrl(URL.createObjectURL(blob));
      setStep('success');

    } catch (e) {
      console.error(e);
      alert("Error converting PDF to Excel.");
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
        <h1 className="text-4xl font-black text-gray-800 dark:text-gray-100 mb-3 text-center tracking-tight leading-tight">{t('tool.pdf-excel.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 text-center font-medium max-w-xl">{t('tool.pdf-excel.desc')}</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-7 rounded-2xl shadow-xl shadow-brand-200 dark:shadow-brand-900/20 transition-all flex items-center justify-center gap-4 text-2xl group transform hover:-translate-y-1"
           >
             <FileSpreadsheet className="w-9 h-9 group-hover:-translate-y-1 transition-transform" />
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
              {processing && <ProcessingOverlay status={status} progress={progress} />}
              
              <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-2 tracking-tight leading-tight">{t('tool.pdf-excel.title')}</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-10 font-medium">Selected: <span className="text-gray-800 dark:text-gray-200">{file?.name}</span></p>

              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 max-w-lg w-full text-center animate-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-10">
                       <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                           <FileSpreadsheet className="w-12 h-12" />
                       </div>
                       <h4 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-2">Ready to convert</h4>
                       <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed font-medium px-4">Our engine will extract tabular data from your PDF and generate a multi-sheet XLSX file.</p>
                       
                       <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-2xl flex items-start gap-3 text-left">
                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold leading-relaxed">Complex layouts or scanned documents without OCR might need manual cleanup in Excel.</p>
                       </div>
                  </div>

                  <div className="flex flex-col gap-3">
                      <button 
                          onClick={convert}
                          disabled={processing}
                          className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-brand-100 dark:shadow-brand-900/20 flex items-center justify-center gap-3 text-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
                      >
                          {processing ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCw className="w-6 h-6" />}
                          Convert to Excel
                      </button>
                      <button 
                          onClick={reset}
                          className="w-full py-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-bold uppercase tracking-widest transition-colors"
                      >
                          Cancel
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  if (step === 'success' && resultUrl) {
    return (
      <div className="min-h-[80vh] bg-gray-50 dark:bg-gray-950 flex flex-col items-center pt-24 px-4 font-sans transition-colors duration-300">
        <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-8 tracking-tight">Your spreadsheet is ready</h2>
        <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 max-w-2xl w-full text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner animate-in zoom-in duration-700">
                <Check className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-3 tracking-tight">Export Successful</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg font-medium leading-relaxed">The extracted data is now formatted as an Excel workbook.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={resultUrl} download={`${file?.name.replace('.pdf', '')}.xlsx`} className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-brand-100 dark:shadow-brand-900/20 flex items-center justify-center gap-3 text-lg transition-all transform hover:-translate-y-1 active:scale-95 active:translate-y-0">
                    <Download className="w-6 h-6" /> Download Excel
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

export default PdfToExcel;
