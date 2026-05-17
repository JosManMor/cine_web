import { useState, useEffect } from "react";
import { C } from "../constants/theme";
import { getMovie } from "../api/movies";
import BtnPrimary from "../components/ui/BtnPrimary";
import Spinner from "../components/ui/Spinner";

function fmtDuration(mins) {
  if (!mins) return "";
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function fmtDateTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("es-MX", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
}

const LANG_LABEL = { original: "Original", dubbed: "Doblada", subtitled: "Subtitulada" };

export default function MovieDetailPage({ movie, setPage, setSelectedSchedule }) {
  const [detail, setDetail]               = useState(null);
  const [loading, setLoading]             = useState(false);
  const [selectedScreening, setSelectedScreening] = useState(null);

  useEffect(() => {
    if (!movie?.id) return;
    setLoading(true);
    setDetail(null);
    setSelectedScreening(null);
    getMovie(movie.id)
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [movie?.id]);

  if (!movie) return (
    <div style={{ padding: 80, textAlign: "center", color: C.gray }}>Selecciona una película</div>
  );

  const m         = detail ?? movie;
  const screenings = detail?.screenings ?? [];

  return (
    <div style={{ minHeight: "100vh", paddingTop: 80 }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 40px" }}>
        <button onClick={() => setPage("home")} style={{ background: "none", border: "none", color: C.gray, fontSize: 13, cursor: "pointer", marginBottom: 24, fontFamily: "'Open Sans', sans-serif" }}>
          ← Volver a cartelera
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 40, animation: "fadeUp .5s ease forwards" }}>
          {/* Poster */}
          <div style={{ height: 420, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
            {m.poster_url
              ? <img src={m.poster_url} alt={m.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #3a1a1a, #2a2a3a)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue', sans-serif", fontSize: 80, color: C.grayDarker }}>
                  {m.title?.[0]}
                </div>
            }
          </div>

          {/* Info */}
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {m.genre && (
                <span style={{ background: C.red, color: C.white, padding: "3px 10px", borderRadius: 2, fontSize: 11, fontWeight: 700, fontFamily: "'Montserrat', sans-serif" }}>
                  {m.genre.toUpperCase()}
                </span>
              )}
              {m.duration_minutes && (
                <span style={{ background: C.grayDarker, color: C.gray, padding: "3px 10px", borderRadius: 2, fontSize: 11 }}>
                  {fmtDuration(m.duration_minutes)}
                </span>
              )}
              {m.rating && (
                <span style={{ background: C.grayDarker, color: C.gray, padding: "3px 10px", borderRadius: 2, fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}>
                  {m.rating}
                </span>
              )}
            </div>

            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 54, letterSpacing: 3, marginBottom: 8 }}>{m.title}</h1>

            {m.director && (
              <p style={{ color: C.grayDark, fontSize: 13, marginBottom: 16 }}>Dir. {m.director}</p>
            )}

            {m.synopsis && (
              <p style={{ color: C.gray, lineHeight: 1.8, fontSize: 15, marginBottom: 24 }}>{m.synopsis}</p>
            )}

            {/* Funciones */}
            {loading && <Spinner />}

            {!loading && screenings.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: 12, color: C.grayDark, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1, fontFamily: "'Montserrat', sans-serif" }}>
                  Selecciona función
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {screenings.map(s => {
                    const isSelected = selectedScreening?.id === s.id;
                    return (
                      <button key={s.id} onClick={() => setSelectedScreening(s)} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "10px 16px", borderRadius: 4, width: "100%", textAlign: "left",
                        border: `1px solid ${isSelected ? C.red : C.border}`,
                        background: isSelected ? C.redGlow : C.card,
                        color: C.white, fontSize: 13, cursor: "pointer", transition: "all .2s",
                      }}>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>
                          {fmtDateTime(s.start_time)}
                        </span>
                        <span style={{ color: C.gray, fontSize: 12 }}>
                          {s.format} · {LANG_LABEL[s.language_type] ?? s.language_type}
                        </span>
                        <span style={{ color: s.room.available_seats > 0 ? C.green : C.red, fontSize: 12 }}>
                          {s.room.available_seats} disponibles
                        </span>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}>
                          ${Number(s.base_price).toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!loading && detail && screenings.length === 0 && (
              <p style={{ color: C.grayDark, fontSize: 14, marginBottom: 32 }}>
                No hay funciones disponibles para esta película.
              </p>
            )}

            <BtnPrimary
              onClick={() => {
                const screening = selectedScreening ?? screenings[0] ?? null;
                setSelectedSchedule(screening);
                setPage("seats");
              }}
              disabled={!screenings.length}
              style={{ padding: "13px 32px", fontSize: 14 }}>
              🎟 Seleccionar asientos
            </BtnPrimary>
          </div>
        </div>
      </div>
    </div>
  );
}
