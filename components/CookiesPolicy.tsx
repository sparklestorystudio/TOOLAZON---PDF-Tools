import React from 'react';
import { ArrowLeft, Cookie } from 'lucide-react';

interface CookiesPolicyProps {
  onNavigate: (view: any) => void;
}

const CookiesPolicy: React.FC<CookiesPolicyProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-6 px-4 md:px-8">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button 
            onClick={() => onNavigate('home')}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Cookie className="w-6 h-6 text-brand-500" />
            Cookies Policy
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="prose prose-blue max-w-none text-gray-600">
            <p className="text-sm text-gray-400 mb-8">Last updated: December 04, 2025</p>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">1. What Are Cookies?</h2>
              <p className="mb-4">
                Cookies are small pieces of text sent to your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third-party to recognize you and make your next visit easier and the Service more useful to you.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">2. How Toolazon Uses Cookies</h2>
              <p className="mb-4">
                When you use and access the Service, we may place a number of cookies files in your web browser. We use cookies for the following purposes:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>
                    <strong>Essential Cookies:</strong> We use these cookies to enable certain functions of the Service, such as remembering your preferred language or theme color selection. These are necessary for the website to function properly.
                </li>
                <li>
                    <strong>Analytics Cookies:</strong> We use these cookies to track information about how the Service is used so that we can make improvements. We may use third-party analytics providers (like Google Analytics) to help us understand user behavior.
                </li>
                <li>
                    <strong>Preferences:</strong> These cookies allow our website to remember choices you make (such as your language or the region you are in) and provide enhanced, more personal features.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">3. Third-Party Cookies</h2>
              <p className="mb-4">
                In addition to our own cookies, we may also use various third-parties cookies to report usage statistics of the Service and improve marketing efforts.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">4. Your Choices Regarding Cookies</h2>
              <p className="mb-4">
                If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your web browser.
              </p>
              <p className="mb-4">
                Please note, however, that if you delete cookies or refuse to accept them, you might not be able to use all of the features we offer, you may not be able to store your preferences, and some of our pages might not display properly.
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                  <li>For the Chrome web browser, please visit this page from Google: <a href="https://support.google.com/accounts/answer/32050" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">Clear, enable, and manage cookies in Chrome</a></li>
                  <li>For the Internet Explorer web browser, please visit this page from Microsoft: <a href="http://support.microsoft.com/kb/278835" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">How to delete cookie files in Internet Explorer</a></li>
                  <li>For the Firefox web browser, please visit this page from Mozilla: <a href="https://support.mozilla.org/en-US/kb/delete-cookies-remove-info-websites-stored" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">Delete cookies to remove the information websites have stored on your computer</a></li>
                  <li>For the Safari web browser, please visit this page from Apple: <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">Manage cookies and website data in Safari on Mac</a></li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">5. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about our use of cookies, please contact us.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiesPolicy;