import { C } from "../constants/theme";
import BtnPrimary from "../components/ui/BtnPrimary";

const PAYMENT_LABEL = { cash: "Efectivo", card: "Tarjeta", online: "En línea" };
const LANG_LABEL    = { original: "Original", dubbed: "Doblada", subtitled: "Subtitulada" };

function fmtDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("es-MX", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
}

function Row({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 13, color: C.gray }}>{label}</span>
      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: highlight ? 700 : 500, fontSize: highlight ? 16 : 14, color: highlight ? C.white : C.gray }}>
        {value}
      </span>
    </div>
  );
}

export default function TicketPage({ movie, schedule, purchaseResult, user, setPage }) {
  if (!purchaseResult) {
    return <div style={{ padding: 80, textAlign: "center", color: C.gray }}>No hay comprobante disponible</div>;
  }

  const { purchase_id, seats, total, payment_method } = purchaseResult;
  const seatLabels  = seats.map(s => `${s.row}${s.seat_number}`).join(", ");
  const isSingle    = seats.length === 1;
  const format      = [schedule?.format, LANG_LABEL[schedule?.language_type] ?? schedule?.language_type].filter(Boolean).join(" · ") || "—";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "100px 24px 40px" }}>
      <div style={{ width: "100%", maxWidth: 460, animation: "ticketSlide .5s cubic-bezier(.22,.68,0,1.2) forwards" }}>

        {/* Badge de éxito */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.greenDim, border: `2px solid ${C.green}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 14px" }}>✓</div>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 20, marginBottom: 6 }}>¡Compra registrada!</h2>
          <p style={{ color: C.gray, fontSize: 14 }}>Resumen de tu pedido · #{purchase_id}</p>
        </div>

        {/* Tarjeta resumen */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>

          {/* Header película */}
          <div style={{ display: "flex", gap: 14, alignItems: "center", padding: "18px 20px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 44, height: 60, background: C.surface, borderRadius: 4, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {movie?.poster_url
                ? <img src={movie.poster_url} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: C.grayDark }}>{movie?.title?.[0]}</span>
              }
            </div>
            <div>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16 }}>{movie?.title ?? "Película"}</p>
              {movie?.genre && <p style={{ color: C.grayDark, fontSize: 12, marginTop: 3 }}>{movie.genre}</p>}
            </div>
          </div>

          {/* Filas de datos */}
          <div style={{ padding: "4px 20px 12px" }}>
            <Row label="Sala"           value={schedule?.room?.name ?? "—"} />
            <Row label="Fecha y hora"   value={fmtDateTime(schedule?.start_time)} />
            <Row label="Formato"        value={format} />
            <Row label={`Asiento${seats.length > 1 ? "s" : ""}`} value={seatLabels} />
            <Row label="Comprador"      value={user?.name ?? "—"} />
            <Row label="Método de pago" value={PAYMENT_LABEL[payment_method] ?? payment_method} />
            <Row label="Total"          value={`$${Number(total).toFixed(2)}`} highlight />
          </div>
        </div>

        {/* CTA */}
        <div style={{ marginTop: 24 }}>
          <BtnPrimary onClick={() => setPage("my-tickets")} style={{ width: "100%", padding: 14, fontSize: 14 }}>
            {isSingle ? "Ver mi ticket" : "Ver mis tickets"}
          </BtnPrimary>
          <button
            onClick={() => setPage("home")}
            style={{ width: "100%", marginTop: 10, background: "none", border: "none", color: C.grayDark, fontSize: 13, cursor: "pointer", fontFamily: "'Open Sans', sans-serif", padding: "8px 0" }}
          >
            Volver a la cartelera
          </button>
        </div>
      </div>
    </div>
  );
}
