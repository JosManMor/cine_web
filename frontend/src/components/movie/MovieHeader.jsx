import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { landscapeUrl } from "../../utils/images";
import MovieMeta from "../home/MovieMeta";

/**
 * Cabecera del detalle: póster, título, ficha y sinopsis sobre el fondo desenfocado de la película.
 * `children` (las funciones) va bajo la ficha: a todo el ancho en móvil y junto al póster en escritorio,
 * para que en una pantalla de escritorio quepa todo sin desplazarse.
 */
export default function MovieHeader({ movie, loadingDetail, children }) {
  const backdrop = landscapeUrl(movie);
  return (
    <section aria-labelledby="movie-title" className="frame relative isolate pt-20">
      {backdrop && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <img src={backdrop} alt="" width="1600" height="900" className="absolute inset-0 size-full scale-125 object-cover opacity-50 blur-3xl brightness-75" />
          {/* taste-skill-ignore: scrim neutro sobre fotografía */}<div className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-b from-transparent to-ground" />
        </div>
      )}

      <Link
        to="/cartelera"
        className="mt-4 inline-flex h-11 lg:mt-2 animate-rise motion-reduce:animate-none items-center gap-2 rounded-full bg-white/10 pr-5 pl-4 text-sm font-semibold text-ink no-underline transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <ArrowLeft size={18} /> Volver a cartelera
      </Link>

      {/* En escritorio el ancho del póster se limita por el alto de la ventana (proporción 2:3). */}
      <div className="mt-8 grid grid-cols-[6.5rem_1fr] gap-x-5 gap-y-6 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-x-8 md:grid-cols-[minmax(0,17rem)_1fr] lg:mt-5 lg:grid-cols-[min(15rem,calc((100svh-13rem)*2/3))_1fr] lg:gap-x-12 lg:gap-y-5 xl:grid-cols-[min(19rem,calc((100svh-13rem)*2/3))_1fr] xl:gap-x-14">
        <div className="aspect-[2/3] w-full animate-rise self-end overflow-hidden rounded-tile bg-raised motion-reduce:animate-none sm:row-span-2 sm:self-auto lg:row-span-3 lg:self-start">
          {movie.poster_url
            ? <img src={movie.poster_url} alt={`Póster de ${movie.title}`} width="500" height="750" fetchPriority="high" className="size-full object-cover" />
            : <div className="flex size-full items-center justify-center text-5xl font-extrabold text-muted sm:text-7xl">{movie.title?.[0]}</div>}
        </div>

        <div className="flex min-w-0 animate-rise flex-col gap-4 self-end [animation-delay:80ms] motion-reduce:animate-none sm:gap-5">
          <h1 id="movie-title" className="m-0 line-clamp-2 text-[clamp(1.625rem,5.6vw,4.75rem)] lg:text-[clamp(2.5rem,4vw,4rem)] leading-[1.02] font-extrabold wrap-break-word tracking-tight text-balance text-ink">
            {movie.title}
          </h1>
          <MovieMeta movie={movie} />
        </div>

        <div className="col-span-2 flex min-w-0 animate-rise flex-col gap-4 self-start [animation-delay:160ms] motion-reduce:animate-none sm:col-span-1 sm:col-start-2 sm:gap-5">
          {movie.director && (
            <p className="m-0 text-base text-muted">
              Dirigida por <span className="font-semibold text-ink">{movie.director}</span>
            </p>
          )}
          {movie.synopsis
            ? <p className="m-0 max-w-2xl text-base leading-relaxed text-ink md:text-lg">{movie.synopsis}</p>
            : loadingDetail && <div aria-hidden="true" className="h-20 max-w-2xl rounded-tile bg-white/5" />}
        </div>

        {children && <div className="col-span-2 min-w-0 lg:col-span-1 lg:col-start-2">{children}</div>}
      </div>
    </section>
  );
}
