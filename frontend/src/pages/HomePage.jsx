import { useState, useEffect } from "react";
import { C } from "../constants/theme";
import { getMovies } from "../api/movies";
import Spinner from "../components/ui/Spinner";

function fmtDuration(mins) {
  if (!mins) return "";
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function HomePage({ setPage, setSelectedMovie }) {
  const [movies, setMovies]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [hovered, setHovered]         = useState(null);
  const [genreFilter, setGenreFilter] = useState("Todos");

  const [carousel, setCarousel] = useState([]);

  useEffect(() => {
    getMovies()
      .then(data => {
        setMovies(data);
        // 5 películas aleatorias para el carrusel, fijas por sesión
        const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, 5);
        setCarousel(shuffled);
      })
      .catch(() => setError("No se pudo cargar la cartelera"))
      .finally(() => setLoading(false));
  }, []);

  // Auto-avance del carrusel cada 6 segundos
  useEffect(() => {
    if (carousel.length <= 1) return;
    const id = setInterval(() => setFeaturedIndex(i => (i + 1) % carousel.length), 6000);
    return () => clearInterval(id);
  }, [carousel.length]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner />
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.gray }}>
      {error}
    </div>
  );

  const genres        = ["Todos", ...new Set(movies.map(m => m.genre).filter(Boolean))];
  const filteredMovies = genreFilter === "Todos" ? movies : movies.filter(m => m.genre === genreFilter);
  const featured = carousel[featuredIndex];

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* ── Carrusel hero ─────────────────────────────────────────────────── */}
      {featured && (
        <div style={{ position: "relative", height: "88vh", display: "flex", alignItems: "flex-end", overflow: "hidden" }}>

          {/* Fondos superpuestos: solo el activo es visible (cross-fade) */}
          {carousel.map((m, i) => (
            m.poster_url
              ? <img key={m.id} src={m.poster_url} alt={m.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: i === featuredIndex ? 0.38 : 0, transition: "opacity .9s ease" }} />
              : <div key={m.id} style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1a0a0a 0%, #2a0a0a 100%)", opacity: i === featuredIndex ? 1 : 0, transition: "opacity .9s ease" }} />
          ))}

          {/* Degradado inferior */}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${C.bg} 0%, ${C.bg}55 40%, transparent 70%)` }} />

          {/* Contenido — key fuerza el re-render y re-dispara la animación */}
          <div key={featuredIndex} style={{ position: "relative", padding: "0 60px 72px", animation: "fadeUp .55s ease forwards" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ background: C.red, color: C.white, padding: "3px 10px", borderRadius: 2, fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 700, letterSpacing: 1 }}>DESTACADA</span>
              <span style={{ color: C.gray, fontSize: 13 }}>{featured.genre} · {fmtDuration(featured.duration_minutes)}</span>
              {featured.rating && <span style={{ background: C.grayDarker, color: C.gray, padding: "2px 8px", borderRadius: 2, fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}>{featured.rating}</span>}
            </div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, letterSpacing: 4, lineHeight: 1, marginBottom: 16, color: C.white }}>{featured.title}</h1>
            <p style={{ color: C.gray, fontSize: 15, maxWidth: 500, lineHeight: 1.7, marginBottom: 24 }}>{featured.synopsis ?? ""}</p>
            <span
              onClick={() => { setSelectedMovie(featured); setPage("movie-detail"); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.white, fontSize: 14, fontFamily: "'Montserrat', sans-serif", fontWeight: 600, cursor: "pointer", borderBottom: `1px solid ${C.white}40`, paddingBottom: 2, transition: "border-color .2s, color .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.white; e.currentTarget.style.color = C.white; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${C.white}40`; }}
            >
              Ver detalles →
            </span>
          </div>

          {/* Dots de navegación */}
          <div style={{ position: "absolute", bottom: 28, right: 60, display: "flex", gap: 8, alignItems: "center" }}>
            {carousel.map((_, i) => (
              <button key={i} onClick={() => setFeaturedIndex(i)} style={{
                width: i === featuredIndex ? 28 : 8, height: 8, borderRadius: 4, padding: 0,
                background: i === featuredIndex ? C.red : C.border,
                border: "none", cursor: "pointer", transition: "all .35s",
              }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Grid de películas ──────────────────────────────────────────────── */}
      <div style={{ padding: "0 40px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 3, color: C.white }}>PELÍCULAS DISPONIBLES</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {genres.map(g => (
              <button key={g} onClick={() => setGenreFilter(g)} style={{
                padding: "5px 14px", borderRadius: 20,
                border: `1px solid ${genreFilter === g ? C.red : C.border}`,
                background: genreFilter === g ? C.redGlow : C.card,
                color: genreFilter === g ? C.white : C.gray,
                fontFamily: "'Open Sans', sans-serif", fontSize: 12, cursor: "pointer", transition: "all .2s",
              }}>{g}</button>
            ))}
          </div>
        </div>

        {movies.length === 0
          ? <p style={{ color: C.grayDark, textAlign: "center", padding: 40 }}>No hay películas en cartelera.</p>
          : (
            <div className="movies-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {filteredMovies.map((m, i) => (
                <div key={m.id}
                  onClick={() => { setSelectedMovie(m); setPage("movie-detail"); }}
                  style={{ background: C.card, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}`, cursor: "pointer", animation: `fadeUp .5s ease ${i * .1}s both`, transition: "box-shadow .25s, transform .25s", transform: hovered === m.id ? "translateY(-4px)" : "translateY(0)", boxShadow: hovered === m.id ? "0 16px 48px rgba(0,0,0,.7)" : "none" }}
                  onMouseEnter={() => setHovered(m.id)} onMouseLeave={() => setHovered(null)}>
                  <div style={{ position: "relative", paddingTop: "150%", background: C.surface, overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0 }}>
                      {m.poster_url
                        ? <img src={m.poster_url} alt={m.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .35s", transform: hovered === m.id ? "scale(1.06)" : "scale(1)" }} />
                        : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #3a1a1a, #2a2a3a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, color: C.grayDarker, transition: "transform .35s", transform: hovered === m.id ? "scale(1.12)" : "scale(1)" }}>
                              {m.title?.[0]}
                            </span>
                          </div>
                      }
                    </div>
                    {/* Overlay hover */}
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.58)", display: "flex", alignItems: "center", justifyContent: "center", opacity: hovered === m.id ? 1 : 0, transition: "opacity .25s" }}>
                      <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14, color: C.white, letterSpacing: 1, transform: hovered === m.id ? "translateY(0)" : "translateY(8px)", transition: "transform .25s" }}>
                        Ver detalles →
                      </span>
                    </div>
                    {m.rating && (
                      <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,.75)", borderRadius: 4, padding: "3px 8px", fontSize: 12, color: C.white, fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}>
                        {m.rating}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, color: C.white, marginBottom: 8 }}>{m.title}</h3>
                    <div style={{ display: "flex", gap: 8 }}>
                      {m.genre && <span style={{ background: C.grayDarker, color: C.gray, fontSize: 11, padding: "2px 8px", borderRadius: 2 }}>{m.genre}</span>}
                      {m.duration_minutes && <span style={{ background: C.grayDarker, color: C.gray, fontSize: 11, padding: "2px 8px", borderRadius: 2 }}>{fmtDuration(m.duration_minutes)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      <style>{`
        @media (max-width: 900px) {
          .movies-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .movies-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
