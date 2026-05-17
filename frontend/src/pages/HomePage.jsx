import { useState, useEffect } from "react";
import { C } from "../constants/theme";
import { getMovies } from "../api/movies";
import BtnPrimary from "../components/ui/BtnPrimary";
import BtnSecondary from "../components/ui/BtnSecondary";
import Spinner from "../components/ui/Spinner";

function fmtDuration(mins) {
  if (!mins) return "";
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function HomePage({ setPage, setSelectedMovie }) {
  const [movies, setMovies]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [hovered, setHovered]   = useState(null);
  const [genreFilter, setGenreFilter] = useState("Todos");

  useEffect(() => {
    getMovies()
      .then(setMovies)
      .catch(() => setError("No se pudo cargar la cartelera"))
      .finally(() => setLoading(false));
  }, []);

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

  const genres = ["Todos", ...new Set(movies.map(m => m.genre).filter(Boolean))];
  const filteredMovies = genreFilter === "Todos" ? movies : movies.filter(m => m.genre === genreFilter);
  const featured = movies[0];

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Hero */}
      {featured && (
        <div style={{ position: "relative", height: "88vh", display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
          {featured.poster_url
            ? <img src={featured.poster_url} alt={featured.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }} />
            : <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1a0a0a 0%, #2a0a0a 100%)" }} />
          }
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${C.bg} 0%, transparent 60%)` }} />
          <div style={{ position: "relative", padding: "0 60px 60px", animation: "fadeUp .7s ease forwards" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ background: C.red, color: C.white, padding: "3px 10px", borderRadius: 2, fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 700, letterSpacing: 1 }}>ESTRENO</span>
              <span style={{ color: C.gray, fontSize: 13 }}>{featured.genre} · {fmtDuration(featured.duration_minutes)}</span>
              {featured.rating && <span style={{ background: C.grayDarker, color: C.gray, padding: "2px 8px", borderRadius: 2, fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}>{featured.rating}</span>}
            </div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, letterSpacing: 4, lineHeight: 1, marginBottom: 16, color: C.white }}>{featured.title}</h1>
            <p style={{ color: C.gray, fontSize: 15, maxWidth: 480, lineHeight: 1.7, marginBottom: 28 }}>{featured.synopsis ?? ""}</p>
            <div style={{ display: "flex", gap: 12 }}>
              <BtnPrimary onClick={() => { setSelectedMovie(featured); setPage("seats"); }} style={{ padding: "13px 28px", fontSize: 14 }}>🎟 Comprar boleto</BtnPrimary>
              <BtnSecondary onClick={() => { setSelectedMovie(featured); setPage("movie-detail"); }} style={{ padding: "13px 28px", fontSize: 14 }}>Ver detalles</BtnSecondary>
            </div>
          </div>
        </div>
      )}

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
                fontFamily: "'Open Sans', sans-serif", fontSize: 12, cursor: "pointer", transition: "all .2s",
              }}>{g}</button>
            ))}
          </div>
        </div>

        {movies.length === 0
          ? <p style={{ color: C.grayDark, textAlign: "center", padding: 40 }}>No hay películas en cartelera.</p>
          : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {filteredMovies.map((m, i) => (
                <div key={m.id} className="hover-lift"
                  style={{ background: C.card, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}`, cursor: "pointer", animation: `fadeUp .5s ease ${i * .1}s both` }}
                  onMouseEnter={() => setHovered(m.id)} onMouseLeave={() => setHovered(null)}>
                  <div style={{ position: "relative", paddingTop: "150%", background: C.surface, overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0 }}>
                      {m.poster_url
                        ? <img src={m.poster_url} alt={m.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .3s", transform: hovered === m.id ? "scale(1.08)" : "scale(1)" }} />
                        : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #3a1a1a, #2a2a3a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, color: C.grayDarker, transition: "transform .3s", transform: hovered === m.id ? "scale(1.15)" : "scale(1)" }}>
                              {m.title?.[0]}
                            </span>
                          </div>
                      }
                    </div>
                    {m.rating && (
                      <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,.75)", borderRadius: 4, padding: "3px 8px", fontSize: 12, color: C.white, fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}>
                        {m.rating}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "16px 18px" }}>
                    <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: C.white, marginBottom: 8 }}>{m.title}</h3>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      {m.genre && <span style={{ background: C.grayDarker, color: C.gray, fontSize: 11, padding: "2px 8px", borderRadius: 2 }}>{m.genre}</span>}
                      {m.duration_minutes && <span style={{ background: C.grayDarker, color: C.gray, fontSize: 11, padding: "2px 8px", borderRadius: 2 }}>{fmtDuration(m.duration_minutes)}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <BtnPrimary onClick={() => { setSelectedMovie(m); setPage("seats"); }} style={{ flex: 1, padding: "9px 12px", fontSize: 12 }}>Comprar</BtnPrimary>
                      <BtnSecondary onClick={() => { setSelectedMovie(m); setPage("movie-detail"); }} style={{ padding: "9px 14px", fontSize: 12 }}>Info</BtnSecondary>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}
