import { useState } from "react";
import { C } from "../constants/theme";
import { MOVIES } from "../constants/mockData";
import BtnPrimary from "../components/ui/BtnPrimary";
import BtnSecondary from "../components/ui/BtnSecondary";

export default function HomePage({ setPage, setSelectedMovie }) {
  const featured = MOVIES[0];
  const [hovered, setHovered] = useState(null);
  const [genreFilter, setGenreFilter] = useState("Todos");
  const genres = ["Todos", ...new Set(MOVIES.map(m => m.genre))];
  const filteredMovies = genreFilter === "Todos" ? MOVIES : MOVIES.filter(m => m.genre === genreFilter);

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ position: "relative", height: "88vh", display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 60% 40%, ${featured.color}22 0%, transparent 60%), linear-gradient(135deg, ${C.bg} 0%, #2a0a0a 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 180, opacity: .07, userSelect: "none", position: "absolute" }}>{featured.emoji}</div>
        </div>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${C.bg} 0%, transparent 60%)` }} />
        <div style={{ position: "relative", padding: "0 60px 60px", animation: "fadeUp .7s ease forwards" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ background: C.red, color: C.white, padding: "3px 10px", borderRadius: 2, fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 700, letterSpacing: 1 }}>ESTRENO</span>
            <span style={{ color: C.gray, fontSize: 13 }}>{featured.genre} · {featured.duration}</span>
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, letterSpacing: 4, lineHeight: 1, marginBottom: 16, color: C.white }}>{featured.title}</h1>
          <p style={{ color: C.gray, fontSize: 15, maxWidth: 480, lineHeight: 1.7, marginBottom: 28 }}>{featured.synopsis}</p>
          <div style={{ display: "flex", gap: 12 }}>
            <BtnPrimary onClick={() => { setSelectedMovie(featured); setPage("seats"); }} style={{ padding: "13px 28px", fontSize: 14 }}>🎟 Comprar boleto</BtnPrimary>
            <BtnSecondary onClick={() => setPage("movie-detail")} style={{ padding: "13px 28px", fontSize: 14 }}>Ver detalles</BtnSecondary>
          </div>
        </div>
      </div>

      {/* Grid cartelera */}
      <div style={{ padding: "0 40px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 3, color: C.white }}>EN CARTELERA HOY</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {genres.map(g => (
              <button key={g} onClick={() => setGenreFilter(g)} style={{
                padding: "5px 14px", borderRadius: 20,
                border: `1px solid ${genreFilter === g ? C.red : C.border}`,
                background: genreFilter === g ? C.redGlow : C.card,
                color: genreFilter === g ? C.white : C.gray,
                fontFamily: "'Open Sans', sans-serif", fontSize: 12, cursor: "pointer", transition: "all .2s"
              }}>{g}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {filteredMovies.map((m, i) => (
            <div key={m.id} className="hover-lift" style={{ background: C.card, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}`, cursor: "pointer", animation: `fadeUp .5s ease ${i * .1}s both` }}
              onMouseEnter={() => setHovered(m.id)} onMouseLeave={() => setHovered(null)}>
              <div style={{ position: "relative", paddingTop: "150%", background: `radial-gradient(ellipse at center, ${m.color}33, ${C.surface})`, overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}>
                  <span style={{ transition: "transform .3s", transform: hovered === m.id ? "scale(1.15)" : "scale(1)" }}>{m.emoji}</span>
                </div>
                <div style={{ position: "absolute", top: 10, right: 10, background: `rgba(0,0,0,.7)`, borderRadius: 4, padding: "3px 8px", fontSize: 12, fontWeight: 700, color: m.seats < 20 ? "#FF6B6B" : C.green }}>
                  {m.seats < 20 ? "⚠ " : "✓ "}{m.seats} asientos
                </div>
                <div style={{ position: "absolute", top: 10, left: 10, background: `rgba(0,0,0,.7)`, borderRadius: 4, padding: "3px 8px", fontSize: 12, color: "#FFD700" }}>⭐ {m.rating}</div>
              </div>
              <div style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: C.white }}>{m.title}</h3>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <span style={{ background: C.grayDarker, color: C.gray, fontSize: 11, padding: "2px 8px", borderRadius: 2 }}>{m.genre}</span>
                  <span style={{ background: C.grayDarker, color: C.gray, fontSize: 11, padding: "2px 8px", borderRadius: 2 }}>{m.duration}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <BtnPrimary onClick={() => { setSelectedMovie(m); setPage("seats"); }} style={{ flex: 1, padding: "9px 12px", fontSize: 12 }}>Comprar</BtnPrimary>
                  <BtnSecondary onClick={() => { setSelectedMovie(m); setPage("movie-detail"); }} style={{ padding: "9px 14px", fontSize: 12 }}>Info</BtnSecondary>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
