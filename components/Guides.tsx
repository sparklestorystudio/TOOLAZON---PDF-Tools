import React from 'react';
import { ArrowRight } from 'lucide-react';
import { GUIDES } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

const Guides: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 relative overflow-hidden bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Abstract Background Blobs - positioned absolutely */}
      <div className="absolute top-0 right-0 -mr-64 w-[600px] h-[600px] bg-blue-100 dark:bg-blue-900/10 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-30 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-64 w-[600px] h-[600px] bg-brand-100 dark:bg-brand-900/10 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-30 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-50 dark:bg-orange-900/5 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-30 pointer-events-none"></div>

      <div className="max-w-3xl mx-auto px-4 relative z-10">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 text-center mb-16">{t('guides.title')}</h2>

        <div className="space-y-16">
          {GUIDES.map((guide, index) => {
             // Dynamic translation keys based on guide index
             const title = t(`guide.${index}.title`, guide.title);
             const description = guide.description ? t(`guide.${index}.desc`, guide.description) : null;
             const linkText = t(`guide.${index}.link`, guide.linkText);

             return (
              <div key={index} className="bg-white/50 dark:bg-gray-900/40 backdrop-blur-sm rounded-xl p-6 md:p-0 transition-colors">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">{title}</h3>
                {description && (
                    <h4 className="text-md font-bold text-gray-700 dark:text-gray-300 mb-4">{description}</h4>
                )}
                {!description && <div className="mb-4"></div>}
                
                <ul className="space-y-3 mb-6">
                  {guide.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                        {stepIndex + 1}
                      </span>
                      {/* Fetch step translation dynamically */}
                      <span className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        {t(`guide.${index}.step.${stepIndex}`, step.text)}
                      </span>
                    </li>
                  ))}
                </ul>
                <a href="#" className="text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 font-medium text-sm flex items-center inline-block group transition-colors">
                  {linkText}
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Guides;