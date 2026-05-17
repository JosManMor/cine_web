import { useState } from "react";
import { C } from "../constants/theme";
import BtnPrimary from "../components/ui/BtnPrimary";

export default function MovieDetailPage({ movie, setPage, setSelectedMovie, setSelectedSchedule }) {
  const [sched, setSched] = useState(null);
  if (!movie) return <div style={{ padding: 80, textAlign: "center", color: C.gray }}>Selecciona una película</div>;

  return (
    <div style={{ minHeight: "100vh", paddingTop: 80 }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 40px" }}>
        <button onClick={() => setPage("home")} style={{ background: "none", border: "none", color: C.gray, fontSize: 13, cursor: "pointer", marginBottom: 24, fontFamily: "'Open Sans', sans-serif" }}>← Volver a cartelera</button>
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 40, animation: "fadeUp .5s ease forwards" }}>
          <div>
            <div style={{ height: 420, background: `radial-gradient(ellipse at center, ${movie.color}44, ${C.surface})`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 100, border: `1px solid ${C.border}` }}>{movie.emoji}</div>
          </div>
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <span style={{ background: C.red, color: C.white, padding: "3px 10px", borderRadius: 2, fontSize: 11, fontWeight: 700, fontFamily: "'Montserrat', sans-serif" }}>{movie.genre.toUpperCase()}</span>
              <span style={{ background: C.grayDarker, color: C.gray, padding: "3px 10px", borderRadius: 2, fontSize: 11 }}>{movie.duration}</span>
            </div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 54, letterSpacing: 3, marginBottom: 8 }}>{movie.title}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <span style={{ color: "#FFD700", fontSize: 18 }}>⭐</span>
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 22 }}>{movie.rating}</span>
              <span style={{ color: C.grayDark, fontSize: 13 }}>/ 10</span>
            </div>
            <p style={{ color: C.gray, lineHeight: 1.8, fontSize: 15, marginBottom: 24 }}>{movie.synopsis}</p>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 12, color: C.grayDark, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Reparto</p>
              <p style={{ color: C.gray, fontSize: 14 }}>{movie.cast}</p>
            </div>
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 12, color: C.grayDark, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1, fontFamily: "'Montserrat', sans-serif" }}>Selecciona horario</p>
              <div style={{ display: "flex", gap: 10 }}>
                {movie.schedule.map(s => (
                  <button key={s} onClick={() => setSched(s)} style={{
                    padding: "10px 18px", borderRadius: 4, border: `1px solid ${sched === s ? C.red : C.border}`,
                    background: sched === s ? C.redGlow : C.card, color: sched === s ? C.white : C.gray,
                    fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all .2s"
                  }}>{s}</button>
                ))}
              </div>
            </div>
            <BtnPrimary onClick={() => { setSelectedSchedule(sched || movie.schedule[0]); setPage("seats"); }} style={{ padding: "13px 32px", fontSize: 14 }}>
              🎟 Seleccionar asientos
            </BtnPrimary>
          </div>
        </div>
      </div>
    </div>
  );
}
