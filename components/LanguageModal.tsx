import React from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LanguageModal: React.FC<LanguageModalProps> = ({ isOpen, onClose }) => {
  const { availableLanguages, setLanguage, t } = useLanguage();

  if (!isOpen) return null;

  const handleSelect = (code: any) => {
    setLanguage(code);
    onClose();
  };

  // Split languages into two columns
  const midPoint = Math.ceil(availableLanguages.length / 2);
  const col1 = availableLanguages.slice(0, midPoint);
  const col2 = availableLanguages.slice(midPoint);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 sm:pt-32 px-4">
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl text-gray-700 font-light">Select language</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3">
            <div className="space-y-3">
              {col1.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className="block w-full text-left text-[15px] text-brand-500 hover:underline hover:text-brand-600 transition-colors py-0.5"
                >
                  {lang.name}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {col2.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className="block w-full text-left text-[15px] text-brand-500 hover:underline hover:text-brand-600 transition-colors py-0.5"
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageModal;
