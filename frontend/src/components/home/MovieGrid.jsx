import { C } from "../../constants/theme";
import MovieCard from "./MovieCard";
import GenreFilter from "./GenreFilter";

export default function MovieGrid({ movies, filteredMovies, genres, genreFilter, setGenreFilter, setPage, setSelectedMovie }) {
  return (
    <div style={{ padding: "0 40px 60px" }}>
      <div className="grid-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 3, color: C.white, margin: 0 }}>PELÍCULAS DISPONIBLES</h2>
        <GenreFilter genres={genres} genreFilter={genreFilter} setGenreFilter={setGenreFilter} />
      </div>

      {movies.length === 0
        ? <p style={{ color: C.grayDark, textAlign: "center", padding: 40 }}>No hay películas en cartelera.</p>
        : (
          <div className="movies-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 20 }}>
            {filteredMovies.map((m, i) => (
              <MovieCard
                key={m.id}
                movie={m}
                index={i}
                onClick={() => { setSelectedMovie(m); setPage("movie-detail"); }}
              />
            ))}
          </div>
        )
      }

      <style>{`
        @media (max-width: 900px) {
          .movies-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .grid-header  { flex-direction: column; align-items: flex-start; gap: 12px; }
          .movies-grid  { grid-template-columns: 1fr !important; }
          .genre-pills  { display: none !important; }
          .genre-select { display: block !important; width: 100%; }
        }
      `}</style>
    </div>
  );
}
