import { useNavigate } from "react-router-dom";
import RailCard from "./RailCard";
import GenreFilter from "./GenreFilter";
import { useBooking } from "../../context/BookingContext";

export default function MovieRail({ movies, filteredMovies, genres, genreFilter, setGenreFilter, activeId }) {
  const { setSelectedMovie } = useBooking();
  const navigate = useNavigate();

  function goToMovie(movie) {
    setSelectedMovie(movie);
    navigate(`/pelicula/${movie.id}`);
  }

  return (
    <section id="cartelera" aria-labelledby="cartelera-title" className="frame scroll-mt-24 pt-16 pb-20">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <h2 id="cartelera-title" className="m-0 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">Cartelera</h2>
        {movies.length > 0 && <GenreFilter genres={genres} genreFilter={genreFilter} setGenreFilter={setGenreFilter} />}
      </div>

      {movies.length === 0
        ? <p className="py-10 text-center text-base text-muted">No hay películas en cartelera.</p>
        : (
          <div className="no-scrollbar flex snap-x snap-mandatory items-end gap-5 overflow-x-auto pb-2">
            {filteredMovies.map((m, i) => (
              <RailCard key={m.id} index={i} movie={m} active={m.id === activeId} onClick={() => goToMovie(m)} />
            ))}
          </div>
        )}
    </section>
  );
}
