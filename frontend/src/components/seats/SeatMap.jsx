import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { SEAT_LOOK } from "./seatLook";

const STATUS_LABEL = { occupied: ", ocupado", selected: ", seleccionado", free: ", libre" };


const ARROWS = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };

/** Columnas de una fila: etiqueta, primera mitad, pasillo, segunda mitad, etiqueta. */
function rowTemplate(seatsPerRow) {
  const half = Math.floor(seatsPerRow / 2);
  const seat = "minmax(1.25rem,2.25rem)";
  return `1rem repeat(${half}, ${seat}) 0.75rem repeat(${seatsPerRow - half}, ${seat}) 1rem`;
}

/**
 * Plano de la sala: pantalla arriba, filas con su letra a ambos lados y un pasillo central.
 * Las flechas mueven el foco entre butacas (un solo tabulador para todo el plano).
 */
export default function SeatMap({ rowLabels, seatsPerRow, getStatus, onToggle }) {
  const [focus, setFocus] = useState([0, 0]);
  const refs = useRef({});
  const frame = useRef(null);

  // Si el plano no cabe (teléfono), arranca centrado en el pasillo para que se vean ambas mitades.
  useEffect(() => {
    const el = frame.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [seatsPerRow]);
  const half = Math.floor(seatsPerRow / 2);
  const template = { gridTemplateColumns: rowTemplate(seatsPerRow) };
  const seatNumbers = Array.from({ length: seatsPerRow }, (_, i) => i + 1);

  const moveFocus = (e, r, c) => {
    const step = ARROWS[e.key];
    if (!step) return;
    e.preventDefault();
    const nr = Math.min(Math.max(r + step[0], 0), rowLabels.length - 1);
    const nc = Math.min(Math.max(c + step[1], 0), seatsPerRow - 1);
    setFocus([nr, nc]);
    refs.current[`${nr}-${nc}`]?.focus();
  };

  const cell = (seatNum) => (seatNum <= half ? seatNum + 1 : seatNum + 2);

  return (
    <div ref={frame} className="-mx-2 overflow-x-auto px-2 pb-2">
      <div className="mx-auto w-full max-w-max min-w-min">
        {/* Pantalla: un arco plano sobre la primera fila. */}
        <div className="mx-auto mb-10 w-4/5 max-w-xl text-center">
          <div aria-hidden="true" className="h-5 rounded-[50%/100%_100%_0_0] border-t-4 border-ink/70" />
          <p className="-mt-1 text-sm text-muted">Pantalla</p>
        </div>

        <div aria-hidden="true" className="mb-2 grid items-end gap-x-0.5 text-center text-[11px] text-muted tabular-nums sm:gap-x-1.5" style={template}>
          {seatNumbers.map(n => <span key={n} style={{ gridColumn: cell(n) }}>{n}</span>)}
        </div>

        <div role="group" aria-label="Plano de asientos" className="flex flex-col gap-1.5 sm:gap-2">
          {rowLabels.map((rowLabel, r) => (
            <div key={rowLabel} role="group" aria-label={`Fila ${rowLabel}`} className="grid items-center gap-x-0.5 sm:gap-x-1.5" style={template}>
              <span aria-hidden="true" className="text-center text-xs font-semibold text-muted">{rowLabel}</span>
              {seatNumbers.map((seatNum, c) => {
                const status = getStatus(rowLabel, seatNum);
                const isFocusTarget = focus[0] === r && focus[1] === c;
                return (
                  <button
                    key={seatNum}
                    ref={el => { refs.current[`${r}-${c}`] = el; }}
                    type="button"
                    title={`${rowLabel}${seatNum}`}
                    aria-label={`Asiento ${rowLabel}${seatNum}${STATUS_LABEL[status]}`}
                    aria-pressed={status === "selected"}
                    aria-disabled={status === "occupied" || undefined}
                    tabIndex={isFocusTarget ? 0 : -1}
                    onFocus={() => setFocus([r, c])}
                    onKeyDown={e => moveFocus(e, r, c)}
                    onClick={() => status !== "occupied" && onToggle(rowLabel, seatNum)}
                    style={{ gridColumn: cell(seatNum) }}
                    className={`flex aspect-[10/9] w-full cursor-pointer items-center justify-center rounded-t-lg rounded-b-sm text-[11px] font-bold tabular-nums transition active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none ${SEAT_LOOK[status]}`}
                  >
                    {status === "selected" && seatNum}
                    {status === "occupied" && <X size={12} strokeWidth={2.5} />}
                  </button>
                );
              })}
              <span aria-hidden="true" className="text-center text-xs font-semibold text-muted" style={{ gridColumn: seatsPerRow + 3 }}>{rowLabel}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
