import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ToolsGrid from './components/ToolsGrid';
import Guides from './components/Guides';
import Footer from './components/Footer';
import AiAssistant from './components/AiAssistant';
import ExtractPages from './components/tools/ExtractPages';
import CompressPdf from './components/tools/CompressPdf';
import MergePdf from './components/tools/MergePdf';
import DeletePages from './components/tools/DeletePages';
import CropPdf from './components/tools/CropPdf';
import PdfEditor from './components/tools/PdfEditor';
import PdfToWord from './components/tools/PdfToWord';
import SplitPdf from './components/tools/SplitPdf';
import EditMetadata from './components/tools/EditMetadata';
import OrganizePdf from './components/tools/OrganizePdf';
import HeaderFooterPdf from './components/tools/HeaderFooterPdf';
import ExcelToPdf from './components/tools/ExcelToPdf';
import PdfToJpg from './components/tools/PdfToJpg';
import PdfToExcel from './components/tools/PdfToExcel';
import OcrPdf from './components/tools/OcrPdf';
import CreateForms from './components/tools/CreateForms';
import UnlockPdf from './components/tools/UnlockPdf';
import ProtectPdf from './components/tools/ProtectPdf';
import TermsOfUse from './components/TermsOfUse';
import PrivacyPolicy from './components/PrivacyPolicy';
import CookiesPolicy from './components/CookiesPolicy';
import About from './components/About';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { View } from './types';
import { ArrowUp } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="min-h-screen bg-white flex flex-col relative">
          <Navbar onNavigate={handleNavigate} />
          
          <main className="flex-grow">
            {currentView === 'home' ? (
              <>
                <Hero onNavigate={handleNavigate} />
                <ToolsGrid onNavigate={handleNavigate} />
                <Guides />
              </>
            ) : currentView === 'extract-pages' ? (
              <ExtractPages />
            ) : currentView === 'compress-pdf' ? (
              <CompressPdf />
            ) : currentView === 'merge-pdf' ? (
              <MergePdf />
            ) : currentView === 'delete-pages' ? (
              <DeletePages />
            ) : currentView === 'crop-pdf' ? (
              <CropPdf />
            ) : currentView === 'pdf-editor' ? (
              <PdfEditor />
            ) : currentView === 'pdf-to-word' ? (
              <PdfToWord />
            ) : currentView === 'split-pdf' ? (
              <SplitPdf />
            ) : currentView === 'edit-metadata' ? (
              <EditMetadata />
            ) : currentView === 'organize-pdf' ? (
              <OrganizePdf />
            ) : currentView === 'header-footer' ? (
              <HeaderFooterPdf />
            ) : currentView === 'excel-to-pdf' ? (
              <ExcelToPdf />
            ) : currentView === 'pdf-to-jpg' ? (
              <PdfToJpg />
            ) : currentView === 'pdf-to-excel' ? (
              <PdfToExcel />
            ) : currentView === 'ocr-pdf' ? (
              <OcrPdf />
            ) : currentView === 'create-forms' ? (
              <CreateForms />
            ) : currentView === 'unlock-pdf' ? (
              <UnlockPdf />
            ) : currentView === 'protect-pdf' ? (
              <ProtectPdf />
            ) : currentView === 'terms' ? (
              <TermsOfUse onNavigate={handleNavigate} />
            ) : currentView === 'privacy' ? (
              <PrivacyPolicy onNavigate={handleNavigate} />
            ) : currentView === 'cookies' ? (
              <CookiesPolicy onNavigate={handleNavigate} />
            ) : currentView === 'about' ? (
              <About onNavigate={handleNavigate} />
            ) : null}
          </main>
          
          <Footer onNavigate={handleNavigate} />
          <AiAssistant />

          {/* Scroll to Top Button */}
          <button
            onClick={scrollToTop}
            className={`
              fixed bottom-24 right-4 md:right-6 z-40 p-3 rounded-full bg-white text-gray-600 shadow-lg border border-gray-200 
              hover:bg-gray-50 hover:text-brand-600 transition-all duration-300 transform
              ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}
            `}
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;