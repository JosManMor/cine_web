import { useState, useEffect } from "react";
import { C } from "../constants/theme";
import { getScreening } from "../api/purchases";
import BtnPrimary from "../components/ui/BtnPrimary";
import SmallSpinner from "../components/ui/SmallSpinner";

const LANG_LABEL = { original: "Original", dubbed: "Doblada", subtitled: "Subtitulada" };

function fmtTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function SeatsPage({ movie, schedule, setPage, addToast, user, setSelectedSeats }) {
  const [screeningData, setScreeningData] = useState(null);
  const [fetchLoading, setFetchLoading]   = useState(false);
  const [selected, setSelected]           = useState([]);
  const [confirming, setConfirming]       = useState(false);

  useEffect(() => {
    if (!schedule?.id) return;
    setFetchLoading(true);
    setSelected([]);
    getScreening(schedule.id)
      .then(setScreeningData)
      .catch(() => addToast("Error al cargar los asientos", "error"))
      .finally(() => setFetchLoading(false));
  }, [schedule?.id]);

  if (!movie)    return <div style={{ padding: 80, textAlign: "center", color: C.gray }}>Selecciona una película primero</div>;
  if (!schedule) return <div style={{ padding: 80, textAlign: "center", color: C.gray }}>Selecciona una función primero</div>;

  const rows        = screeningData?.room?.rows ?? 0;
  const seatsPerRow = screeningData?.room?.seats_per_row ?? 0;
  const occupied    = screeningData?.occupied_seats ?? [];
  const rowLabels   = Array.from({ length: rows }, (_, i) => String.fromCharCode(65 + i));
  const halfCol     = Math.floor(seatsPerRow / 2);

  const isOccupied = (r, n) => occupied.some(s => s.row === r && s.seat_number === n);
  const isSelected = (r, n) => selected.some(s => s.row === r && s.seat_number === n);

  const toggleSeat = (r, n) => {
    if (isOccupied(r, n)) return;
    setSelected(prev => {
      if (prev.some(s => s.row === r && s.seat_number === n))
        return prev.filter(s => !(s.row === r && s.seat_number === n));
      if (prev.length >= 8) { addToast("Máximo 8 asientos por compra", "error"); return prev; }
      return [...prev, { row: r, seat_number: n }];
    });
  };

  const getSeatStatus = (r, n) =>
    isOccupied(r, n) ? "occupied" : isSelected(r, n) ? "selected" : "free";

  const seatColor = (status) => ({
    free:     { bg: "transparent", border: C.green },
    selected: { bg: C.green,       border: C.green },
    occupied: { bg: "#FF0000",     border: "#FF0000" },
  }[status]);

  const unitPrice  = Number(schedule.base_price ?? 0);
  const total      = selected.length * unitPrice;
  const seatLabels = selected.map(s => `${s.row}${s.seat_number}`);
  const roomName   = screeningData?.room?.name ?? schedule.room?.name ?? "Sala";

  const handleConfirm = () => {
    if (!user) { addToast("Inicia sesión para comprar", "error"); setPage("login"); return; }
    if (!selected.length) { addToast("Selecciona al menos un asiento", "error"); return; }
    setConfirming(true);
    setSelectedSeats(selected);
    setTimeout(() => { setConfirming(false); setPage("checkout"); }, 400);
  };

  return (
    <div style={{ minHeight: "100vh", paddingTop: 80 }}>
      <div className="seats-container" style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px", animation: "fadeUp .5s ease forwards" }}>
        <button onClick={() => setPage("movie-detail")} style={{ background: "none", border: "none", color: C.gray, fontSize: 13, cursor: "pointer", marginBottom: 20, fontFamily: "'Open Sans', sans-serif" }}>← Volver</button>
        <div className="seats-layout" style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 28 }}>

          {/* Sala */}
          <div style={{ background: C.card, borderRadius: 10, border: `1px solid ${C.border}`, padding: "32px 24px" }}>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 2, marginBottom: 24, textAlign: "center" }}>
              {roomName.toUpperCase()} — {movie.title.toUpperCase()}
            </h2>

            {/* Pantalla */}
            <div style={{ perspective: "500px", marginBottom: 32 }}>
              <div style={{ width: "75%", margin: "0 auto", height: 10, background: "linear-gradient(90deg, transparent, #4FC3F7, transparent)", borderRadius: "0 0 40% 40%", transform: "rotateX(-20deg)", boxShadow: "0 0 24px rgba(79,195,247,.4)" }} />
              <p style={{ textAlign: "center", fontSize: 11, color: "#4FC3F7", marginTop: 8, letterSpacing: 2, textTransform: "uppercase" }}>Pantalla</p>
            </div>

            {/* Cargando */}
            {fetchLoading && (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                <SmallSpinner />
              </div>
            )}

            {/* Grilla de asientos */}
            {!fetchLoading && screeningData && (
              <div className="seats-scroll">
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                {rowLabels.map(rowLabel => (
                  <div key={rowLabel} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 16, textAlign: "center", fontSize: 11, color: C.grayDark, fontFamily: "'Montserrat', sans-serif" }}>{rowLabel}</span>
                    {Array.from({ length: seatsPerRow }, (_, i) => i + 1).flatMap(seatNum => {
                      const status = getSeatStatus(rowLabel, seatNum);
                      const col    = seatColor(status);
                      const gap    = seatNum === halfCol + 1
                        ? [<div key={`${rowLabel}-gap`} style={{ width: 10 }} />]
                        : [];
                      return [
                        ...gap,
                        <div
                          key={`${rowLabel}-${seatNum}`}
                          onClick={() => toggleSeat(rowLabel, seatNum)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSeat(rowLabel, seatNum); } }}
                          tabIndex={status === "occupied" ? -1 : 0}
                          role="checkbox"
                          aria-checked={status === "selected"}
                          aria-label={`Asiento ${rowLabel}${seatNum}, ${status === "occupied" ? "ocupado" : status === "selected" ? "seleccionado" : "disponible"}`}
                          title={`${rowLabel}${seatNum}`}
                          style={{
                            width: 26, height: 22, borderRadius: "4px 4px 2px 2px",
                            background: col.bg, border: `1.5px solid ${col.border}`,
                            cursor: status === "occupied" ? "not-allowed" : "pointer",
                            transition: "transform .15s, background .15s",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9,
                            transform: status === "selected" ? "scale(1.1)" : "scale(1)",
                          }}
                        >
                          {status === "selected" && <span style={{ color: "#0A2A12" }}>✓</span>}
                          {status === "occupied"  && <span style={{ color: "#5A0000", fontSize: 8 }}>✕</span>}
                        </div>,
                      ];
                    })}
                    <span style={{ width: 16, textAlign: "center", fontSize: 11, color: C.grayDark, fontFamily: "'Montserrat', sans-serif" }}>{rowLabel}</span>
                  </div>
                ))}
              </div>
              </div>
            )}

            {!fetchLoading && !screeningData && (
              <p style={{ textAlign: "center", color: C.grayDark, padding: "40px 0" }}>No se pudo cargar el mapa de asientos</p>
            )}

            {/* Leyenda */}
            {!fetchLoading && (
              <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 28 }}>
                {[["free", "Libre", C.green, "transparent"], ["selected", "Seleccionado", C.green, C.green], ["occupied", "Ocupado", "#FF0000", "#FF0000"]].map(([k, label, border, bg]) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.gray }}>
                    <div style={{ width: 16, height: 14, borderRadius: 2, border: `1.5px solid ${border}`, background: bg }} />
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel lateral */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                <div style={{ width: 48, height: 64, background: C.surface, borderRadius: 4, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {movie.poster_url
                    ? <img src={movie.poster_url} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: C.grayDark }}>{movie.title?.[0]}</span>
                  }
                </div>
                <div>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14 }}>{movie.title}</p>
                  <p style={{ color: C.gray, fontSize: 12, marginTop: 4 }}>
                    {fmtTime(schedule.start_time)}
                    {schedule.format ? ` · ${schedule.format}` : ""}
                    {schedule.language_type ? ` · ${LANG_LABEL[schedule.language_type] ?? schedule.language_type}` : ""}
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

            {confirming
              ? <div style={{ display: "flex", justifyContent: "center", padding: 24, background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <SmallSpinner />
                </div>
              : <BtnPrimary onClick={handleConfirm} disabled={!selected.length || fetchLoading} style={{ width: "100%", padding: 14, fontSize: 14 }}>
                  Confirmar {selected.length > 0 ? `(${selected.length})` : ""}
                </BtnPrimary>
            }
            <p style={{ fontSize: 11, color: C.grayDark, textAlign: "center" }}>Máximo 8 asientos por transacción</p>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 650px) {
          .seats-container { padding: 20px 12px !important; }
          .seats-layout    { grid-template-columns: 1fr !important; gap: 20px !important; }
          .seats-scroll    { overflow-x: auto; padding-bottom: 8px; }
        }
      `}</style>
    </div>
  );
}
