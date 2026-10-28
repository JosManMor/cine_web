import { fmtShowtime } from "../../utils/images";

/** Una función (fecha y hora, formato) como chip que lleva directo a elegir asientos. */
export default function ShowtimeChip({ screening, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-white/10 px-5 text-sm font-semibold transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {fmtShowtime(screening.start_time)}
      {screening.format && <span className="font-medium text-muted">{screening.format}</span>}
    </button>
  );
}
