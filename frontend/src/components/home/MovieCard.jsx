import { useState } from "react";
import { C } from "../../constants/theme";
import { fmtDuration } from "../../utils/format";

export default function MovieCard({ movie, index, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      style={{ background: C.card, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}`, cursor: "pointer", animation: `fadeUp .5s ease ${index * 0.1}s both`, transition: "box-shadow .25s, transform .25s", transform: hovered ? "translateY(-4px)" : "translateY(0)", boxShadow: hovered ? "0 16px 48px rgba(0,0,0,.7)" : "none" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ position: "relative", paddingTop: "150%", background: C.surface, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          {movie.poster_url
            ? <img src={movie.poster_url} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .35s", transform: hovered ? "scale(1.06)" : "scale(1)" }} />
            : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #3a1a1a, #2a2a3a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, color: C.grayDarker, transition: "transform .35s", transform: hovered ? "scale(1.12)" : "scale(1)" }}>
                  {movie.title?.[0]}
                </span>
              </div>
          }
        </div>

        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.58)", display: "flex", alignItems: "center", justifyContent: "center", opacity: hovered ? 1 : 0, transition: "opacity .25s" }}>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14, color: C.white, letterSpacing: 1, transform: hovered ? "translateY(0)" : "translateY(8px)", transition: "transform .25s" }}>
            Ver detalles →
          </span>
        </div>

        {movie.rating && (
          <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,.75)", borderRadius: 4, padding: "3px 8px", fontSize: 12, color: C.white, fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}>
            {movie.rating}
          </div>
        )}
      </div>

      <div style={{ padding: "14px 16px" }}>
        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, color: C.white, marginBottom: 8 }}>{movie.title}</h3>
        <div style={{ display: "flex", gap: 8 }}>
          {movie.genre && <span style={{ background: C.grayDarker, color: C.gray, fontSize: 11, padding: "2px 8px", borderRadius: 2 }}>{movie.genre}</span>}
          {movie.duration_minutes && <span style={{ background: C.grayDarker, color: C.gray, fontSize: 11, padding: "2px 8px", borderRadius: 2 }}>{fmtDuration(movie.duration_minutes)}</span>}
        </div>
      </div>
    </div>
  );
}
