import { useState, useEffect, useRef } from "react";

// ─── Tailwind-compatible inline design tokens ──────────────────────────────
const C = {
  bg: "#0A0A0A",
  surface: "#141414",
  card: "#1C1C1C",
  border: "#2A2A2A",
  red: "#E50914",
  redDark: "#B0060F",
  redGlow: "rgba(229,9,20,0.18)",
  green: "#46D369",
  greenDim: "rgba(70,211,105,0.15)",
  white: "#FFFFFF",
  gray: "#B3B3B3",
  grayDark: "#6B6B6B",
  grayDarker: "#2F2F2F",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@400;500&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: ${C.bg}; color: ${C.white}; font-family: 'Open Sans', sans-serif; overflow-x: hidden; }
::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: ${C.bg}; }
::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }

@keyframes fadeUp   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
@keyframes shimmer  { 0%,100% { opacity:.5; } 50% { opacity:1; } }
@keyframes spin     { to { transform: rotate(360deg); } }
@keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
@keyframes ticketSlide { from { opacity:0; transform:scale(.94) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
@keyframes popIn    { 0% { transform:scale(.8); opacity:0; } 60% { transform:scale(1.05); } 100% { transform:scale(1); opacity:1; } }
@keyframes toastIn  { from { opacity:0; transform:translateX(60px); } to { opacity:1; transform:translateX(0); } }

.fade-up   { animation: fadeUp .5s ease forwards; }
.fade-in   { animation: fadeIn .4s ease forwards; }
.ticket-in { animation: ticketSlide .5s cubic-bezier(.22,.68,0,1.2) forwards; }
.pop-in    { animation: popIn .35s cubic-bezier(.22,.68,0,1.2) forwards; }

.hover-scale { transition: transform .2s; }
.hover-scale:hover { transform: scale(1.03); }
.hover-lift  { transition: transform .2s, box-shadow .2s; }
.hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,.6); }

