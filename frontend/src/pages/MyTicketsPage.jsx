import { useState, useEffect } from "react";
import { C } from "../constants/theme";
import { getMyTickets } from "../api/purchases";
import QRCode from "../components/QRCode";
import SmallSpinner from "../components/ui/SmallSpinner";
import BtnPrimary from "../components/ui/BtnPrimary";

const LANG_LABEL = { original: "Original", dubbed: "Doblada", subtitled: "Subtitulada" };

function fmtDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("es-MX", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hour12: false });
}

function TicketCard({ ticket, expanded, onToggle }) {
  const lang = LANG_LABEL[ticket.language_type] ?? ticket.language_type;

  return (
    <div
      style={{
        background: C.card, border: `1px solid ${expanded ? C.green : C.border}`,
        borderRadius: 10, overflow: "hidden",
        transition: "border-color .2s, box-shadow .2s",
        boxShadow: expanded ? `0 0 0 1px ${C.greenGlow}, 0 8px 32px ${C.shadow}` : "none",
      }}
    >
      {/* Fila clickeable */}
      <div
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
        tabIndex={0}
        role="button"
        aria-expanded={expanded}
        aria-label={`Ticket para ${ticket.movie_title}, ${fmtDateTime(ticket.screening_start_time)}, asiento ${ticket.row ?? ""}${ticket.seat_number ?? ""}`}
        style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", cursor: "pointer" }}
      >
        {/* Poster */}
        <div style={{ width: 44, height: 60, background: C.surface, borderRadius: 4, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: C.grayDark }}>
            {ticket.movie_title?.[0]}
          </span>
        </div>

        {/* Info principal */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {ticket.movie_title}
          </p>
          <p style={{ color: C.gray, fontSize: 12, marginTop: 3 }}>
            {fmtDateTime(ticket.screening_start_time)} · {ticket.room}
          </p>
          <p style={{ color: C.gray, fontSize: 12, marginTop: 2 }}>
            Asiento {ticket.row}{ticket.seat_number} · {ticket.format} {lang ? `· ${lang}` : ""}
          </p>
        </div>

        {/* Precio + estado */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, color: C.green }}>
            ${Number(ticket.price_paid).toFixed(2)}
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 4, padding: "2px 8px", borderRadius: 10, background: C.greenDim, border: `1px solid ${C.green}` }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, display: "inline-block" }} />
            <span style={{ color: C.green, fontSize: 11, fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}>Activo</span>
          </div>
        </div>

        {/* Chevron */}
        <span style={{ color: C.grayDark, fontSize: 12, flexShrink: 0, transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>▼</span>
      </div>

      {/* Detalle expandible */}
      {expanded && (
        <>
          {/* Perforación */}
          <div style={{ height: 16, position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: -8, width: 16, height: 16, borderRadius: "50%", background: C.bg }} />
            <div style={{ flex: 1, height: 1, borderTop: `2px dashed ${C.border}`, margin: "0 12px" }} />
            <div style={{ position: "absolute", right: -8, width: 16, height: 16, borderRadius: "50%", background: C.bg }} />
          </div>

          {/* QR + código */}
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ background: "#FFFFFF", padding: 7, borderRadius: 6, flexShrink: 0 }}>
              <QRCode code={ticket.ticket_code} />
            </div>
            <div
              tabIndex={0}
              aria-label={`Código de ticket: ${ticket.ticket_code}. Comprador: ${ticket.user_name}. Comprado el ${fmtDateTime(ticket.purchased_at)}.`}
            >
              <p style={{ fontSize: 10, color: C.grayDark, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5, fontFamily: "'Montserrat', sans-serif" }}>
                Código de ticket
              </p>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, color: C.white, wordBreak: "break-all" }}>
                {ticket.ticket_code}
              </p>
              <p style={{ fontSize: 11, color: C.grayDark, marginTop: 6 }}>
                Comprado: {fmtDateTime(ticket.purchased_at)}
              </p>
              <p style={{ fontSize: 11, color: C.gray, marginTop: 4 }}>
                Comprador: {ticket.user_name}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function MyTicketsPage({ setPage }) {
  const [tickets, setTickets]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getMyTickets()
      .then(setTickets)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (code) => setExpanded(prev => prev === code ? null : code);

  return (
    <div style={{ minHeight: "100vh", paddingTop: 80 }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px", animation: "fadeUp .5s ease forwards" }}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, letterSpacing: 3, marginBottom: 6 }}>
          MIS TICKETS
        </h1>
        <p style={{ color: C.gray, fontSize: 14, marginBottom: 32 }}>
          Tickets activos con pago confirmado. Presenta el QR en taquilla.
        </p>

        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
            <SmallSpinner />
          </div>
        )}

        {error && !loading && (
          <div style={{ textAlign: "center", padding: 60, color: C.gray }}>
            <p style={{ fontSize: 32, marginBottom: 16 }}>⚠</p>
            <p style={{ marginBottom: 20 }}>Error al cargar tus tickets. Intenta de nuevo.</p>
            <BtnPrimary onClick={() => { setError(false); setLoading(true); getMyTickets().then(setTickets).catch(() => setError(true)).finally(() => setLoading(false)); }}>
              Reintentar
            </BtnPrimary>
          </div>
        )}

        {!loading && !error && tickets.length === 0 && (
          <div style={{ textAlign: "center", padding: 80 }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🎟</p>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              No tienes tickets activos
            </p>
            <p style={{ color: C.gray, fontSize: 14, marginBottom: 28 }}>
              Los tickets aparecen aquí una vez que el pago es confirmado.
            </p>
            <BtnPrimary onClick={() => setPage("home")}>Ver cartelera</BtnPrimary>
          </div>
        )}

        {!loading && !error && tickets.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {tickets.map(ticket => (
              <TicketCard
                key={ticket.ticket_code}
                ticket={ticket}
                expanded={expanded === ticket.ticket_code}
                onToggle={() => toggle(ticket.ticket_code)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
