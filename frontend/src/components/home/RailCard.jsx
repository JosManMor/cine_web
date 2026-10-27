import { fmtDuration } from "../../utils/format";
import { landscapeUrl } from "../../utils/images";

/** Tarjeta horizontal de la cartelera; la de la película destacada se muestra más grande. */
const DELAYS = ["", "[animation-delay:60ms]", "[animation-delay:120ms]", "[animation-delay:180ms]", "[animation-delay:240ms]", "[animation-delay:300ms]"];

export default function RailCard({ movie, index = 0, active, onClick }) {
  const image = landscapeUrl(movie, 640, 360);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver ${movie.title}`}
      className={`group animate-rise motion-reduce:animate-none ${DELAYS[Math.min(index, DELAYS.length - 1)]} snap-start shrink-0 cursor-pointer text-left transition-[width] duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${active ? "w-[16.5rem] sm:w-[22rem]" : "w-[12.5rem] sm:w-[15rem]"}`}
    >
      <div className="relative aspect-video overflow-hidden rounded-tile bg-raised">
        {image
          ? <img src={image} alt="" width="640" height="360" loading="lazy" className="size-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
          : <div className="flex size-full items-center justify-center text-5xl font-extrabold text-muted">{movie.title?.[0]}</div>}
        {movie.rating && <span className="absolute top-3 left-3 rounded-full bg-ground/80 px-3 py-0.5 text-sm font-semibold">{movie.rating}</span>}
      </div>
      <h3 className="mt-3 truncate text-base font-semibold">{movie.title}</h3>
      <p className="truncate text-sm text-muted">{[movie.genre, fmtDuration(movie.duration_minutes)].filter(Boolean).join(" · ")}</p>
    </button>
  );
}