input, select { background: ${C.card}; border: 1px solid ${C.border}; color: ${C.white}; font-family: 'Open Sans', sans-serif; font-size: 14px; padding: 10px 14px; border-radius: 4px; width: 100%; outline: none; transition: border-color .2s; }
input:focus, select:focus { border-color: ${C.red}; }
input::placeholder { color: ${C.grayDark}; }
label { font-size: 13px; color: ${C.gray}; margin-bottom: 5px; display: block; font-family: 'Open Sans', sans-serif; }
`;

// ─── Mock data ─────────────────────────────────────────────────────────────
const MOVIES = [
  { id: 1, title: "Inferno Nexus", genre: "Acción", duration: "2h 18m", seats: 48, total: 120, rating: "8.4", color: "#E50914", emoji: "🔥", schedule: ["14:00", "17:30", "21:00"], synopsis: "Un ex-agente infiltrado debe detener una conspiración global antes de que el mundo colapse en llamas. Acción sin tregua en cada fotograma.", cast: "Marco Reyes, Ana Villanueva, Luis Serrano" },
  { id: 2, title: "Hollow Depths", genre: "Terror", duration: "1h 52m", seats: 12, total: 120, rating: "7.9", color: "#6B21A8", emoji: "👁️", schedule: ["15:00", "19:00", "23:00"], synopsis: "Cinco investigadores descienden a una cueva submarina inexplorada. Lo que encuentran desafía toda lógica y amenaza con no dejarlos salir.", cast: "Carmen Solís, Diego Paz, Ema Ruiz" },
  { id: 3, title: "Última Vuelta", genre: "Comedia", duration: "1h 44m", seats: 85, total: 120, rating: "7.2", color: "#F59E0B", emoji: "🏎️", schedule: ["13:00", "16:00", "20:30"], synopsis: "Tres amigos de la infancia se reencuentran en una carrera de autos amateur y descubren que la vida los ha cambiado... o quizá no tanto.", cast: "Pablo Mora, Sofía Leal, Tomás Ibarra" },
];

const SEAT_LAYOUT = [
  ["T", "T", "T", "T", "A", "T", "T", "T", "T", "A", "T", "T", "T", "T"],
  ["T", "T", "T", "T", "A", "T", "T", "T", "T", "A", "T", "T", "T", "T"],
  ["T", "T", "T", "T", "A", "T", "T", "T", "T", "A", "T", "T", "T", "T"],
  ["T", "T", "T", "T", "A", "T", "T", "O", "T", "A", "T", "T", "T", "T"],
  ["T", "T", "O", "T", "A", "T", "T", "T", "T", "A", "O", "T", "T", "T"],
  ["T", "T", "T", "T", "A", "O", "T", "T", "O", "A", "T", "T", "T", "T"],
  ["T", "T", "T", "T", "A", "T", "T", "T", "T", "A", "T", "T", "O", "T"],
];
const ROW_LABELS = ["A", "B", "C", "D", "E", "F", "G"];

function generateQRPattern(code) {
  const seed = code.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const size = 21;
  const grid = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      const isFinder = (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);
      if (isFinder) { row.push(1); continue; }
      row.push((seed * (r + 1) * (c + 1) + r * 17 + c * 13) % 3 === 0 ? 1 : 0);
    }
    grid.push(row);
  }
  return grid;
}

// ─── Reusable components ───────────────────────────────────────────────────

function BtnPrimary({ children, onClick, disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? C.grayDarker : C.red,
      color: disabled ? C.grayDark : C.white,
      border: "none", borderRadius: 4, padding: "11px 20px",
      fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 13,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "background .2s, transform .15s",
      letterSpacing: ".5px", textTransform: "uppercase", ...style
    }}
      onMouseEnter={e => !disabled && (e.target.style.background = C.redDark)}
      onMouseLeave={e => !disabled && (e.target.style.background = C.red)}
      onMouseDown={e => !disabled && (e.target.style.transform = "scale(.97)")}
      onMouseUp={e => !disabled && (e.target.style.transform = "scale(1)")}
    >{children}</button>
  );
}

function BtnSecondary({ children, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{
      background: "transparent", color: C.white,
      border: `1px solid ${C.red}`, borderRadius: 4, padding: "10px 20px",
      fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 13,
      cursor: "pointer", transition: "background .2s",
      letterSpacing: ".5px", textTransform: "uppercase", ...style
    }}
      onMouseEnter={e => (e.target.style.background = C.redGlow)}
      onMouseLeave={e => (e.target.style.background = "transparent")}
    >{children}</button>
  );
}

function Toast({ toasts }) {
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === "success" ? C.green : t.type === "error" ? C.red : C.card,
          color: t.type === "success" ? "#0A2A12" : C.white,
          padding: "12px 18px", borderRadius: 6, fontSize: 13,
          fontFamily: "'Open Sans', sans-serif", fontWeight: 500,
          animation: "toastIn .3s ease", minWidth: 240, boxShadow: "0 8px 24px rgba(0,0,0,.5)"
        }}>{t.msg}</div>
      ))}
    </div>
  );
}

function Spinner() {
  return <div style={{ width: 28, height: 28, border: `2px solid ${C.border}`, borderTopColor: C.red, borderRadius: "50%", animation: "spin .8s linear infinite" }} />;
}

// ─── Navbar ────────────────────────────────────────────────────────────────
function Navbar({ page, setPage, user, onLogout }) {
  return (
    <nav style={{ background: `linear-gradient(to bottom, rgba(0,0,0,.95), rgba(10,10,10,0))`, position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "0 40px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div onClick={() => setPage("home")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, background: C.red, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎬</div>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: C.white }}>CINE SENDERA</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {["home", "cartelera"].map(p => (
          <button key={p} onClick={() => setPage(p)} style={{
            background: page === p ? C.redGlow : "none", border: page === p ? `1px solid ${C.red}` : "1px solid transparent",
            color: page === p ? C.white : C.gray, padding: "6px 14px", borderRadius: 4,
            fontFamily: "'Open Sans', sans-serif", fontSize: 13, cursor: "pointer", textTransform: "capitalize",
            transition: "all .2s"
          }}>{p === "home" ? "Inicio" : "Cartelera"}</button>
        ))}
        {user
          ? <>
            <button onClick={() => setPage("admin")} style={{ background: "none", border: "none", color: C.gray, fontSize: 13, fontFamily: "'Open Sans', sans-serif", cursor: "pointer" }}>Admin</button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8, padding: "6px 14px", borderRadius: 4, background: C.card, border: `1px solid ${C.border}` }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{user.name[0]}</div>
              <span style={{ fontSize: 13, color: C.gray }}>{user.name}</span>
            </div>
            <button onClick={onLogout} style={{ background: "none", border: `1px solid ${C.border}`, color: C.gray, padding: "6px 12px", borderRadius: 4, fontSize: 12, fontFamily: "'Open Sans', sans-serif", cursor: "pointer" }}>Salir</button>
          </>
          : <>
            <button onClick={() => setPage("login")} style={{ background: "none", border: "none", color: C.gray, fontSize: 13, fontFamily: "'Open Sans', sans-serif", cursor: "pointer" }}>Iniciar sesión</button>
            <BtnPrimary onClick={() => setPage("register")} style={{ padding: "7px 16px" }}>Registrarse</BtnPrimary>
          </>
        }
      </div>
    </nav>
  );
}

// ─── Home / Hero ───────────────────────────────────────────────────────────
function HomePage({ setPage, setSelectedMovie }) {
  const featured = MOVIES[0];
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ position: "relative", height: "88vh", display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 60% 40%, ${featured.color}22 0%, transparent 60%), linear-gradient(135deg, #0A0A0A 0%, #1a0a0a 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 180, opacity: .07, userSelect: "none", position: "absolute" }}>{featured.emoji}</div>
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0A0A0A 0%, transparent 60%)" }} />
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
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 3, marginBottom: 24, color: C.white }}>EN CARTELERA HOY</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {MOVIES.map((m, i) => (
            <div key={m.id} className="hover-lift" style={{ background: C.card, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}`, cursor: "pointer", animation: `fadeUp .5s ease ${i * .1}s both` }}
              onMouseEnter={() => setHovered(m.id)} onMouseLeave={() => setHovered(null)}>
              <div style={{ height: 220, background: `radial-gradient(ellipse at center, ${m.color}33, ${C.surface})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80, position: "relative", overflow: "hidden" }}>
                <span style={{ transition: "transform .3s", transform: hovered === m.id ? "scale(1.15)" : "scale(1)" }}>{m.emoji}</span>
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

// ─── Movie Detail ──────────────────────────────────────────────────────────
function MovieDetailPage({ movie, setPage, setSelectedMovie, setSelectedSchedule }) {
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

// ─── Seat Picker ───────────────────────────────────────────────────────────
function SeatsPage({ movie, schedule, setPage, addToast, user }) {
  const [seats, setSeats] = useState(() =>
    SEAT_LAYOUT.map(row => row.map(s => s))
  );
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
    occupied: { bg: "#E24B4A", border: "#E24B4A" },
    aisle: { bg: "transparent", border: "transparent" },
  }[status]);

  const total = selected.length * 85;
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
              {[["free", "Libre", C.green, "transparent"], ["selected", "Seleccionado", C.green, C.green], ["occupied", "Ocupado", "#E24B4A", "#E24B4A"]].map(([k, label, border, bg]) => (
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
                <div style={{ width: 48, height: 64, background: `radial-gradient(${movie.color}44, ${C.surface})`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{movie.emoji}</div>
                <div>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14 }}>{movie.title}</p>
                  <p style={{ color: C.gray, fontSize: 12 }}>{schedule || movie.schedule[0]}</p>
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
                  <span>$85.00</span>
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

// ─── Checkout ──────────────────────────────────────────────────────────────
function CheckoutPage({ movie, user, setPage, addToast }) {
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

// ─── Digital Ticket ────────────────────────────────────────────────────────
function QRCode({ code }) {
  const grid = generateQRPattern(code);
  const size = 21; const cell = 6;
  return (
    <svg width={size * cell} height={size * cell} style={{ display: "block" }}>
      {grid.map((row, r) => row.map((on, c) => on
        ? <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill={C.white} />
        : null
      ))}
    </svg>
  );
}

function TicketPage({ movie, addToast }) {
  const [downloading, setDownloading] = useState(false);
  const code = "SNDR-2025-7A3F";
  if (!movie) return <div style={{ padding: 80, textAlign: "center", color: C.gray }}>No hay ticket disponible</div>;

  const handleDownload = () => {
    setDownloading(true);
    addToast("Preparando PDF...", "info");
    setTimeout(() => { setDownloading(false); addToast("PDF listo para descargar ✓", "success"); }, 2000);
  };

  return (
    <div style={{ minHeight: "100vh", paddingTop: 80, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "100px 24px 40px" }}>
      <div style={{ width: "100%", maxWidth: 480, animation: "ticketSlide .5s cubic-bezier(.22,.68,0,1.2) forwards" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 20, background: C.greenDim, border: `1px solid ${C.green}`, marginBottom: 12 }}>
            <span style={{ color: C.green, fontSize: 14 }}>✓</span>
            <span style={{ color: C.green, fontSize: 13, fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>Compra exitosa</span>
          </div>
          <p style={{ color: C.gray, fontSize: 14 }}>Tu ticket digital está listo</p>
        </div>

        {/* Ticket card */}
        <div style={{ background: C.card, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 24px 64px rgba(0,0,0,.6)" }}>
          {/* Header */}
          <div style={{ background: `linear-gradient(135deg, #0D0D0D, #1C0000)`, padding: "28px 28px 24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: `${movie.color}15` }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ color: C.red, fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>CINE SENDERA</p>
                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, letterSpacing: 2, lineHeight: 1 }}>{movie.title}</h2>
                <p style={{ color: C.gray, fontSize: 13, marginTop: 6 }}>{movie.genre} · {movie.duration}</p>
              </div>
              <div style={{ fontSize: 48 }}>{movie.emoji}</div>
            </div>
          </div>

          {/* Perforation */}
          <div style={{ height: 20, position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: -10, width: 20, height: 20, borderRadius: "50%", background: C.bg }} />
            <div style={{ flex: 1, height: 1, borderTop: `2px dashed ${C.border}`, margin: "0 14px" }} />
            <div style={{ position: "absolute", right: -10, width: 20, height: 20, borderRadius: "50%", background: C.bg }} />
          </div>

          {/* Body */}
          <div style={{ padding: "20px 28px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {[["Sala", "Sala 1"], ["Fecha", "Vie 25 Jul"], ["Hora", movie.schedule[0]], ["Asientos", "A3, A4"]].map(([k, v]) => (
                <div key={k}>
                  <p style={{ fontSize: 11, color: C.grayDark, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, fontFamily: "'Montserrat', sans-serif" }}>{k}</p>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15 }}>{v}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 4 }}>
              <div>
                <p style={{ fontSize: 11, color: C.grayDark, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, fontFamily: "'Montserrat', sans-serif" }}>Comprador</p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 14 }}>Carlos Mendoza</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: C.grayDark, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, fontFamily: "'Montserrat', sans-serif" }}>Total</p>
                <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 18, color: C.green }}>$180.00</p>
              </div>
            </div>
          </div>

          {/* Second perforation */}
          <div style={{ height: 20, position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: -10, width: 20, height: 20, borderRadius: "50%", background: C.bg }} />
            <div style={{ flex: 1, height: 1, borderTop: `2px dashed ${C.border}`, margin: "0 14px" }} />
            <div style={{ position: "absolute", right: -10, width: 20, height: 20, borderRadius: "50%", background: C.bg }} />
          </div>

          {/* QR footer */}
          <div style={{ padding: "20px 28px 24px", display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ background: C.white, padding: 8, borderRadius: 6 }}>
              <QRCode code={code} />
            </div>
            <div>
              <p style={{ fontSize: 10, color: C.grayDark, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, fontFamily: "'Montserrat', sans-serif" }}>Código de ticket</p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: 2, color: C.white }}>{code}</p>
              <p style={{ fontSize: 11, color: C.grayDark, marginTop: 6 }}>Presenta este código en taquilla</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <BtnPrimary onClick={handleDownload} style={{ flex: 1, padding: 13, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {downloading ? <><Spinner /><span>Generando...</span></> : "⬇ Descargar PDF"}
          </BtnPrimary>
          <BtnSecondary onClick={() => addToast("Compartir próximamente", "info")} style={{ padding: "13px 20px" }}>Compartir</BtnSecondary>
        </div>
      </div>
    </div>
  );
}

