import { fmtDuration } from "../../utils/format";

/** Duración, clasificación y género de una película. */
export default function MovieMeta({ movie }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-base text-muted">
      {movie.duration_minutes ? <span>{fmtDuration(movie.duration_minutes)}</span> : null}
      {movie.rating && <span className="rounded-full bg-white/15 px-3 py-0.5 text-sm font-semibold text-ink">{movie.rating}</span>}
      {movie.genre && <span>{movie.genre}</span>}
    </div>
  );
}
