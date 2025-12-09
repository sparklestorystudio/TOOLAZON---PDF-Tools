import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { NavProps } from '../types';

const Footer: React.FC<NavProps> = ({ onNavigate }) => {
  const { t, availableLanguages, setLanguage } = useLanguage();

  const handleLanguageClick = (e: React.MouseEvent, code: any) => {
    e.preventDefault();
    setLanguage(code);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#fcf8f5] py-16 px-4 border-t border-gray-100">
      <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h4 className="font-bold text-gray-800 mb-4 text-sm tracking-wider uppercase">Legal</h4>
          <ul className="space-y-2 text-xs text-gray-600">
            <li>
              <button onClick={() => onNavigate('terms')} className="hover:text-brand-600 text-left">
                Terms of Use
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('privacy')} className="hover:text-brand-600 text-left">
                Privacy Policy
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('cookies')} className="hover:text-brand-600 text-left">
                Cookies
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('about')} className="hover:text-brand-600 text-left">
                About
              </button>
            </li>
          </ul>
          <div className="mt-8 text-xs text-gray-400">
            <p>© Toolazon 2013-present.</p>
          </div>
        </div>

        <div>
           <h4 className="font-bold text-gray-800 mb-4 text-sm tracking-wider uppercase">{t('footer.tools')}</h4>
           <ul className="space-y-1.5 text-xs text-gray-600">
             <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} className="hover:text-brand-600">{t('tool.page-numbers.title', 'Add PDF Page Numbers')}</a></li>
             <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} className="hover:text-brand-600">{t('tool.alternate.title', 'Alternate & Mix PDF')}</a></li>
             <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} className="hover:text-brand-600">{t('tool.bates.title', 'Bates Numbering PDF')}</a></li>
             <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('compress-pdf'); }} className="hover:text-brand-600">{t('tool.compress.title', 'Compress PDF')}</a></li>
             <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} className="hover:text-brand-600">{t('tool.edit-metadata.title', 'Edit PDF Metadata')}</a></li>
             <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('extract-pages'); }} className="hover:text-brand-600">{t('tool.extract.title', 'Extract Pages PDF')}</a></li>
             <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} className="hover:text-brand-600">{t('tool.fill-sign.title', 'Fill & Sign PDF')}</a></li>
             <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('merge-pdf'); }} className="hover:text-brand-600">{t('tool.merge.title', 'Merge PDF')}</a></li>
             <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} className="hover:text-brand-600">{t('tool.ocr.title', 'OCR PDF')}</a></li>
             <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('pdf-editor'); }} className="hover:text-brand-600">{t('tool.pdf-editor.title', 'PDF Editor')}</a></li>
             <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} className="hover:text-brand-600">{t('tool.pdf-excel.title', 'PDF to Excel')}</a></li>
             <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('pdf-to-word'); }} className="hover:text-brand-600">{t('tool.pdf-word.title', 'PDF to Word')}</a></li>
             <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} className="hover:text-brand-600">{t('tool.protect.title', 'Protect PDF')}</a></li>
             <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('split-pdf'); }} className="hover:text-brand-600">{t('tool.split.title', 'Split PDF')}</a></li>
           </ul>
        </div>

        <div>
            {/* Empty column for spacing/balance or additional tools overflow in real app */}
            <h4 className="font-bold text-gray-800 mb-4 text-sm tracking-wider uppercase opacity-0">{t('footer.more_tools')}</h4>
            <ul className="space-y-1.5 text-xs text-gray-600">
                <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} className="hover:text-brand-600">{t('tool.resize.title', 'Resize PDF')}</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} className="hover:text-brand-600">{t('tool.rotate.title', 'Rotate PDF')}</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('split-pdf'); }} className="hover:text-brand-600">{t('tool.split-pages.title', 'Split PDF by pages')}</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} className="hover:text-brand-600">{t('tool.split-size.title', 'Split PDF by size')}</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} className="hover:text-brand-600">{t('tool.unlock.title', 'Unlock PDF')}</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} className="hover:text-brand-600">{t('tool.watermark.title', 'Watermark PDF')}</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('home'); }} className="hover:text-brand-600">{t('tool.word-pdf.title', 'Word to PDF')}</a></li>
            </ul>
        </div>

        <div>
          <h4 className="font-bold text-gray-800 mb-4 text-sm tracking-wider uppercase">{t('footer.languages')}</h4>
          <ul className="space-y-2 text-xs text-gray-600">
            {availableLanguages.slice(0, 10).map((lang) => (
               <li key={lang.code}>
                 <a 
                   href="#" 
                   onClick={(e) => handleLanguageClick(e, lang.code)}
                   className="hover:text-brand-600"
                 >
                   {lang.name}
                 </a>
               </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;