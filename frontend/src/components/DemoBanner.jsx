export default function DemoBanner() {
  if (import.meta.env.VITE_DEMO_MODE !== 'true') return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      backgroundColor: '#f59e0b',
      color: '#1c1917',
      textAlign: 'center',
      padding: '6px 16px',
      fontSize: '0.85rem',
      fontWeight: 500,
    }}>
      ⚠️ Entorno de demostración — Los emails se capturan en{' '}
      <a
        href="http://localhost:8025"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#1c1917', textDecoration: 'underline' }}
      >
        Mailpit (:8025)
      </a>
      {', '}no se envían realmente
    </div>
  );
}
