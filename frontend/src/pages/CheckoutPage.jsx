import { useState } from "react";
import { C } from "../constants/theme";
import { createPurchase } from "../api/purchases";
import BtnPrimary from "../components/ui/BtnPrimary";
import Spinner from "../components/ui/Spinner";

const PAYMENT_METHODS = [
  { id: "cash",   label: "Efectivo" },
  { id: "card",   label: "Tarjeta"  },
  { id: "online", label: "En línea" },
];

function fmtDateTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("es-MX", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function CheckoutPage({ movie, schedule, user, selectedSeats = [], setPage, addToast, setPurchaseResult }) {
  const [loading, setLoading]             = useState(false);
  const [done, setDone]                   = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  if (!selectedSeats.length) {
    return (
      <div style={{ padding: 80, textAlign: "center", color: C.gray }}>
        <p>No hay asientos seleccionados.</p>
        <button onClick={() => setPage("seats")} style={{ marginTop: 16, background: "none", border: `1px solid ${C.border}`, color: C.gray, padding: "8px 20px", borderRadius: 4, cursor: "pointer", fontSize: 13 }}>
          ← Volver a selección de asientos
        </button>
      </div>
    );
  }

  const unitPrice  = Number(schedule?.base_price ?? 0);
  const total      = selectedSeats.length * unitPrice;
  const seatLabels = selectedSeats.map(s => `${s.row}${s.seat_number}`).join(", ");

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const result = await createPurchase({
        screening_id:   schedule.id,
        seats:          selectedSeats,
        payment_method: paymentMethod,
      });
      setPurchaseResult({
        purchase_id:    result.purchase_id,
        payment_status: result.payment_status,
        seats:          selectedSeats,
        total,
        payment_method: paymentMethod,
      });
      setDone(true);
      addToast("Compra registrada con éxito", "success");
      setTimeout(() => setPage("ticket"), 800);
    } catch (err) {
      if (err.response?.status === 409) {
        addToast("Uno o más asientos ya fueron reservados. Elige otros.", "error");
        setPage("seats");
      } else {
        addToast(err.response?.data?.message ?? "Error al procesar la compra", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 64, flexDirection: "column", gap: 16, animation: "popIn .4s ease forwards" }}>
        <div style={{ width: 72, height: 72, background: C.green, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>✓</div>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 20 }}>¡Compra registrada!</p>
        <p style={{ color: C.gray, fontSize: 14 }}>Generando comprobante...</p>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", paddingTop: 80 }}>
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "40px 24px", animation: "fadeUp .5s ease forwards" }}>
        <button onClick={() => setPage("seats")} style={{ background: "none", border: "none", color: C.gray, fontSize: 13, cursor: "pointer", marginBottom: 24, fontFamily: "'Open Sans', sans-serif" }}>← Volver a asientos</button>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 3, marginBottom: 28 }}>CONFIRMAR COMPRA</h2>

        {/* Resumen */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 14, color: C.gray, textTransform: "uppercase", letterSpacing: 1 }}>Resumen de orden</h3>
          <div style={{ display: "flex", gap: 16, alignItems: "center", paddingBottom: 16, marginBottom: 16, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 60, height: 80, background: C.surface, borderRadius: 6, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {movie?.poster_url
                ? <img src={movie.poster_url} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: C.grayDark }}>{movie?.title?.[0] ?? "?"}</span>
              }
            </div>
            <div>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16 }}>{movie?.title ?? "Película"}</p>
              <p style={{ color: C.gray, fontSize: 13, marginTop: 4 }}>
                {schedule?.room?.name ?? "Sala"} · {fmtDateTime(schedule?.start_time)}
              </p>
              <p style={{ color: C.gray, fontSize: 13 }}>
                {selectedSeats.length} asiento{selectedSeats.length !== 1 ? "s" : ""} · {seatLabels}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0" }}>
            <span style={{ color: C.gray }}>Precio por asiento</span>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}>${unitPrice.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0" }}>
            <span style={{ color: C.gray }}>Cantidad</span>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}>×{selectedSeats.length}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, padding: "10px 0 0", borderTop: `1px solid ${C.border}`, marginTop: 8 }}>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}>Total</span>
            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, color: C.white }}>${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Método de pago */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 14, color: C.gray, textTransform: "uppercase", letterSpacing: 1 }}>Método de pago</h3>
          <div style={{ display: "flex", gap: 10 }}>
            {PAYMENT_METHODS.map(m => (
              <button
                key={m.id}
                onClick={() => setPaymentMethod(m.id)}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 6, fontSize: 13,
                  border: `1px solid ${paymentMethod === m.id ? C.red : C.border}`,
                  background: paymentMethod === m.id ? C.redGlow : C.surface,
                  color: paymentMethod === m.id ? C.white : C.gray,
                  cursor: "pointer", transition: "all .2s",
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: paymentMethod === m.id ? 600 : 400,
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {loading
          ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: 32, background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
              <Spinner />
              <p style={{ color: C.gray, fontSize: 14, animation: "shimmer 1s ease infinite" }}>Procesando compra...</p>
              <p style={{ color: C.grayDark, fontSize: 12 }}>No cierres esta ventana</p>
            </div>
          : <BtnPrimary onClick={handlePurchase} style={{ width: "100%", padding: 14, fontSize: 15 }}>
              Confirmar compra
            </BtnPrimary>
        }
      </div>
    </div>
  );
}
