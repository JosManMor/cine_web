import { useNavigate } from "react-router-dom";
import RailCard from "./RailCard";
import GenreFilter from "./GenreFilter";
import { useBooking } from "../../context/BookingContext";

export default function MovieRail({ movies, filteredMovies, genres, genreFilter, setGenreFilter }) {
  const { setSelectedMovie } = useBooking();
  const navigate = useNavigate();

  function goToMovie(movie) {
    setSelectedMovie(movie);
    navigate(`/pelicula/${movie.id}`);
  }

  return (
    <section id="cartelera" aria-labelledby="cartelera-title" className="frame relative scroll-mt-24 pt-12 pb-20 sm:pt-16">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <h2 id="cartelera-title" className="m-0 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">Cartelera</h2>
        {movies.length > 0 && <GenreFilter genres={genres} genreFilter={genreFilter} setGenreFilter={setGenreFilter} />}
      </div>

      {movies.length === 0
        ? <p className="py-10 text-center text-base text-muted">No hay películas en cartelera.</p>
        : (
          <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredMovies.map(m => (
              <RailCard key={m.id} movie={m} onClick={() => goToMovie(m)} />
            ))}
          </div>
        )}
    </section>
  );
}
