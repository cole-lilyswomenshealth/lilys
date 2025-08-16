// src/app/(default)/contact/page.tsx
'use client';

import { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import PageHeader from '@/components/PageHeader';
import { useTranslations } from '@/hooks/useTranslations';
import { useEffect } from 'react';

export default function ContactPage() {
  const { t } = useTranslations();

  // Update page title dynamically for SEO
  useEffect(() => {
    document.title = t('contact.meta.title');
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', t('contact.meta.description'));
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = t('contact.meta.description');
      document.head.appendChild(meta);
    }
  }, [t]);

  return (
    <div className="bg-white text-black">
      {/* Page Header */}
      <PageHeader 
        title={t('contact.header.title')}
        subtitle={t('contact.header.subtitle')}
      />

      {/* Main content */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-3">
              <ContactForm />
            </div>

            {/* Contact Information */}
            <div className="lg:col-span-2">
              <div className="bg-pink-50 p-8 rounded-lg shadow-sm border border-pink-100 sticky top-8">
                <h2 className="text-2xl font-semibold text-black mb-6">
                  {t('contact.info.title')}
                </h2>
                
                <div className="space-y-6">
                  {/* Email */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-[#fc4e87]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-black">
                        {t('contact.info.email.label')}
                      </h3>
                      <a 
                        href="mailto:cole@lilyswomenshealth.com"
                        className="mt-1 text-[#fc4e87] hover:text-pink-600 transition-colors"
                      >
                        cole@lilyswomenshealth.com
                      </a>
                      <p className="mt-1 text-sm text-gray-600">
                        {t('contact.info.email.description')}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-[#fc4e87]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-black">
                        {t('contact.info.phone.label')}
                      </h3>
                      <a 
                        href="tel:682-386-7827"
                        className="mt-1 text-[#fc4e87] hover:text-pink-600 transition-colors"
                      >
                        682-386-7827
                      </a>
                      <p className="mt-1 text-sm text-gray-600">
                        {t('contact.info.phone.description')}
                      </p>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-[#fc4e87]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-black">
                        {t('contact.info.hours.label')}
                      </h3>
                      <p className="mt-1 text-gray-700">
                        {t('contact.info.hours.schedule')}
                      </p>
                      <p className="mt-0.5 text-gray-700">
                        {t('contact.info.hours.availability')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}