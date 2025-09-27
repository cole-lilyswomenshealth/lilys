// src/hooks/useRecaptcha.ts
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface UseRecaptchaProps {
  siteKey: string;
}

export function useRecaptcha({ siteKey }: UseRecaptchaProps) {
  const isLoaded = useRef<boolean>(false);

  useEffect(() => {
    if (isLoaded.current || !siteKey) return;

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    isLoaded.current = true;

    return () => {
      // Cleanup script if component unmounts
      const existingScript = document.querySelector(`script[src*="${siteKey}"]`);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [siteKey]);

  const executeRecaptcha = async (action: string): Promise<string | null> => {
    if (!siteKey) return null;

    // Return fake token in development mode
    if (process.env.NODE_ENV === 'development') {
      return 'dev_fake_token_' + Date.now();
    }

    return new Promise((resolve) => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          window.grecaptcha.execute(siteKey, { action }).then((token: string) => {
            resolve(token);
          });
        });
      } else {
        resolve(null);
      }
    });
  };

  return { executeRecaptcha };
}