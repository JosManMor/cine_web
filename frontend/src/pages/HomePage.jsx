import { useState, useEffect } from "react";
import { C } from "../constants/theme";
import { getMovies } from "../api/movies";
import Spinner from "../components/ui/Spinner";
import HeroCarousel from "../components/home/HeroCarousel";
import MovieGrid from "../components/home/MovieGrid";

export default function HomePage({ setPage, setSelectedMovie }) {
  const [movies, setMovies]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [genreFilter, setGenreFilter]     = useState("Todos");
  const [carousel, setCarousel]           = useState([]);

  useEffect(() => {
    getMovies()
      .then(data => {
        setMovies(data);
        const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, 5);
        setCarousel(shuffled);
      })
      .catch(() => setError("No se pudo cargar la cartelera"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (carousel.length <= 1) return;
    const id = setInterval(() => setFeaturedIndex(i => (i + 1) % carousel.length), 6000);
    return () => clearInterval(id);
  }, [carousel.length]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner />
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.gray }}>
      {error}
    </div>
  );

  const genres         = ["Todos", ...new Set(movies.map(m => m.genre).filter(Boolean))];
  const filteredMovies = genreFilter === "Todos" ? movies : movies.filter(m => m.genre === genreFilter);

  return (
    <div style={{ minHeight: "100vh" }}>
      <HeroCarousel
        carousel={carousel}
        featuredIndex={featuredIndex}
        setFeaturedIndex={setFeaturedIndex}
        setSelectedMovie={setSelectedMovie}
        setPage={setPage}
      />
      <MovieGrid
        movies={movies}
        filteredMovies={filteredMovies}
        genres={genres}
        genreFilter={genreFilter}
        setGenreFilter={setGenreFilter}
        setPage={setPage}
        setSelectedMovie={setSelectedMovie}
      />
    </div>
  );
}
