import { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import PageHeader from '@/components/PageHeader';

export const metadata: Metadata = {
  title: "Contact Us - Lily's Women's Health",
  description: "Get in touch with Lily's Women's Health. Contact our support team for questions about telehealth consultations, weight loss programs, and GLP-1 medications.",
  keywords: [
    "contact Lily's",
    "customer support",
    "telehealth support", 
    "weight loss help",
    "women's health contact",
    "consultation questions",
    "GLP-1 medication support",
    "healthcare assistance"
  ],
  openGraph: {
    title: "Contact Lily's Women's Health",
    description: "Get in touch with our support team for questions about telehealth consultations and weight loss programs.",
    url: "https://lilyswomenshealth.com/contact",
    images: [
      {
        url: "/images/contact-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Contact Lily's Women's Health"
      }
    ]
  },
  twitter: {
    title: "Contact Lily's Women's Health",
    description: "Get in touch with our support team for questions about telehealth consultations and weight loss programs."
  }
};

export default function ContactPage() {
  return (
    <div className="bg-white text-black">
      <PageHeader 
        title="Contact Us"
        subtitle="Get in touch with our support team"
      />

      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <ContactForm />
            </div>

            <div className="lg:col-span-2">
              <div className="bg-pink-50 p-8 rounded-lg shadow-sm border border-pink-100 sticky top-8">
                <h2 className="text-2xl font-semibold text-black mb-6">
                  Contact Information
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-[#fc4e87]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-black">Email</h3>
                      <a 
                        href="mailto:cole@lilyswomenshealth.com"
                        className="mt-1 text-[#fc4e87] hover:text-pink-600 transition-colors"
                      >
                        cole@lilyswomenshealth.com
                      </a>
                      <p className="mt-1 text-sm text-gray-600">
                        Send us an email anytime!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-[#fc4e87]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-black">Phone</h3>
                      <a 
                        href="tel:682-386-7827"
                        className="mt-1 text-[#fc4e87] hover:text-pink-600 transition-colors"
                      >
                        682-386-7827
                      </a>
                      <p className="mt-1 text-sm text-gray-600">
                        Mon-Fri from 8am to 5pm CT
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-[#fc4e87]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-black">Business Hours</h3>
                      <p className="mt-1 text-gray-700">Monday - Friday: 8:00 AM - 5:00 PM CT</p>
                      <p className="mt-0.5 text-gray-700">Weekend: By appointment</p>
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