// ─── Auth Pages ────────────────────────────────────────────────────────────
function LoginPage({ setPage, setUser, addToast }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = () => {
    if (!email || !pass) { setError("Completa todos los campos"); return; }
    setError(""); setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setUser({ name: email.split("@")[0], email, role: email.includes("admin") ? "admin" : "user" });
      addToast("Sesión iniciada ✓", "success");
      setPage("home");
    }, 1600);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 64 }}>
      <div style={{ width: 400, animation: "fadeUp .5s ease forwards" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎬</div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 3 }}>INICIAR SESIÓN</h1>
          <p style={{ color: C.gray, fontSize: 14 }}>Accede a tu cuenta de Cine Sendera</p>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
          {error && <div style={{ background: "#3D0000", border: "1px solid #E24B4A", borderRadius: 4, padding: "10px 14px", fontSize: 13, color: "#FF6B6B", marginBottom: 16 }}>{error}</div>}
          <div style={{ marginBottom: 16 }}>
            <label>Correo electrónico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label>Contraseña</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handle()} />
          </div>
          <div style={{ textAlign: "right", marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: C.red, cursor: "pointer" }} onClick={() => setPage("verify")}>¿Olvidaste tu contraseña?</span>
          </div>
          {loading
            ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 14 }}><Spinner /><span style={{ color: C.gray, fontSize: 14 }}>Verificando...</span></div>
            : <BtnPrimary onClick={handle} style={{ width: "100%", padding: 13, fontSize: 14 }}>Iniciar sesión</BtnPrimary>
          }
          <div style={{ height: 1, background: C.border, margin: "20px 0" }} />
          <p style={{ textAlign: "center", fontSize: 13, color: C.gray }}>¿No tienes cuenta? <span style={{ color: C.red, cursor: "pointer" }} onClick={() => setPage("register")}>Regístrate gratis</span></p>
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: C.grayDark, marginTop: 12 }}>Ingresa "admin@..." para acceder al panel de administración</p>
      </div>
    </div>
  );
}

