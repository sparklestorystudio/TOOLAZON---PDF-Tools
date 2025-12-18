
import React, { useState, useRef } from 'react';
import { FileUp, ChevronDown, Check, Loader2, Download, RefreshCw, FileSpreadsheet, Settings, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useLanguage } from '../../contexts/LanguageContext';
import ProcessingOverlay from '../ProcessingOverlay';

const ExcelToPdf: React.FC = () => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'options' | 'success'>('upload');
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setProcessing(true);
      
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        
        // Handle potential default export structure
        const lib = (XLSX as any).default || XLSX;

        if (!lib.read) {
             throw new Error("XLSX library not loaded correctly. Please reload the page.");
        }

        const workbook = lib.read(arrayBuffer, { type: 'array' });
        setSheetNames(workbook.SheetNames);
        setStep('options');
      } catch (error: any) {
        console.error("Error reading Excel file", error);
        let msg = "Failed to read Excel file. Please ensure it is a valid .xlsx or .xls file.";
        
        if (error.message && (error.message.includes("Password") || error.message.includes("password") || error.message.includes("encrypted"))) {
            msg = "This file is password-protected. Please remove the password protection and try again.";
        }
        
        alert(msg);
        setFile(null);
      } finally {
        setProcessing(false);
      }
    }
  };

  const convert = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const lib = (XLSX as any).default || XLSX;
      const workbook = lib.read(arrayBuffer, { type: 'array' });
      
      // Initialize PDF (A4 Size)
      const doc = new jsPDF({ 
          orientation: orientation,
          unit: 'pt',
          format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20; 
      const contentWidth = pageWidth - (margin * 2);
      const contentHeight = pageHeight - (margin * 2);

      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '0';
      container.style.left = '-9999px'; 
      container.style.width = 'fit-content'; 
      container.style.backgroundColor = '#ffffff';
      container.style.padding = '0';
      container.style.margin = '0';
      document.body.appendChild(container);

      let totalPagesAdded = 0;

      for (let i = 0; i < workbook.SheetNames.length; i++) {
          const sheetName = workbook.SheetNames[i];
          const ws = workbook.Sheets[sheetName];

          if (!ws['!ref']) continue;

          const html = lib.utils.sheet_to_html(ws, { id: `table-${i}` });

          const css = `
            <style>
              table { 
                  border-collapse: collapse; 
                  font-family: 'Calibri', 'Arial', sans-serif; 
                  font-size: 11pt; 
                  background-color: white;
                  width: auto;
                  margin: 0;
              }
              td, th { 
                  border: 1px solid #d0d7e5; 
                  padding: 3px 5px; 
                  white-space: pre-wrap;
                  color: #000;
                  min-width: 20px;
              }
            </style>
          `;

          container.innerHTML = css + html;
          const table = container.querySelector('table');
          if (!table) continue;

          const tableRect = table.getBoundingClientRect();
          const tableWidthPx = tableRect.width;
          const pdfContentWidthPx = contentWidth * (96 / 72); 

          let scale = 1.0;
          if (tableWidthPx > pdfContentWidthPx) {
              scale = pdfContentWidthPx / tableWidthPx;
          }

          const maxPageHeightPx = (contentHeight * (96 / 72)) / scale;
          const rows = Array.from(table.querySelectorAll('tr'));
          if (rows.length === 0) continue;

          let currentRow = 0;
          while (currentRow < rows.length) {
              const pageRows: HTMLElement[] = [];
              let currentBatchHeight = 0;

              pageRows.push(rows[currentRow]);
              currentBatchHeight += rows[currentRow].getBoundingClientRect().height;
              currentRow++;

              while (currentRow < rows.length) {
                  const rowHeight = rows[currentRow].getBoundingClientRect().height;
                  if (currentBatchHeight + rowHeight > maxPageHeightPx) {
                      break; 
                  }
                  pageRows.push(rows[currentRow]);
                  currentBatchHeight += rowHeight;
                  currentRow++;
              }

              const pageContainer = document.createElement('div');
              pageContainer.innerHTML = css;
              const pageTable = table.cloneNode(false) as HTMLElement; 
              const pageTbody = document.createElement('tbody');
              pageTable.appendChild(pageTbody);
              
              pageRows.forEach(r => {
                  pageTbody.appendChild(r.cloneNode(true));
              });

              pageContainer.appendChild(pageTable);
              
              container.innerHTML = ''; 
              container.appendChild(pageContainer);

              const canvas = await html2canvas(pageContainer, {
                  scale: 2, 
                  backgroundColor: '#ffffff',
                  logging: false,
                  width: tableWidthPx, 
                  windowWidth: tableWidthPx + 100
              });

              if (totalPagesAdded > 0) doc.addPage();
              
              const imgData = canvas.toDataURL('image/jpeg', 0.95);
              let finalPdfWidth = tableWidthPx * (72/96); 
              if (finalPdfWidth > contentWidth) finalPdfWidth = contentWidth;
              
              const finalPdfHeight = finalPdfWidth * (canvas.height / canvas.width);

              doc.addImage(imgData, 'JPEG', margin, margin, finalPdfWidth, finalPdfHeight);
              totalPagesAdded++;
              
              setProgress(Math.round((i / workbook.SheetNames.length) * 100) + Math.round((currentRow / rows.length) * (100 / workbook.SheetNames.length)));
          }
      }

      document.body.removeChild(container);

      if (totalPagesAdded === 0) {
          alert("No printable content found in Excel file.");
          setProcessing(false);
          return;
      }

      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setResultUrl(url);
      setStep('success');

    } catch (e) {
      console.error(e);
      alert("Error converting Excel to PDF: " + e);
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setStep('upload');
    setResultUrl(null);
    setSheetNames([]);
    setOrientation('portrait');
    setProgress(0);
  };

  if (step === 'upload') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 py-20 px-4 font-sans transition-colors duration-300">
        <h1 className="text-4xl font-black text-gray-800 dark:text-gray-100 mb-3 text-center tracking-tight leading-tight">{t('tool.excel-pdf.title', 'Excel to PDF')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 text-center font-medium max-w-xl">{t('tool.excel-pdf.desc', 'Convert Excel spreadsheets to PDF')}</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-7 rounded-2xl shadow-xl shadow-brand-200 dark:shadow-brand-900/20 transition-all flex items-center justify-center gap-4 text-2xl group transform hover:-translate-y-1"
           >
             <FileUp className="w-9 h-9 group-hover:-translate-y-1 transition-transform" />
             {processing ? 'Reading File...' : 'Upload Excel file'}
           </button>
           <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls, .csv" className="hidden" />
           <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4 font-bold uppercase tracking-widest">
             Or drag and drop file here
           </p>
        </div>

        <div className="mt-20 max-w-2xl text-center">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">How to convert Excel to PDF</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                Upload your Excel workbook. We will convert each sheet into pages in your PDF document, preserving layout and merged cells.
            </p>
        </div>
      </div>
    );
  }

  if (step === 'options') {
      return (
          <div className="min-h-[80vh] bg-gray-50 dark:bg-gray-950 flex flex-col items-center pt-12 px-4 pb-24 font-sans transition-colors duration-300">
              {processing && <ProcessingOverlay status="Converting spreadsheet to PDF..." progress={progress} />}
              
              <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-2 tracking-tight leading-tight">{t('tool.excel-pdf.title', 'Excel to PDF')}</h2>
              <div className="mb-8 text-sm text-gray-500 dark:text-gray-400 font-medium">Selected: {file?.name}</div>

              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 max-w-2xl w-full animate-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Settings className="w-3.5 h-3.5" /> Conversion Options
                  </h3>

                  <div className="mb-8">
                      <span className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Found Sheets</span>
                      <div className="flex flex-wrap gap-2">
                          {sheetNames.map(name => (
                              <span key={name} className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                  <FileSpreadsheet className="w-3 h-3" /> {name}
                              </span>
                          ))}
                      </div>
                  </div>
                  
                  <div className="mb-10">
                      <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Page Orientation</label>
                      <div className="flex bg-gray-50 dark:bg-gray-800 p-1.5 rounded-2xl">
                          <button 
                              onClick={() => setOrientation('portrait')}
                              className={`flex-1 py-4 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${orientation === 'portrait' ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-xl' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                          >
                              Portrait
                          </button>
                          <button 
                              onClick={() => setOrientation('landscape')}
                              className={`flex-1 py-4 rounded-xl transition-all font-black text-xs uppercase tracking-widest ${orientation === 'landscape' ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-xl' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                          >
                              Landscape
                          </button>
                      </div>
                  </div>
                  
                  <div className="p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl flex items-start gap-4 mb-10">
                     <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                     <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed font-bold">
                         Pro Tip: We automatically scale sheets to fit the page width and handle multi-page row splitting for you.
                     </p>
                  </div>

                  <button 
                      onClick={convert}
                      disabled={processing}
                      className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-brand-100 dark:shadow-brand-900/20 flex items-center justify-center gap-3 text-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
                  >
                      {processing ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCw className="w-6 h-6" />}
                      {processing ? `Converting... ${progress}%` : 'Generate PDF'}
                  </button>
              </div>
          </div>
      );
  }

  if (step === 'success' && resultUrl) {
    return (
      <div className="min-h-[80vh] bg-gray-50 dark:bg-gray-950 flex flex-col items-center pt-24 px-4 font-sans transition-colors duration-300">
        <h2 className="text-3xl font-black text-gray-800 dark:text-gray-100 mb-8 tracking-tight text-center">Your document is ready</h2>
        <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 max-w-2xl w-full text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner animate-in zoom-in duration-700">
                <Check className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-4 tracking-tight">Conversion Complete</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg font-medium leading-relaxed">Your Excel spreadsheet has been converted and paginated successfully.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={resultUrl} download={`${file?.name.replace(/\.xlsx?$/, '')}.pdf`} className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-brand-100 dark:shadow-brand-900/20 flex items-center justify-center gap-3 text-lg transition-all transform hover:-translate-y-1 active:scale-95 active:translate-y-0">
                    <Download className="w-6 h-6" /> Download PDF
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

export default ExcelToPdf;
