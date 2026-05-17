import { useState } from "react";
import { C } from "../constants/theme";
import BtnPrimary from "../components/ui/BtnPrimary";
import BtnSecondary from "../components/ui/BtnSecondary";
import Spinner from "../components/ui/Spinner";
import QRCode from "../components/QRCode";

export default function TicketPage({ movie, addToast }) {
  const [downloading, setDownloading] = useState(false);
  const code = "SNDR-2025-7A3F";
  if (!movie) return <div style={{ padding: 80, textAlign: "center", color: C.gray }}>No hay ticket disponible</div>;

  const handleDownload = () => {
    setDownloading(true);
    addToast("Preparando PDF...", "info");
    setTimeout(() => { setDownloading(false); addToast("PDF listo para descargar ✓", "success"); }, 2000);
  };

  return (
    <div style={{ minHeight: "100vh", paddingTop: 80, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "100px 24px 40px" }}>
      <div style={{ width: "100%", maxWidth: 480, animation: "ticketSlide .5s cubic-bezier(.22,.68,0,1.2) forwards" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 20, background: C.greenDim, border: `1px solid ${C.green}`, marginBottom: 12 }}>
            <span style={{ color: C.green, fontSize: 14 }}>✓</span>
            <span style={{ color: C.green, fontSize: 13, fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>Compra exitosa</span>
          </div>
          <p style={{ color: C.gray, fontSize: 14 }}>Tu ticket digital está listo</p>
        </div>

        {/* Ticket card */}
        <div style={{ background: C.card, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 24px 64px rgba(0,0,0,.6)" }}>
          {/* Header */}
          <div style={{ background: `linear-gradient(135deg, #0D0D0D, #1C0000)`, padding: "28px 28px 24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: `${movie.color}15` }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ color: C.red, fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>CINE SENDERA</p>
                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, letterSpacing: 2, lineHeight: 1 }}>{movie.title}</h2>
                <p style={{ color: C.gray, fontSize: 13, marginTop: 6 }}>{movie.genre} · {movie.duration}</p>
              </div>
              <div style={{ fontSize: 48 }}>{movie.emoji}</div>
            </div>
          </div>

          {/* Perforation */}
          <div style={{ height: 20, position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: -10, width: 20, height: 20, borderRadius: "50%", background: C.bg }} />
            <div style={{ flex: 1, height: 1, borderTop: `2px dashed ${C.border}`, margin: "0 14px" }} />
            <div style={{ position: "absolute", right: -10, width: 20, height: 20, borderRadius: "50%", background: C.bg }} />
          </div>

          {/* Body */}
          <div style={{ padding: "20px 28px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {[["Sala", "Sala 1"], ["Fecha", "Vie 25 Jul"], ["Hora", movie.schedule[0]], ["Asientos", "A3, A4"]].map(([k, v]) => (
                <div key={k}>
                  <p style={{ fontSize: 11, color: C.grayDark, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, fontFamily: "'Montserrat', sans-serif" }}>{k}</p>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15 }}>{v}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 4 }}>
              <div>
                <p style={{ fontSize: 11, color: C.grayDark, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, fontFamily: "'Montserrat', sans-serif" }}>Comprador</p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 14 }}>Carlos Mendoza</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: C.grayDark, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, fontFamily: "'Montserrat', sans-serif" }}>Total</p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 18, color: C.green }}>$180.00</p>
              </div>
            </div>
          </div>

          {/* Second perforation */}
          <div style={{ height: 20, position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: -10, width: 20, height: 20, borderRadius: "50%", background: C.bg }} />
            <div style={{ flex: 1, height: 1, borderTop: `2px dashed ${C.border}`, margin: "0 14px" }} />
            <div style={{ position: "absolute", right: -10, width: 20, height: 20, borderRadius: "50%", background: C.bg }} />
          </div>

          {/* QR footer */}
          <div style={{ padding: "20px 28px 24px", display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ background: C.white, padding: 8, borderRadius: 6 }}>
              <QRCode code={code} />
            </div>
            <div>
              <p style={{ fontSize: 10, color: C.grayDark, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, fontFamily: "'Montserrat', sans-serif" }}>Código de ticket</p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: 2, color: C.white }}>{code}</p>
              <p style={{ fontSize: 11, color: C.grayDark, marginTop: 6 }}>Presenta este código en taquilla</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <BtnPrimary onClick={handleDownload} style={{ flex: 1, padding: 13, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {downloading ? <><Spinner /><span>Generando...</span></> : "⬇ Descargar PDF"}
          </BtnPrimary>
          <BtnSecondary onClick={() => addToast("Compartir próximamente", "info")} style={{ padding: "13px 20px" }}>Compartir</BtnSecondary>
        </div>
      </div>
    </div>
  );
}
