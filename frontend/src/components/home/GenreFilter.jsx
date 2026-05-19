import { C } from "../../constants/theme";

export default function GenreFilter({ genres, genreFilter, setGenreFilter }) {
  return (
    <>
      <div className="genre-pills" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {genres.map(g => (
          <button key={g} onClick={() => setGenreFilter(g)} style={{
            padding: "5px 14px", borderRadius: 20,
            border: `1px solid ${genreFilter === g ? C.red : C.border}`,
            background: genreFilter === g ? C.redGlow : C.card,
            color: genreFilter === g ? C.white : C.gray,
            fontFamily: "'Open Sans', sans-serif", fontSize: 12, cursor: "pointer", transition: "all .2s",
          }}>{g}</button>
        ))}
      </div>

      <select
        className="genre-select"
        value={genreFilter}
        onChange={e => setGenreFilter(e.target.value)}
        style={{ display: "none", marginTop: 12, width: "100%", padding: "9px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.card, color: C.white, fontFamily: "'Open Sans', sans-serif", fontSize: 14, cursor: "pointer", appearance: "auto" }}
      >
        {genres.map(g => <option key={g} value={g}>{g}</option>)}
      </select>
    </>
  );
}
