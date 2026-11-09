/** Póster de la película; sin imagen muestra la inicial del título sobre un tono elevado. */
export default function Poster({ src, title, className = "" }) {
  if (src) {
    return <img src={src} alt="" width="500" height="750" className={`aspect-[2/3] shrink-0 rounded-tile bg-raised object-cover ${className}`} />;
  }
  return (
    <span aria-hidden="true" className={`flex aspect-[2/3] shrink-0 items-center justify-center rounded-tile bg-raised text-2xl font-extrabold text-muted ${className}`}>
      {title?.[0] ?? "?"}
    </span>
  );
}
