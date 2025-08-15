'use client';

import Script from 'next/script';

declare global {
  interface Window {
    fbq: {
      (type: 'init', pixelId: string): void;
      (type: 'track', eventName: string, data?: Record<string, any>): void;
      (type: 'trackCustom', eventName: string, data?: Record<string, any>): void;
      callMethod?: (...args: any[]) => void;
      queue?: any[];
      push?: (...args: any[]) => void;
      loaded?: boolean;
      version?: string;
    };
  }
}

export default function FacebookPixel() {
  const handlePixelLoad = () => {
    // Ensure fbq is available globally for tracking functions
    if (typeof window !== 'undefined' && window.fbq) {
      // Additional initialization if needed
      console.log('Facebook Pixel loaded successfully');
    }
  };

  // Using exact Facebook API documentation variable naming
  const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '1442940036980408';

  return (
    <>
      <Script
        id="facebook-pixel"
        strategy="afterInteractive"
        onLoad={handlePixelLoad}
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}