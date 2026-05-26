import { C } from "../../constants/theme";
import { fmtDuration } from "../../utils/format";

export default function HeroCarousel({ carousel, featuredIndex, setFeaturedIndex, setSelectedMovie, setPage }) {
  const featured = carousel[featuredIndex];
  if (!featured) return null;

  return (
    <div style={{ position: "relative", height: "88vh", display: "flex", alignItems: "flex-end", overflow: "hidden" }}>

      {carousel.map((m, i) => (
        m.poster_url
          ? <img key={m.id} src={m.poster_url} alt={m.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: i === featuredIndex ? 0.38 : 0, transition: "opacity .9s ease" }} />
          : <div key={m.id} style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1a0a0a 0%, #2a0a0a 100%)", opacity: i === featuredIndex ? 1 : 0, transition: "opacity .9s ease" }} />
      ))}

      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${C.bg} 0%, ${C.bg}55 40%, transparent 70%)` }} />

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
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedMovie(featured); setPage("movie-detail"); } }}
          tabIndex={0}
          role="link"
          aria-label={`Ver detalles de ${featured.title}`}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.white, fontSize: 14, fontFamily: "'Montserrat', sans-serif", fontWeight: 600, cursor: "pointer", borderBottom: `1px solid ${C.white}40`, paddingBottom: 2, transition: "border-color .2s, color .2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.white; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = `${C.white}40`; }}
        >
          Ver detalles →
        </span>
      </div>

      <div style={{ position: "absolute", bottom: 28, right: 60, display: "flex", gap: 8, alignItems: "center" }}>
        {carousel.map((_, i) => (
          <button key={i} onClick={() => setFeaturedIndex(i)} aria-label={`Ver película destacada ${i + 1}`} style={{
            width: i === featuredIndex ? 28 : 8, height: 8, borderRadius: 4, padding: 0,
            background: i === featuredIndex ? C.red : C.border,
            border: "none", cursor: "pointer", transition: "all .35s",
          }} />
        ))}
      </div>
    </div>
  );
}
