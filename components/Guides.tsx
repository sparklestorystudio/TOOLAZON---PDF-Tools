import React from 'react';
import { ArrowRight } from 'lucide-react';
import { GUIDES } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

const Guides: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 relative overflow-hidden bg-white">
      {/* Abstract Background Blobs - positioned absolutely */}
      <div className="absolute top-0 right-0 -mr-64 w-[600px] h-[600px] bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-64 w-[600px] h-[600px] bg-brand-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>

      <div className="max-w-3xl mx-auto px-4 relative z-10">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-16">{t('guides.title')}</h2>

        <div className="space-y-16">
          {GUIDES.map((guide, index) => {
             // Dynamic translation keys based on guide index
             const title = t(`guide.${index}.title`, guide.title);
             const description = guide.description ? t(`guide.${index}.desc`, guide.description) : null;
             const linkText = t(`guide.${index}.link`, guide.linkText);

             return (
              <div key={index} className="bg-white/50 backdrop-blur-sm rounded-xl p-6 md:p-0">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
                {description && (
                    <h4 className="text-md font-bold text-gray-700 mb-4">{description}</h4>
                )}
                {!description && <div className="mb-4"></div>}
                
                <ul className="space-y-3 mb-6">
                  {guide.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                        {stepIndex + 1}
                      </span>
                      {/* Fetch step translation dynamically */}
                      <span className="text-gray-600 text-sm leading-relaxed">
                        {t(`guide.${index}.step.${stepIndex}`, step.text)}
                      </span>
                    </li>
                  ))}
                </ul>
                <a href="#" className="text-brand-500 hover:text-brand-600 font-medium text-sm flex items-center inline-block group">
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
