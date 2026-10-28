import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getMovies } from "../api/movies";
import Spinner from "../components/ui/Spinner";
import HeroStage from "../components/home/HeroStage";
import MovieRail from "../components/home/MovieRail";

export default function HomePage() {
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

  // "Inicio" lleva al principio y "Cartelera" a su sección; location.key cambia
  // también al pulsar el enlace de la ruta en la que ya se está.
  const location = useLocation();
  useEffect(() => {
    if (loading) return;
    const smooth = window.matchMedia("(prefers-reduced-motion: no-preference)").matches ? "smooth" : "auto";
    if (location.pathname === "/cartelera") {
      document.getElementById("cartelera")?.scrollIntoView({ behavior: smooth, block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: smooth });
    }
  }, [location.key, location.pathname, loading]);

  useEffect(() => {
    if (carousel.length <= 1) return;
    const id = setInterval(() => setFeaturedIndex(i => (i + 1) % carousel.length), 8000);
    return () => clearInterval(id);
  }, [carousel.length, featuredIndex]);

  if (loading) return (
    <div className="flex min-h-svh items-center justify-center bg-ground">
      <Spinner />
    </div>
  );

  if (error) return (
    <div className="flex min-h-svh items-center justify-center bg-ground text-base text-muted">
      {error}
    </div>
  );

  const genres         = ["Todos", ...new Set(movies.map(m => m.genre).filter(Boolean))];
  const filteredMovies = genreFilter === "Todos" ? movies : movies.filter(m => m.genre === genreFilter);

  return (
    <main className="min-h-svh overflow-x-clip bg-ground font-sans text-ink">
      <HeroStage
        carousel={carousel}
        featuredIndex={featuredIndex}
        setFeaturedIndex={setFeaturedIndex}
        totalMovies={movies.length}
      />
      <MovieRail
        movies={movies}
        filteredMovies={filteredMovies}
        genres={genres}
        genreFilter={genreFilter}
        setGenreFilter={setGenreFilter}
      />
    </main>
  );
}
