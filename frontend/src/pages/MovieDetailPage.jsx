import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getMovie } from "../api/movies";
import Spinner from "../components/ui/Spinner";
import MovieHeader from "../components/movie/MovieHeader";
import ShowtimePicker from "../components/movie/ShowtimePicker";
import { useBooking } from "../context/BookingContext";

export default function MovieDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedMovie, setSelectedMovie } = useBooking();

  // Resultado de la última petición, ligado a su id: mientras no coincide con la ruta, se está cargando.
  const [result, setResult] = useState({ id: null, data: null, error: null });

  useEffect(() => {
    if (!id) return;
    let active = true;
    getMovie(id)
      .then(data => {
        if (!active) return;
        setResult({ id, data, error: null });
        setSelectedMovie(data);
      })
      .catch(() => active && setResult({ id, data: null, error: "No se pudo cargar la película" }));
    return () => { active = false; };
  }, [id, setSelectedMovie]);

  const loading = result.id !== id;
  const detail  = loading ? null : result.data;
  const error   = loading ? null : result.error;

  // Mientras llega el detalle se muestra la película elegida en la cartelera, si coincide.
  const preview = selectedMovie && String(selectedMovie.id) === String(id) ? selectedMovie : null;
  const movie = detail ?? preview;
  const screenings = detail?.screenings ?? [];

  if (!movie) return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-5 bg-ground px-5 text-center font-sans text-ink">
      {error
        ? <>
            <p className="m-0 text-base text-muted">{error}</p>
            <Link to="/cartelera" className="text-base font-semibold text-ink underline underline-offset-4">Volver a cartelera</Link>
          </>
        : <Spinner />}
    </main>
  );

  return (
    <main className="min-h-svh overflow-x-clip bg-ground pb-0 font-sans text-ink lg:pb-24">
      <MovieHeader movie={movie} loadingDetail={loading} />

      <section aria-labelledby="funciones-title" className="frame relative mt-16 lg:mt-24">
        <h2 id="funciones-title" className="m-0 mb-6 animate-rise text-3xl font-extrabold motion-reduce:animate-none tracking-tight text-ink md:text-4xl">Funciones</h2>

        {loading && <div className="py-10"><Spinner /></div>}

        {!loading && error && <p className="m-0 pb-16 text-base text-muted">{error}</p>}

        {!loading && detail && screenings.length === 0 && (
          <p className="m-0 pb-16 text-base text-muted">No hay funciones disponibles para esta película.</p>
        )}

        {!loading && screenings.length > 0 && (
          <ShowtimePicker
            key={detail.id}
            screenings={screenings}
            onContinue={s => navigate(`/asientos/${s.id}`)}
          />
        )}
      </section>
    </main>
  );
}
