"use client";

import { useEffect } from "react";

export default function ChunkErrorHandler() {
  useEffect(() => {
    function handleError(e: ErrorEvent) {
      try {
        const msg = (e && e.message) || '';
        if (msg.includes('Loading chunk') || msg.includes('ChunkLoadError')) {
          // Cache-busting reload
          const url = window.location.href.split('?')[0] + '?refresh=' + Date.now();
          window.location.replace(url);
        }
      } catch (err) {
        // ignore
      }
    }

    function handleRejection(ev: PromiseRejectionEvent) {
      try {
        const reason = (ev && (ev.reason as any)) || {};
        const msg = reason?.message || String(reason || '');
        if (msg.includes('Loading chunk') || msg.includes('ChunkLoadError')) {
          const url = window.location.href.split('?')[0] + '?refresh=' + Date.now();
          window.location.replace(url);
        }
      } catch (err) {}
    }

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection as any);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection as any);
    };
  }, []);

  return null;
}
