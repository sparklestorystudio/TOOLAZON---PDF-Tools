import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';

interface TermsOfUseProps {
  onNavigate: (view: any) => void;
}

const TermsOfUse: React.FC<TermsOfUseProps> = ({ onNavigate }) => {
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
            <FileText className="w-6 h-6 text-brand-500" />
            Terms of Use
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="prose prose-blue max-w-none text-gray-600">
            <p className="text-sm text-gray-400 mb-8">Last updated: December 04, 2025</p>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing and using Toolazon ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">2. Description of Service</h2>
              <p className="mb-4">
                Toolazon provides a suite of online PDF tools allowing users to merge, split, compress, edit, and convert PDF documents. The Service is provided "as is" and is accessible via a web browser.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">3. Privacy and Data Security</h2>
              <p className="mb-4">
                We take your privacy seriously. Files uploaded to Toolazon are processed automatically.
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>Files are transferred via a secure encrypted connection (HTTPS).</li>
                <li>Files are stored temporarily on our servers for processing purposes only.</li>
                <li>Files are automatically deleted from our servers after processing (usually within 2 hours).</li>
                <li>We do not look at, copy, or analyze the content of your files.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">4. User Conduct</h2>
              <p className="mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>Upload or process illegal content, including material that violates copyright laws.</li>
                <li>Attempt to gain unauthorized access to the Service or its related systems.</li>
                <li>Interfere with or disrupt the integrity or performance of the Service.</li>
                <li>Upload files containing viruses, malware, or other harmful code.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">5. Intellectual Property</h2>
              <p className="mb-4">
                Toolazon does not claim ownership of the files you upload or the documents you create. You retain all copyright and any other rights you already hold in content which you submit, post or display on or through, the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">6. Limitation of Liability</h2>
              <p className="mb-4">
                In no event shall Toolazon, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">7. Modifications to Service</h2>
              <p className="mb-4">
                Toolazon reserves the right at any time and from time to time to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4">8. Governing Law</h2>
              <p className="mb-4">
                These Terms shall be governed and construed in accordance with the laws, without regard to its conflict of law provisions.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;