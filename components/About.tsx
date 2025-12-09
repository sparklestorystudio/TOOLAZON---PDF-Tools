import React from 'react';
import { ArrowLeft, Users, Heart, Zap, Globe } from 'lucide-react';

interface AboutProps {
  onNavigate: (view: any) => void;
}

const About: React.FC<AboutProps> = ({ onNavigate }) => {
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
            <Users className="w-6 h-6 text-brand-500" />
            About Toolazon
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Intro */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12 mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">We help with your PDF tasks</h2>
            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                Toolazon was founded in 2013 with a simple mission: to make working with PDF documents easy, productive, and accessible to everyone. We believe that robust PDF tools shouldn't require expensive software or complicated installations.
            </p>
        </div>

        {/* Values Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <Heart className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">User Focused</h3>
                <p className="text-sm text-gray-500">We build tools that solve real problems. Every feature is designed with simplicity and usability in mind.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Productivity</h3>
                <p className="text-sm text-gray-500">Time is precious. Our tools are optimized for speed, helping you finish your document tasks in seconds.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
                    <Globe className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">Accessible</h3>
                <p className="text-sm text-gray-500">Available in 20+ languages and accessible from any device with a browser, anywhere in the world.</p>
            </div>
        </div>

        {/* Story Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Our Story</h3>
            <div className="prose prose-blue max-w-none text-gray-600">
                <p>
                    Started as a small open-source project in Amsterdam, Toolazon has grown into a comprehensive suite of over 30 PDF tools used by millions of people worldwide. Whether you are a student merging lecture notes, a business professional signing contracts, or a developer automating document workflows, Toolazon is built for you.
                </p>
                <p>
                    We are a small, independent team passionate about software craftsmanship. We pride ourselves on clean code, user privacy, and sustainable development practices. Unlike big tech giants, we don't track you across the web or sell your data.
                </p>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Get in Touch</h3>
                <p className="text-gray-600 mb-4">
                    Have questions, suggestions, or just want to say hi? We'd love to hear from you.
                </p>
                <a href="#" className="text-brand-500 font-medium hover:underline">Contact Support</a>
            </div>
        </div>
      </div>
    </div>
  );
};

export default About;