import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMovie } from "../../api/movies";
import { landscapeUrl } from "../../utils/images";
import { useBooking } from "../../context/BookingContext";
import PillButton from "../ui/PillButton";
import MovieMeta from "./MovieMeta";
import ShowtimeChip from "./ShowtimeChip";
import HeroBackdrop from "./HeroBackdrop";

function TicketIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5V7Z" />
    </svg>
  );
}

export default function HeroStage({ carousel, featuredIndex, setFeaturedIndex, totalMovies }) {
  const { setSelectedMovie } = useBooking();
  const navigate = useNavigate();
  const featured = carousel[featuredIndex];
  const [details, setDetails] = useState({});
  const requested = useRef(new Set());

  // Sinopsis y funciones solo existen en el detalle: se piden bajo demanda y se guardan.
  useEffect(() => {
    if (!featured || requested.current.has(featured.id)) return;
    requested.current.add(featured.id);
    getMovie(featured.id)
      .then(data => setDetails(d => ({ ...d, [featured.id]: data })))
      .catch(() => setDetails(d => ({ ...d, [featured.id]: {} })));
  }, [featured]);

  if (!featured) return null;

  const detail = details[featured.id];
  const screenings = (detail?.screenings ?? []).filter(s => s.status === "open").slice(0, 3);

  function goToMovie(movie) {
    setSelectedMovie(movie);
    navigate(`/pelicula/${movie.id}`);
  }

  return (
    <section aria-label="Película destacada" className="frame relative isolate pt-20 lg:pt-24">
      <HeroBackdrop carousel={carousel} featuredIndex={featuredIndex} />
      <div className="relative isolate overflow-hidden rounded-card bg-surface lg:min-h-[41rem] lg:bg-ground">

        <div className="relative h-60 sm:h-80 lg:absolute lg:inset-0 lg:h-auto">
          {carousel.map((m, i) => {
            const image = landscapeUrl(m);
            return image && (
              <img
                key={m.id}
                src={image}
                alt=""
                width="1600"
                height="900"
                fetchPriority={i === 0 ? "high" : "auto"}
                className={`absolute inset-0 size-full object-cover transition-[opacity,scale] [transition-duration:700ms,9000ms] motion-reduce:transition-none ${i === featuredIndex ? "scale-105 opacity-100" : "scale-100 opacity-0"}`}
              />
            );
          })}
          {/* taste-skill-ignore: scrim neutro sobre fotografía */}<div aria-hidden="true" className="absolute inset-0 hidden lg:block lg:bg-linear-to-r lg:from-ground lg:from-25% lg:via-ground/70 lg:via-50% lg:to-ground/10" />
          {/* taste-skill-ignore: scrim neutro sobre fotografía */}<div aria-hidden="true" className="absolute inset-x-0 bottom-0 hidden h-2/5 bg-linear-to-t from-ground/80 to-transparent xl:block" />
        </div>

        <div key={featured.id} className="flex max-w-3xl animate-rise flex-col gap-6 px-5 pt-6 pb-6 motion-reduce:animate-none sm:px-8 lg:relative lg:px-14 lg:pt-36 lg:pb-8">
          <h1 className="m-0 line-clamp-2 text-[clamp(1.75rem,5.2vw,4.5rem)] leading-[1.02] font-extrabold wrap-break-word tracking-tight text-balance text-ink">
            {featured.title}
          </h1>

          <MovieMeta movie={featured} />

          <p className="m-0 line-clamp-3 min-h-[4.5rem] max-w-xl text-base leading-relaxed text-muted">
            {detail?.synopsis ?? ""}
          </p>

          <div>
            <h2 className="m-0 mb-3 text-base font-semibold text-ink">Próximas funciones</h2>
            {detail && screenings.length === 0
              ? <p className="text-base text-muted">Sin funciones programadas por ahora.</p>
              : (
                <div className="flex flex-wrap items-center gap-2">
                  {screenings.map(s => (
                    <ShowtimeChip key={s.id} screening={s} onClick={() => navigate(`/asientos/${s.id}`)} />
                  ))}
                  {screenings.length > 0 && (
                    <button
                      type="button"
                      onClick={() => goToMovie(featured)}
                      className="flex size-12 cursor-pointer items-center justify-center rounded-full bg-white/10 text-center text-xs leading-tight font-semibold transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      aria-label={`Ver todas las funciones de ${featured.title}`}
                    >
                      Ver<br />todas
                    </button>
                  )}
                </div>
              )}
          </div>

          <div className="flex flex-wrap gap-3">
            <PillButton size="lg" onClick={() => goToMovie(featured)}>
              <TicketIcon /> Comprar entradas
            </PillButton>
          </div>
        </div>

        <div className="absolute top-[38%] right-0 hidden rounded-l-lg bg-accent px-4 py-3 text-center leading-tight lg:block">
          <span className="block text-3xl font-extrabold">{totalMovies}</span>
          <span className="block text-sm font-semibold">en cartelera</span>
        </div>

        {carousel.length > 1 && (
          <div className="px-5 pb-6 sm:px-8 lg:px-14 lg:pb-10 xl:absolute xl:right-0 xl:bottom-0 xl:w-[60rem] xl:max-w-[58%] xl:px-0 xl:pr-6 xl:pb-10">
            <h2 className="m-0 mb-3 text-base font-semibold text-ink xl:text-lg">Destacadas de la semana</h2>
            <ul className="m-0 grid list-none grid-cols-3 items-end gap-3 p-0 sm:flex sm:gap-4">
              {carousel.map((m, i) => (
                <li key={m.id} className={`min-w-0 transition-[flex-grow] duration-500 ease-out motion-reduce:transition-none sm:basis-0 ${i === featuredIndex ? "sm:grow-[1.7]" : "sm:grow"}`}>
                  <button
                    type="button"
                    onClick={() => setFeaturedIndex(i)}
                    aria-current={i === featuredIndex}
                    aria-label={`Destacar ${m.title}`}
                    className="group block w-full cursor-pointer rounded-tile text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                  >
                    <div className="aspect-video overflow-hidden rounded-lg bg-raised">
                      {m.poster_url && <img src={landscapeUrl(m, 480, 270)} alt="" width="480" height="270" loading="lazy" className={`size-full object-cover transition duration-300 motion-safe:group-hover:scale-105 ${i === featuredIndex ? "" : "opacity-70 group-hover:opacity-100"}`} />}
                    </div>
                    <span className={`mt-2 block truncate text-sm font-semibold transition-colors xl:text-base ${i === featuredIndex ? "text-ink" : "text-muted group-hover:text-ink"}`}>{m.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
