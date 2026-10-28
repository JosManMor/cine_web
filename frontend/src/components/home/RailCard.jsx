import { fmtDuration } from "../../utils/format";
import { landscapeUrl } from "../../utils/images";

/** Tarjeta horizontal de la cartelera. Solo anima en hover/focus: la imagen hace zoom dentro de su caja redondeada. */
export default function RailCard({ movie, onClick }) {
  const image = landscapeUrl(movie, 640, 360);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver ${movie.title}`}
      className="group block w-full min-w-0 cursor-pointer text-left transition-transform duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-safe:hover:-translate-y-1 motion-safe:focus-visible:-translate-y-1"
    >
      <div className="relative aspect-video overflow-hidden rounded-tile bg-raised">
        {image
          ? <img src={image} alt="" width="640" height="360" loading="lazy" className="size-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105 motion-safe:group-focus-visible:scale-105" />
          : <div className="flex size-full items-center justify-center text-5xl font-extrabold text-muted">{movie.title?.[0]}</div>}
        {movie.rating && <span className="absolute top-3 left-3 rounded-full bg-ground/80 px-3 py-0.5 text-sm font-semibold">{movie.rating}</span>}
      </div>
      <h3 className="mt-3 truncate text-base font-semibold underline-offset-4 decoration-2 group-hover:underline group-focus-visible:underline">{movie.title}</h3>
      <p className="truncate text-sm text-muted">{[movie.genre, fmtDuration(movie.duration_minutes)].filter(Boolean).join(" · ")}</p>
    </button>
  );
}
