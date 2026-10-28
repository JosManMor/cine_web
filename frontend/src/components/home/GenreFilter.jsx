export default function GenreFilter({ genres, genreFilter, setGenreFilter }) {
  return (
    <div role="group" aria-label="Filtrar por género" className="flex flex-wrap gap-2 lg:justify-end">
      {genres.map(g => {
        const active = genreFilter === g;
        return (
          <button
            key={g}
            type="button"
            aria-pressed={active}
            onClick={() => setGenreFilter(g)}
            className={`h-10 shrink-0 cursor-pointer rounded-full px-5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${active ? "bg-accent text-ink" : "bg-raised text-muted hover:bg-white/15 hover:text-ink"}`}
          >
            {g}
          </button>
        );
      })}
    </div>
  );
}
