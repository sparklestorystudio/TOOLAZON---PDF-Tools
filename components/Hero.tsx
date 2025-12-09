import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { NavProps } from '../types';

const Hero: React.FC<NavProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  return (
    <section className="bg-[#fcf8f5] pt-16 pb-24 text-center px-4 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]"></div>
        </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-[2.6rem] font-bold text-gray-800 mb-4 leading-tight">
          {t('hero.title')}
        </h1>
        <p className="text-lg md:text-xl text-brand-500 font-medium mb-10">
          {t('hero.subtitle')}
        </p>
        
        <div className="flex flex-col items-center">
          <button 
            onClick={() => onNavigate('pdf-editor')} 
            className="bg-brand-500 hover:bg-brand-600 text-white font-medium py-4 px-8 rounded-md text-lg shadow-lg shadow-brand-200 transition-transform hover:-translate-y-1 mb-4 flex items-center"
          >
            {t('hero.cta_main')} <span className="opacity-75 mx-2">-</span> <span className="text-brand-100">{t('hero.cta_free')}</span>
            <ChevronDown className="w-5 h-5 ml-2 rotate-[-90deg]" />
          </button>
          
          <button className="text-gray-500 hover:text-gray-700 text-sm flex items-center mt-2 group">
            {t('hero.cta_secondary')}
            <ChevronDown className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
      
      {/* Visual bottom wave simulation */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
        <svg className="relative block w-[calc(100%+1.3px)] h-[50px] md:h-[80px] text-white" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M985.66,92.83C906.67,72,823.78,31,432.84,37.88c-474,8.48-677,103.61-717,117.12V320H1580V104C1523.5,99.5,1385.5,134,985.66,92.83Z" fill="#ffffff" fillOpacity="1" transform="translate(-200 -20)"></path>
        </svg>
      </div>
    </section>
  );
};

export default Hero;