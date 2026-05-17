import { useState } from "react";
import { C } from "../constants/theme";
import { SEAT_LAYOUT, ROW_LABELS } from "../constants/mockData";
import BtnPrimary from "../components/ui/BtnPrimary";
import Spinner from "../components/ui/Spinner";

export default function SeatsPage({ movie, schedule, setPage, addToast, user }) {
  const [seats] = useState(() => SEAT_LAYOUT.map(row => row.map(s => s)));
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!movie) return <div style={{ padding: 80, textAlign: "center", color: C.gray }}>Selecciona una película primero</div>;

  const toggleSeat = (r, c) => {
    if (seats[r][c] === "O" || seats[r][c] === "A") return;
    const key = `${r}-${c}`;
    setSelected(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key);
      if (prev.length >= 8) { addToast("Máximo 8 asientos por compra", "error"); return prev; }
      return [...prev, key];
    });
  };

  const getSeatStatus = (r, c) => {
    const key = `${r}-${c}`;
    if (seats[r][c] === "A") return "aisle";
    if (seats[r][c] === "O") return "occupied";
    if (selected.includes(key)) return "selected";
    return "free";
  };

  const seatColor = (status) => ({
    free: { bg: "transparent", border: C.green },
    selected: { bg: C.green, border: C.green },
    occupied: { bg: "#FF0000", border: "#FF0000" },
    aisle: { bg: "transparent", border: "transparent" },
  }[status]);

  const unitPrice = (typeof schedule === "object" && schedule?.base_price) ? Number(schedule.base_price) : 85;
  const total = selected.length * unitPrice;
  const seatLabels = selected.map(k => {
    const [r, c] = k.split("-").map(Number);
    return `${ROW_LABELS[r]}${c + 1}`;
  });

  const handleConfirm = () => {
    if (!user) { addToast("Inicia sesión para comprar", "error"); setPage("login"); return; }
    if (!selected.length) { addToast("Selecciona al menos un asiento", "error"); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setPage("checkout"); }, 1800);
  };

  return (
    <div style={{ minHeight: "100vh", paddingTop: 80 }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px", animation: "fadeUp .5s ease forwards" }}>
        <button onClick={() => setPage("movie-detail")} style={{ background: "none", border: "none", color: C.gray, fontSize: 13, cursor: "pointer", marginBottom: 20, fontFamily: "'Open Sans', sans-serif" }}>← Volver</button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 28 }}>
          {/* Sala */}
          <div style={{ background: C.card, borderRadius: 10, border: `1px solid ${C.border}`, padding: "32px 24px" }}>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 2, marginBottom: 24, textAlign: "center" }}>SALA 1 — {movie.title.toUpperCase()}</h2>

            {/* Screen */}
            <div style={{ perspective: "500px", marginBottom: 32 }}>
              <div style={{ width: "75%", margin: "0 auto", height: 10, background: "linear-gradient(90deg, transparent, #4FC3F7, transparent)", borderRadius: "0 0 40% 40%", transform: "rotateX(-20deg)", boxShadow: "0 0 24px rgba(79,195,247,.4)" }} />
              <p style={{ textAlign: "center", fontSize: 11, color: "#4FC3F7", marginTop: 8, letterSpacing: 2, textTransform: "uppercase" }}>Pantalla</p>
            </div>

            {/* Seats grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
              {SEAT_LAYOUT.map((row, r) => (
                <div key={r} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 16, textAlign: "center", fontSize: 11, color: C.grayDark, fontFamily: "'Montserrat', sans-serif" }}>{ROW_LABELS[r]}</span>
                  {row.map((cell, c) => {
                    const status = getSeatStatus(r, c);
                    if (status === "aisle") return <div key={c} style={{ width: 10 }} />;
                    const col = seatColor(status);
                    return (
                      <div key={c} onClick={() => toggleSeat(r, c)} title={`${ROW_LABELS[r]}${c + 1}`} style={{
                        width: 26, height: 22, borderRadius: "4px 4px 2px 2px",
                        background: col.bg, border: `1.5px solid ${col.border}`,
                        cursor: status === "occupied" ? "not-allowed" : "pointer",
                        transition: "transform .15s, background .15s",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9,
                        transform: status === "selected" ? "scale(1.1)" : "scale(1)"
                      }}>
                        {status === "selected" && <span style={{ color: "#0A2A12" }}>✓</span>}
                        {status === "occupied" && <span style={{ color: "#5A0000", fontSize: 8 }}>✕</span>}
                      </div>
                    );
                  })}
                  <span style={{ width: 16, textAlign: "center", fontSize: 11, color: C.grayDark, fontFamily: "'Montserrat', sans-serif" }}>{ROW_LABELS[r]}</span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 28 }}>
              {[["free", "Libre", C.green, "transparent"], ["selected", "Seleccionado", C.green, C.green], ["occupied", "Ocupado", "#FF0000", "#FF0000"]].map(([k, label, border, bg]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.gray }}>
                  <div style={{ width: 16, height: 14, borderRadius: 2, border: `1.5px solid ${border}`, background: bg }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Summary sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                <div style={{ width: 48, height: 64, background: C.surface, borderRadius: 4, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {movie.poster_url
                    ? <img src={movie.poster_url} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: "#6B6B6B" }}>{movie.title?.[0]}</span>
                  }
                </div>
                <div>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14 }}>{movie.title}</p>
                  <p style={{ color: C.gray, fontSize: 12 }}>
                    {typeof schedule === "object" && schedule?.start_time
                      ? new Date(schedule.start_time).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false })
                      : schedule ?? ""}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: C.gray }}>Asientos</span>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 12, color: selected.length ? C.green : C.grayDark }}>
                    {selected.length ? seatLabels.join(", ") : "—"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: C.gray }}>Precio unitario</span>
                  <span>${unitPrice.toFixed(2)}</span>
                </div>
                <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>Total</span>
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 20, color: selected.length ? C.white : C.grayDark }}>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {loading
              ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: 24, background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
                <Spinner />
                <p style={{ fontSize: 13, color: C.gray, animation: "shimmer 1s infinite" }}>Procesando selección...</p>
              </div>
              : <BtnPrimary onClick={handleConfirm} disabled={!selected.length} style={{ width: "100%", padding: 14, fontSize: 14 }}>
                Confirmar {selected.length > 0 ? `(${selected.length})` : ""}
              </BtnPrimary>
            }
            <p style={{ fontSize: 11, color: C.grayDark, textAlign: "center" }}>Máximo 8 asientos por transacción</p>
          </div>
        </div>
      </div>
    </div>
  );
}
