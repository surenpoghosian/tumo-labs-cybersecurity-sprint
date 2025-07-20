'use client';

import { Toaster, toast } from 'react-hot-toast';
import { useEffect } from 'react';

export default function GlobalToaster() {
  useEffect(() => {
    // Override default alert with toast notification
    // eslint-disable-next-line no-alert
    window.alert = (message?: string) => {
      if (typeof message === 'string') {
        toast(message);
      } else {
        toast(JSON.stringify(message));
      }
    };
  }, []);

  return <Toaster position="top-right" />;
} 