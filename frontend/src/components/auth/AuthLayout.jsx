import { useEffect, useState } from "react";
import { getMovies } from "../../api/movies";

const WALL_SIZE = 6;
// Escalonado de la entrada de cada póster (clases literales para que Tailwind las genere).
const DELAYS = ["[animation-delay:0ms]", "[animation-delay:70ms]", "[animation-delay:140ms]", "[animation-delay:210ms]", "[animation-delay:280ms]", "[animation-delay:350ms]"];

/**
 * Pared de pósteres de la cartelera real. Si la API falla o no hay películas, el panel
 * queda como un campo de color liso con el texto, sin huecos de imagen.
 */
function PosterWall() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    let alive = true;
    getMovies()
      .then(data => alive && setMovies((data ?? []).filter(m => m.poster_url).slice(0, WALL_SIZE)))
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <aside aria-labelledby="auth-wall-title" className="relative isolate hidden overflow-hidden rounded-card bg-surface lg:flex lg:flex-col lg:justify-end">
      {movies.length > 0 && (
        <ul aria-hidden="true" className="absolute inset-0 -z-10 m-0 grid list-none grid-cols-3 gap-2 p-0">
          {movies.map((m, i) => (
            <li key={m.id} className={`animate-rise overflow-hidden motion-reduce:animate-none ${DELAYS[i]}`}>
              <img src={m.poster_url} alt="" width="500" height="750" className="size-full object-cover" />
            </li>
          ))}
        </ul>
      )}
      {/* Scrim neutro sobre los pósteres para que el texto se lea. */}
      {movies.length > 0 && <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(0,0,0,0.9),rgba(0,0,0,0.65)_50%,rgba(0,0,0,0.1))]" />}{/* taste-skill-ignore: scrim neutro sobre fotografía */}
      <div className="p-10 xl:p-12">
        <h2 id="auth-wall-title" className="m-0 text-3xl leading-tight font-bold tracking-tight text-balance text-ink">
          Tu butaca te espera
        </h2>
        <p className="mt-3 max-w-md text-lg leading-relaxed text-ink">
          {movies.length > 0
            ? `${movies.map(m => m.title).slice(0, 3).join(", ")} y más en la cartelera de esta semana.`
            : "Elige función, escoge tus asientos y lleva tus entradas en el teléfono."}
        </p>
      </div>
    </aside>
  );
}

/** Marco común de las vistas de acceso: formulario a la izquierda y la cartelera a la derecha. */
export default function AuthLayout({ titleId, title, intro, children, footer }) {
  return (
    <main className="frame flex min-h-svh bg-ground pt-24 pb-10 font-sans text-ink lg:pt-28">
      <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <section aria-labelledby={titleId} className="flex animate-rise flex-col justify-center py-4 motion-reduce:animate-none">
          <div className="w-full max-w-md">
            <h1 id={titleId} className="m-0 text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.02] font-extrabold tracking-tight text-balance text-ink">
              {title}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-ink">{intro}</p>
            <div className="mt-10">{children}</div>
            <p className="mt-8 text-base text-muted">{footer}</p>
          </div>
        </section>
        <PosterWall />
      </div>
    </main>
  );
}
