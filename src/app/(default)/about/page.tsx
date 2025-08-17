// src/app/(default)/about/page.tsx 
'use client';

import React, { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';

// Interface for contact information
interface ContactInfo {
  email: string;
  phone: string;
  address: string;
}

// Collapsible Contact Info Component with enhanced styling
const CollapsibleContactInfo: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const { currentLanguage } = useTranslations();
  const isSpanish = currentLanguage === 'es';

  const contactInfo: ContactInfo = {
    email: 'contact@qualiphy.me',
    phone: '+1 (424) 257-3977',
    address: '13 N San Vicente Blvd, Beverly Hills, CA 90211'
  };

  const toggleExpanded = (): void => {
    setIsExpanded(prev => !prev);
  };

  return (
    <div className="mt-12 bg-gradient-to-r from-red-25 to-red-25 rounded-lg border border-red-100 overflow-hidden shadow-sm">
      {/* Header Button */}
      <button
        onClick={toggleExpanded}
        className="w-full p-3 text-left focus:outline-none focus:ring-1 focus:ring-[#E63946] focus:ring-inset transition-all duration-200 hover:bg-white/30"
        aria-expanded={isExpanded}
        aria-controls="contact-info-content"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-light text-gray-500 flex items-center opacity-60">
            <span className="h-1 w-1 bg-[#E63946] rounded-full mr-2"></span>
            {isSpanish ? 'Información de Contacto de Qualiphy' : 'Qualiphy Contact Information'}
          </h3>
          <svg
            className={`h-3 w-3 text-[#E63946] transition-transform duration-300 opacity-60 ${
              isExpanded ? 'rotate-180' : 'rotate-0'
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>

      {/* Collapsible Content */}
      <div
        id="contact-info-content"
        className={`transition-all duration-500 ease-in-out ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}
      >
        <div className="px-4 pb-4 space-y-2 bg-white/20 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center p-2 bg-white/40 rounded text-xs">
            <span className="font-medium text-gray-600 min-w-[60px] flex items-center">
              <svg className="h-3 w-3 mr-1 text-[#E63946]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
              {isSpanish ? 'Correo:' : 'Email:'}
            </span>
            <a
              href={`mailto:${contactInfo.email}`}
              className="text-[#E63946] hover:text-red-700 transition-colors underline text-xs"
            >
              {contactInfo.email}
            </a>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center p-2 bg-white/40 rounded text-xs">
            <span className="font-medium text-gray-600 min-w-[60px] flex items-center">
              <svg className="h-3 w-3 mr-1 text-[#E63946]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
              </svg>
              {isSpanish ? 'Teléfono:' : 'Phone:'}
            </span>
            <a
              href={`tel:${contactInfo.phone}`}
              className="text-[#E63946] hover:text-red-700 transition-colors underline text-xs"
            >
              {contactInfo.phone}
            </a>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start p-2 bg-white/40 rounded text-xs">
            <span className="font-medium text-gray-600 min-w-[60px] flex items-center">
              <svg className="h-3 w-3 mr-1 text-[#E63946]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
              {isSpanish ? 'Dirección:' : 'Address:'}
            </span>
            <span className="text-gray-600 text-xs">{contactInfo.address}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AboutPage(): React.ReactElement {
  const { currentLanguage } = useTranslations();
  const isSpanish = currentLanguage === 'es';

  return (
    <main className="bg-white">
      {/* Mission Section with enhanced design */}
      <div className="py-20 bg-white overflow-hidden relative">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ec4899' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center p-2 bg-red-100 rounded-full mb-4">
              <div className="flex items-center justify-center h-8 w-8 bg-[#E63946] rounded-full">
                <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
              {isSpanish ? (
                <>Nuestra <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E63946] to-red-600">Misión</span></>
              ) : (
                <>Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E63946] to-red-600">Mission</span></>
              )}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#E63946] to-red-600 mx-auto rounded-full"></div>
          </div>

          {/* Mission content */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              {isSpanish ? (
                <>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    En Lily&apos;s, tenemos la misión de hacer que la pérdida de peso médicamente guiada sea simple, solidaria y accesible para cada mujer.
                  </p>
                  
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    Entendemos que el cambio duradero comienza con apoyo confiable, por eso hemos construido una plataforma fácil de usar que conecta a las mujeres con médicos licenciados a través de consultas seguras de telemedicina. Aunque Lily&apos;s no brinda atención médica directamente, trabajamos de la mano con <strong className="text-[#E63946]">Qualiphy</strong>, un proveedor respetable de telemedicina, para asegurar que recibas atención experta adaptada a tus objetivos.
                  </p>
                  
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    Nuestro enfoque está en <strong className="text-red-600">soluciones de pérdida de peso respaldadas clínicamente</strong>, incluyendo prescripciones como medicamentos GLP-1 (como semaglutida o tirzepatida), todas prescritas por profesionales licenciados cuando sea apropiado. A través de nuestro sitio web, puedes explorar tus opciones, completar una evaluación inicial y conectarte con la atención que necesitas, todo desde la comodidad de tu hogar.
                  </p>
                  
                  <p className="text-lg text-gray-700 leading-relaxed mb-8">
                    Estamos aquí para guiarte en cada paso del camino, desde el descubrimiento hasta los resultados. En Lily&apos;s, no solo estás comenzando un programa—estás iniciando un viaje con el apoyo adecuado detrás de ti.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    At Lily&apos;s, we&apos;re on a mission to make medically guided weight loss simple, supportive, and accessible for every woman.
                  </p>
                  
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    We understand that lasting change starts with trusted support, which is why we&apos;ve built an easy-to-use platform that connects women with licensed doctors through secure telehealth consultations. While Lily&apos;s doesn&apos;t provide medical care directly, we work hand-in-hand with <strong className="text-[#E63946]">Qualiphy</strong>, a reputable telehealth provider, to ensure you receive expert care tailored to your goals.
                  </p>
                  
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    Our focus is on <strong className="text-red-600">clinically backed weight loss solutions</strong>, including prescriptions like GLP-1 medications (such as semaglutide or tirzepatide), all prescribed by licensed professionals when appropriate. Through our website, you can explore your options, complete an intake, and get connected to the care you need—all from the comfort of home.
                  </p>
                  
                  <p className="text-lg text-gray-700 leading-relaxed mb-8">
                    We&apos;re here to guide you every step of the way, from discovery to results. At Lily&apos;s, you&apos;re not just starting a program—you&apos;re beginning a journey with the right support behind you.
                  </p>
                </>
              )}
              
              {/* Collapsible Contact Information */}
              <CollapsibleContactInfo />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}