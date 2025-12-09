import React from 'react';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react';

interface PrivacyPolicyProps {
  onNavigate: (view: any) => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onNavigate }) => {
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
            <ShieldCheck className="w-6 h-6 text-brand-500" />
            Privacy Policy
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="prose prose-blue max-w-none text-gray-600">
            <p className="text-sm text-gray-400 mb-8">Last updated: December 04, 2025</p>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">1. Introduction</h2>
              <p className="mb-4">
                At Toolazon, we prioritize the privacy and security of your data. This Privacy Policy outlines how we collect, use, and protect your information when you use our online PDF tools. By using our Service, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">2. Files and Data Security</h2>
              <p className="mb-4">
                The core functionality of Toolazon involves processing files you upload. We adhere to strict security protocols regarding your files:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li className="flex items-start">
                  <span className="font-semibold text-gray-700 mr-2">Encryption:</span>
                  Files are transferred over a secure SSL/TLS encrypted connection (HTTPS).
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-gray-700 mr-2">Processing:</span>
                  Files are processed automatically by our servers. No humans access or view your file content.
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-gray-700 mr-2">Retention:</span>
                  Uploaded files and processed output files are automatically deleted from our servers permanently after a short period (typically 2 hours) to ensure your privacy.
                </li>
              </ul>
              <div className="bg-brand-50 border border-brand-100 rounded-lg p-4 flex items-start gap-3 mt-4">
                <Lock className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-brand-700 m-0">
                  We do not ownership of your content. You retain full copyright and ownership of the files you process through our service.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">3. Information We Collect</h2>
              <p className="mb-4">
                We collect minimal information necessary to provide and improve our Service:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li><strong>Usage Data:</strong> We may collect anonymous data about how the Service is accessed and used (e.g., page views, tool usage counts, browser type) to help us improve performance and user experience.</li>
                <li><strong>Cookies:</strong> We use cookies to store preferences (such as your chosen language or theme color) and to analyze traffic. You can instruct your browser to refuse all cookies.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">4. Third-Party Services</h2>
              <p className="mb-4">
                We may use third-party service providers to facilitate our Service, such as:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li><strong>Cloud Infrastructure:</strong> To host our servers and process files reliably.</li>
                <li><strong>Analytics:</strong> To monitor and analyze the use of our Service (e.g., Google Analytics).</li>
              </ul>
              <p>
                These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">5. Data Protection Rights (GDPR)</h2>
              <p className="mb-4">
                If you are a resident of the European Economic Area (EEA), you have certain data protection rights. Toolazon aims to take reasonable steps to allow you to correct, amend, delete, or limit the use of your Personal Data.
              </p>
              <p className="mb-4">
                Since we do not store user accounts or personal files permanently, most "Right to be Forgotten" requests are handled automatically by our system's auto-deletion policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">6. Changes to This Policy</h2>
              <p className="mb-4">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4">7. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this Privacy Policy, please contact us via the support channels provided on our website.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;