function RegisterPage({ setPage, addToast }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", pass: "", confirm: "" });
  const [code, setCode] = useState(["", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef()];
  const realCode = "48271";

  const handleReg = () => {
    if (!form.name || !form.email || !form.pass) return;
    if (form.pass !== form.confirm) { addToast("Las contraseñas no coinciden", "error"); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(2); addToast(`Código enviado a ${form.email}`, "info"); }, 1800);
  };

  const handleCode = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...code]; next[i] = v; setCode(next);
    if (v && i < 4) refs[i + 1].current?.focus();
  };

  const handleVerify = () => {
    if (code.join("") !== realCode) { addToast("Código incorrecto. Prueba: " + realCode, "error"); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); addToast("¡Registro exitoso! Inicia sesión", "success"); setPage("login"); }, 1400);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 64 }}>
      <div style={{ width: 420, animation: "fadeUp .5s ease forwards" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 3 }}>{step === 1 ? "CREAR CUENTA" : "VERIFICAR EMAIL"}</h1>
          <p style={{ color: C.gray, fontSize: 14 }}>{step === 1 ? "Únete a Cine Sendera" : `Ingresa el código enviado a ${form.email}`}</p>
        </div>
        {/* Steps indicator */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 28, gap: 8 }}>
          {[1, 2].map(s => <>
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? C.red : C.border, transition: "background .3s" }} />
            {s === 1 && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, flexShrink: 0 }} />}
          </>)}
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
          {step === 1 ? <>
            {[["Nombre completo", "name", "text", "Tu nombre"], ["Correo electrónico", "email", "email", "tu@correo.com"], ["Contraseña", "pass", "password", "Mínimo 8 caracteres"], ["Confirmar contraseña", "confirm", "password", "Repite tu contraseña"]].map(([label, key, type, ph]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label>{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={ph} />
              </div>
            ))}
            {loading
              ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 14 }}><Spinner /><span style={{ color: C.gray, fontSize: 14 }}>Enviando código...</span></div>
              : <BtnPrimary onClick={handleReg} style={{ width: "100%", padding: 13, fontSize: 14, marginTop: 6 }}>Continuar →</BtnPrimary>
            }
          </> : <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
              <p style={{ color: C.gray, fontSize: 14, lineHeight: 1.7 }}>Ingresa el código de 5 dígitos que enviamos a tu correo para confirmar tu identidad.</p>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
              {code.map((v, i) => (
                <input key={i} ref={refs[i]} maxLength={1} value={v} onChange={e => handleCode(i, e.target.value)}
                  onKeyDown={e => e.key === "Backspace" && !v && i > 0 && refs[i - 1].current?.focus()}
                  style={{ width: 52, height: 60, textAlign: "center", fontSize: 24, fontFamily: "'Montserrat', sans-serif", fontWeight: 700, borderRadius: 6, border: `1.5px solid ${v ? C.red : C.border}`, background: v ? C.redGlow : C.surface }} />
              ))}
            </div>
            {loading
              ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 14 }}><Spinner /><span style={{ color: C.gray, fontSize: 14 }}>Verificando...</span></div>
              : <BtnPrimary onClick={handleVerify} style={{ width: "100%", padding: 13, fontSize: 14 }}>Verificar y crear cuenta</BtnPrimary>
            }
            <p style={{ textAlign: "center", fontSize: 12, color: C.grayDark, marginTop: 16 }}>¿No llegó? <span style={{ color: C.red, cursor: "pointer" }} onClick={() => addToast("Código reenviado", "info")}>Reenviar código</span></p>
            <p style={{ textAlign: "center", fontSize: 11, color: C.grayDark, marginTop: 6 }}>Código de prueba: <strong style={{ color: C.gray }}>{realCode}</strong></p>
          </>}
        </div>
        <p style={{ textAlign: "center", fontSize: 13, color: C.gray, marginTop: 16 }}>¿Ya tienes cuenta? <span style={{ color: C.red, cursor: "pointer" }} onClick={() => setPage("login")}>Inicia sesión</span></p>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ───────────────────────────────────────────────────────
