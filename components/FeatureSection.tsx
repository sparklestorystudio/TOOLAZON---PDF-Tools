import React from 'react';
import { Cloud, Monitor, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const FeatureSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 bg-gray-50 text-center px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('feature.title')}</h2>
        <p className="text-gray-500 mb-12">{t('feature.subtitle')}</p>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Web Card */}
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6">
              <Cloud className="w-10 h-10 text-brand-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t('feature.web.title')}</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              {t('feature.web.desc')}
            </p>
            <a href="#" className="mt-auto text-brand-500 hover:text-brand-600 font-medium flex items-center group">
              {t('feature.web.cta')}
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Desktop Card */}
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <Monitor className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t('feature.desktop.title')}</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              {t('feature.desktop.desc')}
            </p>
            <a href="#" className="mt-auto text-blue-500 hover:text-blue-600 font-medium flex items-center group">
              {t('feature.desktop.cta')}
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
