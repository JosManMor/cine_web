import { useState } from "react";
import { Armchair, Ticket } from "lucide-react";
import PillButton from "../ui/PillButton";
import { LANG_LABEL, availabilityLabel, fmtPrice, fmtTime, groupByDay, isBookable, longDate } from "./showtimes";

// Retardo escalonado de entrada de los horarios (clases literales para que Tailwind las genere).
const STAGGER = ["", "[animation-delay:60ms]", "[animation-delay:120ms]", "[animation-delay:180ms]", "[animation-delay:240ms]", "[animation-delay:300ms]"];

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/**
 * Elección de función: día, hora y un resumen con el precio y las butacas libres de la función
 * elegida. Arranca con la primera función reservable para que el botón esté listo desde el inicio.
 */
export default function ShowtimePicker({ screenings, onContinue }) {
  const days = groupByDay(screenings);
  const firstBookable = screenings.find(isBookable) ?? null;
  const [selectedId, setSelectedId] = useState(firstBookable?.id ?? null);
  const selected = screenings.find(s => s.id === selectedId) ?? null;
  const [dayKey, setDayKey] = useState(() => days.find(d => d.screenings.includes(firstBookable))?.key ?? days[0]?.key);
  const day = days.find(d => d.key === dayKey) ?? days[0];

  function chooseDay(next) {
    setDayKey(next.key);
    if (!next.screenings.includes(selected)) setSelectedId(next.screenings.find(isBookable)?.id ?? null);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-12 xl:grid-cols-[1fr_24rem]">
      <div className="min-w-0">
        {days.length > 1 && (
          <fieldset aria-label="Elegir día" className="no-scrollbar -mx-5 m-0 mb-6 flex animate-rise [animation-delay:60ms] motion-reduce:animate-none gap-2 overflow-x-auto border-0 p-0 px-5 md:mx-0 md:flex-wrap md:px-0">
            {days.map(d => {
              const active = d.key === day.key;
              return (
                <button
                  key={d.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => chooseDay(d)}
                  className={`h-11 shrink-0 cursor-pointer rounded-full px-5 text-sm font-semibold transition ${focusRing} ${active ? "bg-ink text-ground" : "bg-raised text-muted hover:bg-white/15 hover:text-ink"}`}
                >
                  {d.label}
                </button>
              );
            })}
          </fieldset>
        )}

        <ul key={day.key} aria-label={`Horarios de ${day.label}`} className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 xl:grid-cols-4">
          {day.screenings.map((s, i) => {
            const bookable = isBookable(s);
            const active = s.id === selectedId;
            return (
              <li key={s.id} className={`min-w-0 animate-rise motion-reduce:animate-none ${STAGGER[Math.min(i, STAGGER.length - 1)]}`}>
                <button
                  type="button"
                  aria-pressed={active}
                  disabled={!bookable}
                  onClick={() => setSelectedId(s.id)}
                  className={`flex w-full cursor-pointer flex-col items-start gap-1 rounded-tile px-4 py-4 text-left transition motion-safe:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${focusRing} ${active ? "bg-accent text-ink" : "bg-surface text-ink enabled:hover:bg-raised"}`}
                >
                  <span className="text-2xl leading-none font-extrabold tracking-tight tabular-nums">{fmtTime(s.start_time)}</span>
                  <span className={`truncate text-sm font-semibold ${active ? "text-ink" : "text-muted"}`}>
                    {[s.format, LANG_LABEL[s.language_type] ?? s.language_type].filter(Boolean).join(" · ")}
                  </span>
                  <span className={`text-sm ${active ? "text-ink" : "text-muted"}`}>
                    {availabilityLabel(s)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <aside
        aria-label="Función elegida"
        className="sticky bottom-0 z-10 animate-rise [animation-delay:120ms] motion-reduce:animate-none -mx-5 rounded-t-card bg-surface px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:-mx-6 md:px-6 lg:top-28 lg:bottom-auto lg:mx-0 lg:rounded-card lg:p-7"
      >
        {selected ? (
          <div className="flex flex-col gap-4 lg:gap-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="m-0 text-base font-semibold text-ink first-letter:uppercase">{longDate(selected.start_time)}</p>
                <p className="m-0 mt-1 text-sm text-muted">
                  {[fmtTime(selected.start_time), selected.room?.name, selected.format].filter(Boolean).join(" · ")}
                </p>
              </div>
              <p className="m-0 shrink-0 text-right">
                <span className="block text-2xl leading-none font-extrabold tabular-nums">{fmtPrice(selected.base_price)}</span>
                <span className="text-sm text-muted">por butaca</span>
              </p>
            </div>
            {selected.room?.available_seats != null && (
              <p className="m-0 hidden items-center gap-2 text-sm text-muted lg:flex">
                <Armchair size={18} />
                {selected.room.available_seats} de {selected.room.total_seats} butacas libres
              </p>
            )}
            <PillButton size="lg" className="w-full" onClick={() => onContinue(selected)}>
              <Ticket size={20} /> Seleccionar asientos
            </PillButton>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="m-0 text-base text-muted">Este día no quedan butacas. Elige otro día u horario.</p>
            <PillButton size="lg" className="w-full" disabled>
              <Ticket size={20} /> Seleccionar asientos
            </PillButton>
          </div>
        )}
      </aside>
    </div>
  );
}
