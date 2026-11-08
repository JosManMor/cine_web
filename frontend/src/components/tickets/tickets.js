// Utilidades compartidas por "Mis tickets" y el comprobante de compra.

export const LANG_LABEL = { original: "Original", dubbed: "Doblada", subtitled: "Subtitulada" };
export const PAYMENT_LABEL = { cash: "Efectivo", card: "Tarjeta", online: "En línea" };

export const money = (n) => `$${Number(n ?? 0).toFixed(2)}`;
export const seatLabel = (s) => `${s.row}${s.seat_number}`;
export const seatsWord = (n) => (n === 1 ? "asiento" : "asientos");

export const bySeat = (a, b) => a.row.localeCompare(b.row) || a.seat_number - b.seat_number;

const DAY_MS = 24 * 60 * 60 * 1000;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function fmtDay(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
}

export function fmtTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function fmtShort(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
}

/** Días de calendario entre hoy y la fecha (0 = hoy, 1 = mañana). */
export function daysFrom(dateStr, now = new Date()) {
  return Math.round((startOfDay(new Date(dateStr)) - startOfDay(now)) / DAY_MS);
}

/** Cuánto falta para la función, siempre medido desde ahora. */
export function untilLabel(dateStr, now = new Date()) {
  const mins = Math.round((new Date(dateStr) - now) / 60000);
  if (mins <= 0) return "Ya comenzó";
  if (mins < 60) return `Empieza en ${mins} min`;
  const days = daysFrom(dateStr, now);
  if (days === 0) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `Empieza en ${h} h ${m} min` : `Empieza en ${h} h`;
  }
  if (days === 1) return `Mañana a las ${fmtTime(dateStr)}`;
  return `Faltan ${days} días`;
}

/** Bloque de calendario de una función, usado por los filtros. */
export function bucketOf(dateStr, now = new Date()) {
  const days = daysFrom(dateStr, now);
  if (days <= 0) return "today";
  if (days < 7) return "week";
  return "later";
}

/**
 * La API devuelve un ticket por asiento; aquí se agrupan por función
 * (misma película, sala y hora) y se ordenan de la más próxima a la más lejana.
 */
export function groupByScreening(tickets) {
  const groups = new Map();
  for (const t of tickets) {
    const key = t.screening_id ?? `${t.movie_title}|${t.start_time}|${t.room}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key: String(key),
        movie_title: t.movie_title,
        poster_url: t.poster_url ?? null,
        start_time: t.start_time,
        room: t.room,
        format: t.format,
        language_type: t.language_type,
        user_name: t.user_name,
        purchased_at: t.purchased_at,
        tickets: [],
      });
    }
    groups.get(key).tickets.push(t);
  }
  return [...groups.values()]
    .map(g => {
      const sorted = [...g.tickets].sort(bySeat);
      return { ...g, tickets: sorted, total: sorted.reduce((sum, t) => sum + Number(t.price_paid ?? 0), 0) };
    })
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
}

export function formatLine(format, language) {
  return [format, LANG_LABEL[language] ?? language].filter(Boolean).join(" · ");
}
