// Agrupación y formato de las funciones de una película para la vista de detalle.

export const LANG_LABEL = { original: "Idioma original", dubbed: "Doblada", subtitled: "Subtitulada" };

/** Una función se puede reservar si está abierta (o programada) y le quedan butacas. */
export function isBookable(screening) {
  return ["open", "scheduled"].includes(screening.status ?? "open") && (screening.room?.available_seats ?? 1) > 0;
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Etiqueta corta del día: "Hoy", "Mañana" o "sáb 8 nov". */
export function dayLabel(date, now = new Date()) {
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (dayKey(date) === dayKey(now)) return "Hoy";
  if (dayKey(date) === dayKey(tomorrow)) return "Mañana";
  const label = date.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" }).replaceAll(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Fecha larga para el resumen: "sábado 8 de noviembre". */
export function longDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
}

export function fmtTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function fmtPrice(value) {
  return `$${Number(value).toFixed(2)}`;
}

/** Agrupa las funciones (ya ordenadas por hora) por día local, conservando el orden. */
export function groupByDay(screenings, now = new Date()) {
  const days = [];
  const byKey = new Map();
  for (const s of screenings) {
    const date = new Date(s.start_time);
    const key = dayKey(date);
    if (!byKey.has(key)) {
      const day = { key, label: dayLabel(date, now), screenings: [] };
      byKey.set(key, day);
      days.push(day);
    }
    byKey.get(key).screenings.push(s);
  }
  return days;
}
