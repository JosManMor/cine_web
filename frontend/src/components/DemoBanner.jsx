import { useState, useEffect } from 'react';

export function demoBannerActive() {
  return import.meta.env.VITE_DEMO_MODE === 'true';
}

export default function DemoBanner() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!demoBannerActive()) return;
    const el = document.getElementById('demo-banner');
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height));
    ro.observe(el);
    setHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  if (!demoBannerActive()) return null;

  return (
    <>
      <style>{`
        #demo-banner {
          position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
          background-color: #f59e0b; color: #1c1917;
          text-align: center; padding: 6px 16px;
          font-size: 0.85rem; font-weight: 500;
          display: flex; align-items: center; justify-content: center;
          flex-wrap: wrap; gap: 4px;
        }
        @media (max-width: 480px) {
          #demo-banner { font-size: 0.75rem; padding: 6px 10px; }
        }
      `}</style>
      <div id="demo-banner">
        <span>⚠️ Entorno de demostración</span>
        <span>
          — Los emails se capturan en{' '}
          <a
            href={import.meta.env.VITE_MAILPIT_URL ?? '/mailpit/'}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1c1917', textDecoration: 'underline' }}
          >
            Mailpit
          </a>
          , no se envían realmente
        </span>
      </div>
      <div style={{ height }} />
    </>
  );
}
