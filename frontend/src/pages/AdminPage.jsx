import { useState } from "react";
import { C } from "../constants/theme";
import { MOVIES } from "../constants/mockData";

export default function AdminPage({ user, setPage }) {
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