function AdminPage({ user, setPage }) {
  const [period, setPeriod] = useState("hoy");
  const bars = [42, 68, 55, 90, 73, 88, 61];
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const activity = [
    { color: C.green, msg: "Compra exitosa — Inferno Nexus", time: "hace 2 min" },
    { color: C.green, msg: "Nuevo registro: usuario@mail.com", time: "hace 5 min" },
    { color: "#EF9F27", msg: "Asientos casi agotados — Hollow Depths", time: "hace 11 min" },
    { color: "#378ADD", msg: "Backup automático completado", time: "hace 1 h" },
    { color: C.green, msg: "Compra exitosa — Última Vuelta", time: "hace 1 h" },
    { color: C.red, msg: "Intento de acceso fallido bloqueado", time: "hace 2 h" },
  ];

  return (
    <div style={{ minHeight: "100vh", paddingTop: 80 }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px", animation: "fadeUp .5s ease forwards" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, letterSpacing: 3 }}>PANEL DE ADMINISTRACIÓN</h1>
            <p style={{ color: C.gray, fontSize: 14 }}>Cine Sendera · Viernes 25 Jul 2025</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["hoy", "semana", "mes"].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: "7px 14px", borderRadius: 4, border: `1px solid ${period === p ? C.red : C.border}`,
                background: period === p ? C.redGlow : "transparent", color: period === p ? C.white : C.gray,
                fontFamily: "'Open Sans', sans-serif", fontSize: 12, cursor: "pointer", textTransform: "capitalize", transition: "all .2s"
              }}>{p}</button>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { icon: "🎟", label: "Boletos vendidos", value: "247", delta: "+18%", up: true },
            { icon: "💰", label: "Ventas del día", value: "$20,995", delta: "+12%", up: true },
            { icon: "👥", label: "Usuarios registrados", value: "1,482", delta: "+5 hoy", up: true },
            { icon: "🎬", label: "Película más vista", value: "Inferno Nexus", delta: "104 boletos", up: null },
          ].map(m => (
            <div key={m.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: C.gray, fontFamily: "'Montserrat', sans-serif", textTransform: "uppercase", letterSpacing: .5 }}>{m.label}</span>
                <span style={{ fontSize: 20 }}>{m.icon}</span>
              </div>
              <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: m.value.length > 8 ? 20 : 28, letterSpacing: 1 }}>{m.value}</p>
              {m.delta && <p style={{ fontSize: 12, color: m.up === null ? C.gray : m.up ? C.green : C.red, marginTop: 4 }}>
                {m.up !== null ? (m.up ? "↑" : "↓") : ""} {m.delta}
              </p>}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          {/* Ventas chart */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 20 }}>Ventas esta semana</h3>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
              {bars.map((h, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ width: "100%", height: `${h}%`, background: i === 4 ? C.red : C.grayDarker, borderRadius: "3px 3px 0 0", position: "relative", transition: "height .3s" }}>
                    {i === 4 && <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: C.red, whiteSpace: "nowrap", fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>{h}</div>}
                  </div>
                  <span style={{ fontSize: 10, color: C.grayDark }}>{days[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Movies ranking */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Películas más vendidas</h3>
            {[["Inferno Nexus", "🔥", 104, 87], ["Hollow Depths", "👁️", 68, 57], ["Última Vuelta", "🏎️", 75, 63]].map(([title, emoji, sold, pct], i) => (
              <div key={title} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ fontSize: 18 }}>{emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}>{title}</span>
                    <span style={{ fontSize: 12, color: C.gray }}>{sold} boletos</span>
                  </div>
                  <div style={{ height: 5, background: C.grayDarker, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: i === 0 ? C.red : C.grayDark, borderRadius: 3 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity + seats status */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Actividad reciente</h3>
            {activity.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: i < activity.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: C.white }}>{a.msg}</p>
                  <p style={{ fontSize: 11, color: C.grayDark, marginTop: 2 }}>{a.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Estado de salas</h3>
            {MOVIES.map(m => {
              const pct = Math.round((1 - m.seats / m.total) * 100);
              const col = pct > 80 ? C.red : pct > 50 ? "#EF9F27" : C.green;
              return (
                <div key={m.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>{m.emoji} {m.title}</span>
                    <span style={{ fontSize: 12, color: col, fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>{pct}% ocupado</span>
                  </div>
                  <div style={{ height: 6, background: C.grayDarker, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: col, borderRadius: 3, transition: "width .5s" }} />
                  </div>
                  <p style={{ fontSize: 11, color: C.grayDark, marginTop: 4 }}>{m.seats} asientos disponibles · {m.schedule[0]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(MOVIES[0]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (msg, type = "info") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  };

  const onLogout = () => { setUser(null); setPage("home"); addToast("Sesión cerrada", "info"); };

  const nav = (p) => {
    if ((p === "seats" || p === "checkout") && !user) { addToast("Inicia sesión para continuar", "error"); setPage("login"); return; }
    setPage(p);
  };

  return (
    <>
      <style>{FONTS}</style>
      <div style={{ background: C.bg, minHeight: "100vh" }}>
        <Toast toasts={toasts} />
        <Navbar page={page} setPage={nav} user={user} onLogout={onLogout} />
        <div style={{ paddingTop: page === "home" ? 0 : 0 }}>
          {page === "home" && <HomePage setPage={nav} setSelectedMovie={setSelectedMovie} />}
          {page === "cartelera" && <HomePage setPage={nav} setSelectedMovie={setSelectedMovie} />}
          {page === "movie-detail" && <MovieDetailPage movie={selectedMovie} setPage={nav} setSelectedMovie={setSelectedMovie} setSelectedSchedule={setSelectedSchedule} />}
          {page === "seats" && <SeatsPage movie={selectedMovie} schedule={selectedSchedule} setPage={nav} addToast={addToast} user={user} />}
          {page === "checkout" && <CheckoutPage movie={selectedMovie} user={user} setPage={nav} addToast={addToast} />}
          {page === "ticket" && <TicketPage movie={selectedMovie} addToast={addToast} />}
          {page === "login" && <LoginPage setPage={nav} setUser={setUser} addToast={addToast} />}
          {page === "register" && <RegisterPage setPage={nav} addToast={addToast} />}
          {page === "admin" && <AdminPage user={user} setPage={nav} />}
        </div>
      </div>
    </>
  );
}
