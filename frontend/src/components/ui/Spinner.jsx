import logoSrc from "../../assets/logo.png";

/**
 * Spinner → Logo animado que se ilumina desde gris al color original.
 *
 * Props:
 *   size   – diámetro en px  (default 120 para pantalla completa, usa 28 para inline)
 *   inline – si true, usa tamaño compacto y omite el overlay centrado
 */
export default function Spinner({ size, inline = false }) {
  const dim = size ?? (inline ? 28 : 120);

  const keyframes = `
    @keyframes logoIlluminate {
      0%   { filter: grayscale(1) brightness(0.35); opacity: 0.6; }
      40%  { filter: grayscale(0.6) brightness(0.7); opacity: 0.85; }
      70%  { filter: grayscale(0.2) brightness(0.95); opacity: 0.95; }
      100% { filter: grayscale(0) brightness(1); opacity: 1; }
    }
    @keyframes logoPulse {
      0%, 100% { transform: scale(1);    filter: grayscale(0) brightness(1); }
      50%       { transform: scale(1.04); filter: grayscale(0) brightness(1.15) drop-shadow(0 0 18px rgba(220,38,38,0.55)); }
    }
  `;

  const imgStyle = {
    width:  dim,
    height: dim,
    objectFit: "contain",
    animation: `logoIlluminate 1.2s ease forwards, logoPulse 2s ease-in-out 1.2s infinite`,
    display: "block",
  };

  if (inline) {
    return (
      <>
        <style>{keyframes}</style>
        <img src={logoSrc} alt="Cargando…" style={imgStyle} />
      </>
    );
  }

  return (
    <>
      <style>{keyframes}</style>
      <div style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        gap:            20,
      }}>
        <img src={logoSrc} alt="Cargando…" style={imgStyle} />
        <p style={{
          fontFamily:   "'Montserrat', sans-serif",
          fontSize:     13,
          color:        "#111",
          letterSpacing: 2,
          textTransform: "uppercase",
          animation:    "logoPulse 2s ease-in-out 1.2s infinite",
          textShadow:   "0 1px 6px rgba(255,255,255,0.85), 0 -1px 6px rgba(255,255,255,0.85)",
        }}>
          Cargando…
        </p>
      </div>
    </>
  );
}
