
import React, { useState, useRef } from 'react';
import { FileUp, ChevronDown, Check, Loader2, Download, RefreshCw, FileSpreadsheet, Settings, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useLanguage } from '../../contexts/LanguageContext';

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
      // A4 Size in pts: 595.28 x 841.89
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

      // Create a visible container off-screen for rendering
      // We need it visible for html2canvas to render correctly, but we hide it from user view
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '0';
      container.style.left = '-9999px'; // Move off-screen
      container.style.width = 'fit-content'; // Allow table to take natural width
      container.style.backgroundColor = '#ffffff';
      container.style.padding = '0';
      container.style.margin = '0';
      document.body.appendChild(container);

      let totalPagesAdded = 0;

      for (let i = 0; i < workbook.SheetNames.length; i++) {
          const sheetName = workbook.SheetNames[i];
          const ws = workbook.Sheets[sheetName];

          // Check if sheet is empty
          if (!ws['!ref']) continue;

          // Convert sheet to HTML table
          const html = lib.utils.sheet_to_html(ws, { id: `table-${i}` });

          // Excel-like styling
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

          // Inject HTML into container to measure
          container.innerHTML = css + html;
          const table = container.querySelector('table');
          if (!table) continue;

          // 1. Calculate Scale Factor
          // We assume 1px on screen ~ 0.75pt in PDF, but simplify by using ratios.
          // html2canvas renders at browser PPI (usually 96).
          // We need to fit the table width (px) into contentWidth (pt).
          
          const tableRect = table.getBoundingClientRect();
          const tableWidthPx = tableRect.width;
          
          // Determine scale to fit width
          // If table is smaller than page, we can keep it 1:1 or scale up slightly? 
          // Usually better to just scale down if too big.
          // PDF unit is pt. 1px = 0.75pt approx.
          // Let's convert PDF content width to pixels for comparison (approx)
          const pdfContentWidthPx = contentWidth * (96 / 72); 

          let scale = 1.0;
          if (tableWidthPx > pdfContentWidthPx) {
              scale = pdfContentWidthPx / tableWidthPx;
          }

          // Calculate max height per page in Pixels (taking scale into account)
          // Available height (pt) -> convert to source pixels
          // sourcePixels = availablePt * (96/72) / scale
          const maxPageHeightPx = (contentHeight * (96 / 72)) / scale;

          // 2. Pagination Loop
          const rows = Array.from(table.querySelectorAll('tr'));
          if (rows.length === 0) continue;

          // We'll process rows in batches that fit on a page
          // We need to clone the table structure for each page
          const tbody = table.querySelector('tbody') || table;
          
          let currentRow = 0;
          while (currentRow < rows.length) {
              // Start a new page batch
              const pageRows: HTMLElement[] = [];
              let currentBatchHeight = 0;

              // Always add at least one row to avoid infinite loop
              pageRows.push(rows[currentRow]);
              currentBatchHeight += rows[currentRow].getBoundingClientRect().height;
              currentRow++;

              // Add more rows until full
              while (currentRow < rows.length) {
                  const rowHeight = rows[currentRow].getBoundingClientRect().height;
                  if (currentBatchHeight + rowHeight > maxPageHeightPx) {
                      break; // Page full
                  }
                  pageRows.push(rows[currentRow]);
                  currentBatchHeight += rowHeight;
                  currentRow++;
              }

              // Render this batch
              // Create a temporary table just for this page
              const pageContainer = document.createElement('div');
              pageContainer.innerHTML = css;
              const pageTable = table.cloneNode(false) as HTMLElement; // Clone table tag
              const pageTbody = document.createElement('tbody');
              pageTable.appendChild(pageTbody);
              
              pageRows.forEach(r => {
                  // Must clone deep to keep cells
                  pageTbody.appendChild(r.cloneNode(true));
              });

              pageContainer.appendChild(pageTable);
              
              // We render this temp container which is detached? No, html2canvas needs it attached usually for fonts
              // Let's attach it to our main hidden container
              container.innerHTML = ''; // Clear prev
              container.appendChild(pageContainer);

              // Capture
              const canvas = await html2canvas(pageContainer, {
                  scale: 2, // High res capture
                  backgroundColor: '#ffffff',
                  logging: false,
                  width: tableWidthPx, // Force capture full width even if scaled
                  windowWidth: tableWidthPx + 100
              });

              // Add to PDF
              if (totalPagesAdded > 0) doc.addPage();
              
              const imgData = canvas.toDataURL('image/jpeg', 0.95);
              // Calculate PDF dimensions
              // We render at `scale` relative to content width
              const imgPdfWidth = tableWidthPx * scale * (72/96); // Convert back to pts roughly
              const imgPdfHeight = (canvas.height / 2) * (imgPdfWidth / (canvas.width / 2)); 

              // Note: canvas.width is width * 2 because of scale: 2
              // Simply: Aspect Ratio = canvas.height / canvas.width
              // Target Width = contentWidth (if scaled to fit) or less
              // Actually we already calculated `scale` for fitting.
              
              // Let's use the fit logic:
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 py-20 px-4 font-sans">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">{t('tool.excel-pdf.title', 'Excel to PDF')}</h1>
        <p className="text-gray-500 text-lg mb-10 text-center">{t('tool.excel-pdf.desc', 'Convert Excel spreadsheets to PDF')}</p>
        
        <div className="w-full max-w-xl">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-3 text-xl group"
           >
             <FileUp className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />
             {processing ? 'Reading File...' : 'Upload Excel file'}
             {!processing && <ChevronDown className="w-5 h-5 ml-2" />}
           </button>
           <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls, .csv" className="hidden" />
           <p className="text-xs text-center text-gray-400 mt-4">
             Or drag and drop file here
           </p>
        </div>

        <div className="mt-16 max-w-2xl text-center">
            <h3 className="font-bold text-gray-700 mb-2">How to convert Excel to PDF</h3>
            <p className="text-sm text-gray-500">
                Upload your Excel workbook. We will convert each sheet into pages in your PDF document, preserving layout and merged cells.
            </p>
        </div>
      </div>
    );
  }

  if (step === 'options') {
      return (
          <div className="min-h-[80vh] bg-gray-50 flex flex-col items-center pt-12 px-4 font-sans">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('tool.excel-pdf.title', 'Excel to PDF')}</h2>
              <div className="mb-8 text-sm text-gray-400">Selected: {file?.name}</div>

              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-2xl w-full">
                  <h3 className="text-lg font-bold text-gray-700 mb-6 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-brand-500" />
                      Conversion Options
                  </h3>

                  <div className="mb-6">
                      <span className="block text-sm font-medium text-gray-700 mb-2">Found Sheets:</span>
                      <div className="flex flex-wrap gap-2">
                          {sheetNames.map(name => (
                              <span key={name} className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-medium flex items-center gap-1">
                                  <FileSpreadsheet className="w-3 h-3" /> {name}
                              </span>
                          ))}
                      </div>
                  </div>
                  
                  <div className="mb-8">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Page Orientation</label>
                      <div className="flex gap-4">
                          <button 
                              onClick={() => setOrientation('portrait')}
                              className={`flex-1 py-3 px-4 rounded border-2 transition-all ${orientation === 'portrait' ? 'border-brand-500 bg-brand-50 text-brand-700 font-bold' : 'border-gray-200 text-gray-600 hover:border-brand-200'}`}
                          >
                              Portrait
                          </button>
                          <button 
                              onClick={() => setOrientation('landscape')}
                              className={`flex-1 py-3 px-4 rounded border-2 transition-all ${orientation === 'landscape' ? 'border-brand-500 bg-brand-50 text-brand-700 font-bold' : 'border-gray-200 text-gray-600 hover:border-brand-200'}`}
                          >
                              Landscape
                          </button>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-6 p-3 bg-blue-50 text-blue-800 rounded text-xs">
                     <AlertCircle className="w-4 h-4 flex-shrink-0" />
                     <span>For best results, large spreadsheets will be automatically scaled to fit the page width.</span>
                  </div>

                  <button 
                      onClick={convert}
                      disabled={processing}
                      className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-lg shadow-md flex items-center justify-center gap-2 text-lg transition-colors disabled:opacity-70"
                  >
                      {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                      {processing ? `Converting... ${progress > 0 ? progress + '%' : ''}` : 'Convert to PDF'}
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
            <p className="text-gray-500 mb-8">Excel converted to PDF successfully.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={resultUrl} download={`${file?.name.replace(/\.xlsx?$/, '')}.pdf`} className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-8 rounded-md shadow-md flex items-center justify-center gap-2 transition-colors">
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

export default ExcelToPdf;
