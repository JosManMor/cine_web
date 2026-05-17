import { C } from "../constants/theme";
import BtnPrimary from "../components/ui/BtnPrimary";
import BtnSecondary from "../components/ui/BtnSecondary";
import QRCode from "../components/QRCode";

const PAYMENT_LABEL = { cash: "Efectivo", card: "Tarjeta", online: "En línea" };
const LANG_LABEL    = { original: "Original", dubbed: "Doblada", subtitled: "Subtitulada" };

function fmtDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("es-MX", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function TicketPage({ movie, schedule, purchaseResult, user, addToast }) {
  if (!purchaseResult) {
    return <div style={{ padding: 80, textAlign: "center", color: C.gray }}>No hay comprobante disponible</div>;
  }

  const { purchase_id, payment_status, seats, total, payment_method } = purchaseResult;
  const seatLabels = seats.map(s => `${s.row}${s.seat_number}`).join(", ");
  const refCode    = `SNDR-${purchase_id}`;
  const isPending  = payment_status !== "completed";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "100px 24px 40px" }}>
      <div style={{ width: "100%", maxWidth: 480, animation: "ticketSlide .5s cubic-bezier(.22,.68,0,1.2) forwards" }}>

        {/* Encabezado de estado */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 20, marginBottom: 12,
            background: isPending ? "rgba(229,147,9,0.15)" : C.greenDim,
            border: `1px solid ${isPending ? "#E59309" : C.green}`,
          }}>
            <span style={{ color: isPending ? "#E59309" : C.green, fontSize: 14 }}>{isPending ? "⏳" : "✓"}</span>
            <span style={{ color: isPending ? "#E59309" : C.green, fontSize: 13, fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>
              {isPending ? "Compra registrada — pago pendiente" : "Compra confirmada"}
            </span>
          </div>
          <p style={{ color: C.gray, fontSize: 14 }}>
            {isPending ? "Presenta tu ID de compra en taquilla para pagar" : "Tu ticket digital está listo"}
          </p>
        </div>

        {/* Tarjeta de ticket */}
        <div style={{ background: C.card, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 24px 64px rgba(0,0,0,.6)" }}>

          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #0D0D0D, #1C0000)", padding: "28px 28px 24px" }}>
            <p style={{ color: C.red, fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>CINE SENDERA</p>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ width: 52, height: 70, background: C.surface, borderRadius: 4, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {movie?.poster_url
                  ? <img src={movie.poster_url} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: C.grayDark }}>{movie?.title?.[0]}</span>
                }
              </div>
              <div>
                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, letterSpacing: 2, lineHeight: 1 }}>
                  {movie?.title ?? "Película"}
                </h2>
                {movie?.genre && (
                  <p style={{ color: C.gray, fontSize: 13, marginTop: 6 }}>{movie.genre}</p>
                )}
              </div>
            </div>
          </div>

          {/* Perforación */}
          <div style={{ height: 20, position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: -10, width: 20, height: 20, borderRadius: "50%", background: C.bg }} />
            <div style={{ flex: 1, height: 1, borderTop: `2px dashed ${C.border}`, margin: "0 14px" }} />
            <div style={{ position: "absolute", right: -10, width: 20, height: 20, borderRadius: "50%", background: C.bg }} />
          </div>

          {/* Cuerpo */}
          <div style={{ padding: "20px 28px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {[
                ["Sala",    schedule?.room?.name ?? "—"],
                ["Fecha",   fmtDateTime(schedule?.start_time)],
                ["Formato", [schedule?.format, LANG_LABEL[schedule?.language_type] ?? schedule?.language_type].filter(Boolean).join(" · ") || "—"],
                ["Asientos", seatLabels || "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <p style={{ fontSize: 11, color: C.grayDark, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, fontFamily: "'Montserrat', sans-serif" }}>{k}</p>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14, wordBreak: "break-word" }}>{v}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <p style={{ fontSize: 11, color: C.grayDark, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, fontFamily: "'Montserrat', sans-serif" }}>Comprador</p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 14 }}>{user?.name ?? "—"}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: C.grayDark, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, fontFamily: "'Montserrat', sans-serif" }}>Total</p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 18, color: C.green }}>${Number(total).toFixed(2)}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: C.grayDark, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, fontFamily: "'Montserrat', sans-serif" }}>Pago</p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 14 }}>{PAYMENT_LABEL[payment_method] ?? payment_method}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: C.grayDark, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, fontFamily: "'Montserrat', sans-serif" }}>Estado</p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14, color: isPending ? "#E59309" : C.green }}>
                  {isPending ? "Pendiente" : "Confirmado"}
                </p>
              </div>
            </div>
          </div>

          {/* Segunda perforación */}
          <div style={{ height: 20, position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: -10, width: 20, height: 20, borderRadius: "50%", background: C.bg }} />
            <div style={{ flex: 1, height: 1, borderTop: `2px dashed ${C.border}`, margin: "0 14px" }} />
            <div style={{ position: "absolute", right: -10, width: 20, height: 20, borderRadius: "50%", background: C.bg }} />
          </div>

          {/* QR + código */}
          <div style={{ padding: "20px 28px 24px", display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ background: C.white, padding: 8, borderRadius: 6, flexShrink: 0 }}>
              <QRCode code={refCode} />
            </div>
            <div>
              <p style={{ fontSize: 10, color: C.grayDark, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, fontFamily: "'Montserrat', sans-serif" }}>
                {isPending ? "ID de compra" : "Código de ticket"}
              </p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: 2, color: C.white }}>{refCode}</p>
              <p style={{ fontSize: 11, color: C.grayDark, marginTop: 6 }}>
                {isPending ? "Paga en taquilla para activar tu ticket" : "Presenta este código en taquilla"}
              </p>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <BtnPrimary
            onClick={() => addToast("Próximamente disponible", "info")}
            style={{ flex: 1, padding: 13, fontSize: 14 }}
          >
            ⬇ Descargar comprobante
          </BtnPrimary>
          <BtnSecondary
            onClick={() => addToast("Compartir próximamente", "info")}
            style={{ padding: "13px 20px" }}
          >
            Compartir
          </BtnSecondary>
        </div>
      </div>
    </div>
  );
}
