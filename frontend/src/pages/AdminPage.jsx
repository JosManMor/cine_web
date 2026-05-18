import { useState, useEffect, useCallback } from "react";
import { C } from "../constants/theme";
import { getAdminMetrics, getAdminActivity, getAdminRooms } from "../api/admin";
import Spinner from "../components/ui/Spinner";
import BtnPrimary from "../components/ui/BtnPrimary";

const TODAY = new Date().toLocaleDateString("es-MX", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});

function MetricCard({ icon, label, value, sub }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: C.gray, fontFamily: "'Montserrat', sans-serif", textTransform: "uppercase", letterSpacing: .5 }}>{label}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: String(value).length > 10 ? 18 : 28, letterSpacing: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

function ActivityDot({ type }) {
  const color = type === "success" ? C.green : C.red;
  return (
    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, marginTop: 5, flexShrink: 0 }} />
  );
}

export default function AdminPage({ user, setPage }) {
  const [metrics,  setMetrics]  = useState(null);
  const [activity, setActivity] = useState([]);
  const [rooms,    setRooms]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([getAdminMetrics(), getAdminActivity(), getAdminRooms()])
      .then(([m, a, r]) => { setMetrics(m); setActivity(a); setRooms(r); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.role !== "admin") { setPage("home"); return; }
    fetchAll();
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner />
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
      <p style={{ fontSize: 36 }}>⚠</p>
      <p style={{ color: C.gray }}>Error al cargar el panel. Intenta de nuevo.</p>
      <BtnPrimary onClick={fetchAll}>Reintentar</BtnPrimary>
    </div>
  );

  const sales  = metrics.weekly_sales ?? [];
  const maxVal = Math.max(...sales.map(d => d.value), 1);

  return (
    <div style={{ minHeight: "100vh", paddingTop: 80 }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px", animation: "fadeUp .5s ease forwards" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, letterSpacing: 3 }}>
              PANEL DE ADMINISTRACIÓN
            </h1>
            <p style={{ color: C.gray, fontSize: 14, textTransform: "capitalize" }}>Cine Sendera · {TODAY}</p>
          </div>
          <button
            onClick={fetchAll}
            style={{
              padding: "7px 14px", borderRadius: 4, border: `1px solid ${C.border}`,
              background: "transparent", color: C.gray, cursor: "pointer",
              fontFamily: "'Open Sans', sans-serif", fontSize: 12, transition: "all .2s",
            }}
          >
            ↻ Actualizar
          </button>
        </div>

        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          <MetricCard
            icon="🎟"
            label="Boletos vendidos"
            value={metrics.tickets_sold.toLocaleString("es-MX")}
          />
          <MetricCard
            icon="💰"
            label="Ventas del día"
            value={`$${Number(metrics.daily_sales).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
          />
          <MetricCard
            icon="👥"
            label="Usuarios registrados"
            value={metrics.registered_users.toLocaleString("es-MX")}
          />
          <MetricCard
            icon="🎬"
            label="Película más vista"
            value={metrics.top_movie?.title ?? "—"}
            sub={metrics.top_movie ? `${metrics.top_movie.tickets_sold} boletos` : undefined}
          />
        </div>

        {/* Chart + Rooms */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

          {/* Weekly sales chart */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
            <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 20 }}>
              Ventas esta semana
            </h3>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
              {sales.map((d) => {
                const heightPct = Math.round((d.value / maxVal) * 100);
                const isMax     = d.value === maxVal;
                return (
                  <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: "100%", height: `${heightPct || 2}%`, minHeight: 2,
                      background: isMax ? C.red : C.grayDarker,
                      borderRadius: "3px 3px 0 0", position: "relative", transition: "height .3s",
                    }}>
                      {isMax && (
                        <div style={{
                          position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)",
                          fontSize: 10, color: C.red, whiteSpace: "nowrap",
                          fontFamily: "'Montserrat', sans-serif", fontWeight: 600,
                        }}>
                          {d.value}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: C.grayDark }}>{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Room status */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, overflowY: "auto" }}>
            <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
              Estado de salas
            </h3>
            {rooms.length === 0 ? (
              <p style={{ color: C.gray, fontSize: 13 }}>Sin salas activas.</p>
            ) : rooms.map((r, i) => {
              const col = r.occupancy_pct > 80 ? C.red : r.occupancy_pct > 50 ? "#EF9F27" : C.green;
              return (
                <div key={r.room} style={{ marginBottom: i < rooms.length - 1 ? 14 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13 }}>{r.room}</span>
                    <span style={{ fontSize: 12, color: col, fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>
                      {r.occupancy_pct}% ocupado
                    </span>
                  </div>
                  <div style={{ height: 5, background: C.grayDarker, borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
                    <div style={{ height: "100%", width: `${r.occupancy_pct}%`, background: col, borderRadius: 3 }} />
                  </div>
                  <p style={{ fontSize: 11, color: C.grayDark }}>
                    {r.movie_title ?? "Sin función"} · {r.available_seats} disponibles
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity feed */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
            Actividad reciente
          </h3>
          {activity.length === 0 ? (
            <p style={{ color: C.gray, fontSize: 13 }}>Sin actividad reciente.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
              {activity.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "8px 0", borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  <ActivityDot type={a.type} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, color: C.white }}>{a.message}</p>
                    <p style={{ fontSize: 11, color: C.grayDark, marginTop: 2 }}>{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
