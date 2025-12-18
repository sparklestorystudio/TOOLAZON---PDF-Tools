import React from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { NavProps } from '../types';

const Hero: React.FC<NavProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  const scrollToTools = () => {
    const element = document.getElementById('all-tools');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-[#fcf8f5] dark:bg-gray-900/40 pt-20 pb-32 text-center px-4 relative overflow-hidden transition-colors duration-300">
        {/* Background decorative elements */}
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:24px_24px]"></div>
        </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-[3.5rem] font-black text-gray-800 dark:text-gray-100 mb-8 leading-tight tracking-tight drop-shadow-sm">
          {t('hero.title')}
        </h1>
        <p className="text-lg md:text-2xl text-gray-600 dark:text-gray-400 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
          {t('hero.subtitle')}
        </p>
        
        {/* CTA Container - Vertical Layout */}
        <div className="flex flex-col items-center justify-center gap-4">
          <button 
            onClick={() => onNavigate('pdf-editor')} 
            className="min-w-[280px] bg-brand-500 hover:bg-brand-600 text-white font-bold py-5 px-12 rounded-2xl text-xl shadow-xl shadow-brand-200/50 dark:shadow-brand-900/20 transition-all hover:-translate-y-1 hover:shadow-2xl flex items-center justify-center group ring-offset-2 focus:ring-4 ring-brand-200 dark:ring-brand-800 z-10 relative overflow-hidden"
          >
            <span className="relative z-10">{t('hero.cta_main')}</span> 
            <span className="opacity-60 mx-2 font-light relative z-10">|</span> 
            <span className="text-brand-100 dark:text-brand-200 font-normal relative z-10">{t('hero.cta_free')}</span>
            <ChevronDown className="w-5 h-5 ml-3 -rotate-90 group-hover:translate-x-1 transition-transform relative z-10" />
          </button>
          
          <button 
            onClick={scrollToTools}
            className="text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 font-medium text-sm flex items-center justify-center px-4 py-2 rounded-full hover:bg-white/50 dark:hover:bg-gray-800 transition-all group mt-1"
          >
            {t('hero.cta_secondary')}
            <ArrowRight className="w-3 h-3 ml-1.5 group-hover:translate-x-1 transition-transform opacity-70" />
          </button>
        </div>
      </div>
      
      {/* Visual bottom wave simulation */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
        <svg className="relative block w-[calc(100%+1.3px)] h-[60px] md:h-[100px] text-white dark:text-gray-950" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M985.66,92.83C906.67,72,823.78,31,432.84,37.88c-474,8.48-677,103.61-717,117.12V320H1580V104C1523.5,99.5,1385.5,134,985.66,92.83Z" fill="currentColor" transform="translate(-200 -20)"></path>
        </svg>
      </div>
    </section>
  );
};

export default Hero;