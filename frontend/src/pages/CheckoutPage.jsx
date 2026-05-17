import { useState } from "react";
import { C } from "../constants/theme";
import BtnPrimary from "../components/ui/BtnPrimary";
import Spinner from "../components/ui/Spinner";

export default function CheckoutPage({ movie, user, setPage, addToast }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handlePurchase = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); addToast("¡Compra exitosa! 🎉", "success"); }, 2200);
  };

  if (done) {
    setTimeout(() => setPage("ticket"), 800);
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 64, flexDirection: "column", gap: 16, animation: "popIn .4s ease forwards" }}>
        <div style={{ width: 72, height: 72, background: C.green, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>✓</div>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 20 }}>¡Compra confirmada!</p>
        <p style={{ color: C.gray, fontSize: 14 }}>Generando tu ticket digital...</p>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", paddingTop: 80 }}>
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "40px 24px", animation: "fadeUp .5s ease forwards" }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 3, marginBottom: 28 }}>CONFIRMAR COMPRA</h2>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 14, color: C.gray, textTransform: "uppercase", letterSpacing: 1 }}>Resumen de orden</h3>
          <div style={{ display: "flex", gap: 16, alignItems: "center", paddingBottom: 16, marginBottom: 16, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 60, height: 80, background: `radial-gradient(${movie?.color || C.red}33, ${C.surface})`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{movie?.emoji || "🎬"}</div>
            <div>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16 }}>{movie?.title || "Película"}</p>
              <p style={{ color: C.gray, fontSize: 13, marginTop: 4 }}>Sala 1 · {movie?.schedule[0] || "21:00"}</p>
              <p style={{ color: C.gray, fontSize: 13 }}>2 asientos · A3, A4</p>
            </div>
          </div>
          {[["Subtotal", "$170.00"], ["Cargo por servicio", "$10.00"], ["Total", "$180.00"]].map(([k, v], i) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: i === 2 ? 16 : 13, padding: "6px 0", borderTop: i === 2 ? `1px solid ${C.border}` : "none", marginTop: i === 2 ? 8 : 0 }}>
              <span style={{ color: i === 2 ? C.white : C.gray, fontFamily: i === 2 ? "'Montserrat', sans-serif" : "inherit", fontWeight: i === 2 ? 700 : 400 }}>{k}</span>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: i === 2 ? 700 : 500 }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 16, color: C.gray, textTransform: "uppercase", letterSpacing: 1 }}>Datos del comprador</h3>
          {[["Nombre completo", user?.name || ""], ["Correo electrónico", user?.email || ""]].map(([label, val]) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <label>{label}</label>
              <input defaultValue={val} placeholder={label} />
            </div>
          ))}
        </div>

        {loading
          ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: 32, background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <Spinner />
            <p style={{ color: C.gray, fontSize: 14, animation: "shimmer 1s ease infinite" }}>Procesando pago y generando ticket...</p>
            <p style={{ color: C.grayDark, fontSize: 12 }}>No cierres esta ventana</p>
          </div>
          : <BtnPrimary onClick={handlePurchase} style={{ width: "100%", padding: 14, fontSize: 15 }}>🔒 Confirmar y pagar</BtnPrimary>
        }
      </div>
    </div>
  );
}
