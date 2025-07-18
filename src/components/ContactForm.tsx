// src/components/ContactForm.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { useRecaptcha } from '@/hooks/useRecaptcha';

// Types for form data
interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  honeypot?: string; // Hidden field for spam protection
}

interface ContactFormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  general?: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: Record<string, string[]>;
  resetTime?: string;
}

export default function ContactForm() {
  const { t } = useTranslations();

  // Initialize reCAPTCHA
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
  const { executeRecaptcha } = useRecaptcha({ siteKey: recaptchaSiteKey });

  // Form state
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    honeypot: ''
  });

  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Refs for form elements
  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus on name input when component mounts
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // Clear messages after timeout
  useEffect(() => {
    if (submitStatus === 'success' || submitStatus === 'error') {
      const timer = setTimeout(() => {
        setSubmitStatus('idle');
        setSuccessMessage('');
        setErrorMessage('');
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [submitStatus]);

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field if it exists
    if (errors[name as keyof ContactFormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }

    // Clear general error
    if (errors.general) {
      setErrors(prev => ({
        ...prev,
        general: undefined
      }));
    }
  };

  // Client-side validation
  const validateForm = (): boolean => {
    const newErrors: ContactFormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = t('contact.form.errors.nameRequired');
    } else if (formData.name.trim().length > 100) {
      newErrors.name = t('contact.form.errors.nameTooLong');
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = t('contact.form.errors.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('contact.form.errors.emailInvalid');
    }

    // Subject validation
    if (!formData.subject.trim()) {
      newErrors.subject = t('contact.form.errors.subjectRequired');
    } else if (formData.subject.trim().length > 200) {
      newErrors.subject = t('contact.form.errors.subjectTooLong');
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = t('contact.form.errors.messageRequired');
    } else if (formData.message.trim().length < 10) {
      newErrors.message = t('contact.form.errors.messageTooShort');
    } else if (formData.message.trim().length > 2000) {
      newErrors.message = t('contact.form.errors.messageTooLong');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear previous messages
    setErrors({});
    setSuccessMessage('');
    setErrorMessage('');

    // Client-side validation
    if (!validateForm()) {
      // Focus on first error field
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = formRef.current?.elements.namedItem(firstErrorField) as HTMLElement;
        element?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Execute reCAPTCHA if enabled
      let recaptchaToken: string | null = null;
      if (recaptchaSiteKey) {
        recaptchaToken = await executeRecaptcha('contact');
        if (!recaptchaToken) {
          setSubmitStatus('error');
          setErrorMessage('Security verification failed. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }

      // Prepare form data with reCAPTCHA token
      const submitData = {
        ...formData,
        recaptchaToken: recaptchaToken || undefined
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result: ApiResponse = await response.json();

      if (response.ok && result.success) {
        // Success
        setSubmitStatus('success');
        setSuccessMessage(t('contact.form.messages.success'));
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          honeypot: ''
        });

        // Scroll to top of form to show success message
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

      } else {
        // Error response
        setSubmitStatus('error');
        
        if (response.status === 429) {
          setErrorMessage(t('contact.form.messages.rateLimited'));
        } else if (result.details) {
          // Validation errors from server
          const serverErrors: ContactFormErrors = {};
          Object.entries(result.details).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              serverErrors[field as keyof ContactFormErrors] = messages[0];
            }
          });
          setErrors(serverErrors);
        } else {
          setErrorMessage(result.error || t('contact.form.messages.error'));
        }
      }

    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(t('contact.form.messages.networkError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white text-black p-8 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl font-semibold text-black mb-6">
        {t('contact.form.title')}
      </h2>
      
      {/* Success Message */}
      {submitStatus === 'success' && successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-700 font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitStatus === 'error' && errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-red-700 font-medium">{errorMessage}</p>
          </div>
        </div>
      )}
      
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Hidden honeypot field for spam protection */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">{t('contact.form.honeypot')}</label>
          <input
            type="text"
            id="website"
            name="honeypot"
            value={formData.honeypot}
            onChange={handleInputChange}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
            {t('contact.form.fields.name.label')}
          </label>
          <input
            ref={nameInputRef}
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 focus:outline-none transition-colors text-black placeholder-gray-500 ${
              errors.name 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300 hover:border-gray-400'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            placeholder={t('contact.form.fields.name.placeholder')}
            maxLength={100}
            aria-describedby={errors.name ? 'name-error' : undefined}
            aria-invalid={errors.name ? 'true' : 'false'}
          />
          {errors.name && (
            <p id="name-error" className="mt-1.5 text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
            {t('contact.form.fields.email.label')}
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 focus:outline-none transition-colors text-black placeholder-gray-500 ${
              errors.email 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300 hover:border-gray-400'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            placeholder={t('contact.form.fields.email.placeholder')}
            autoComplete="email"
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-invalid={errors.email ? 'true' : 'false'}
          />
          {errors.email && (
            <p id="email-error" className="mt-1.5 text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {errors.email}
            </p>
          )}
        </div>

        {/* Subject Field */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-black mb-2">
            {t('contact.form.fields.subject.label')}
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 focus:outline-none transition-colors text-black placeholder-gray-500 ${
              errors.subject 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300 hover:border-gray-400'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            placeholder={t('contact.form.fields.subject.placeholder')}
            maxLength={200}
            aria-describedby={errors.subject ? 'subject-error' : undefined}
            aria-invalid={errors.subject ? 'true' : 'false'}
          />
          {errors.subject && (
            <p id="subject-error" className="mt-1.5 text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {errors.subject}
            </p>
          )}
        </div>

        {/* Message Field */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-black mb-2">
            {t('contact.form.fields.message.label')}
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            rows={5}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 focus:outline-none transition-colors resize-vertical text-black placeholder-gray-500 ${
              errors.message 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300 hover:border-gray-400'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            placeholder={t('contact.form.fields.message.placeholder')}
            maxLength={2000}
            aria-describedby={errors.message ? 'message-error' : 'message-help'}
            aria-invalid={errors.message ? 'true' : 'false'}
          />
          {errors.message ? (
            <p id="message-error" className="mt-1.5 text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {errors.message}
            </p>
          ) : (
            <p id="message-help" className="mt-1.5 text-sm text-gray-600">
              {t('contact.form.fields.message.charCount', { count: formData.message.length })}
            </p>
          )}
        </div>

        {/* reCAPTCHA Notice */}
        {recaptchaSiteKey && (
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
            This site is protected by reCAPTCHA and the Google{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Terms of Service
            </a>{' '}
            apply.
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-all duration-200 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:outline-none ${
              isSubmitting
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-[#fc4e87] hover:bg-pink-600 text-white hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('contact.form.buttons.submitting')}
              </span>
            ) : (
              t('contact.form.buttons.submit')
            )}
          </button>
        </div>

        {/* Form Footer */}
        <div className="text-center text-sm text-gray-600 pt-4 border-t border-gray-200">
          <p>
            {t('contact.form.footer.responseTime')}{' '}
            <a href="tel:682-386-7827" className="text-[#fc4e87] hover:underline font-medium">
              682-386-7827
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}