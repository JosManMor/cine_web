const BANNER_HEIGHT = 32;

export function demoBannerActive() {
  return import.meta.env.VITE_DEMO_MODE === 'true';
}

export { BANNER_HEIGHT };

export default function DemoBanner() {
  if (!demoBannerActive()) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: BANNER_HEIGHT,
      zIndex: 9999,
      backgroundColor: '#f59e0b',
      color: '#1c1917',
      textAlign: 'center',
      padding: '6px 16px',
      fontSize: '0.85rem',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      ⚠️ Entorno de demostración — Los emails se capturan en{' '}
      <a
        href={import.meta.env.VITE_MAILPIT_URL ?? '/mailpit/'}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#1c1917', textDecoration: 'underline' }}
      >
        Mailpit
      </a>
      {', '}no se envían realmente
    </div>
  );
}
