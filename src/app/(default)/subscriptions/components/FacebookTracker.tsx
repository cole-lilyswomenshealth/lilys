'use client';

import { useEffect } from 'react';
import { trackSubscriptionPageView } from '@/utils/facebookTracking';

export default function FacebookTracker() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      trackSubscriptionPageView(window.location.href);
    }
  }, []);

  return null;
}