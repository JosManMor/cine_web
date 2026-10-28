import { landscapeUrl } from "../../utils/images";

/** Fondo desenfocado de la película destacada: cruza con fondo al cambiar y se funde con el fondo de la página. */
export default function HeroBackdrop({ carousel, featuredIndex }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -bottom-24 -z-10 overflow-hidden">
      {carousel.map((m, i) => {
        const image = landscapeUrl(m);
        return image && (
          <img
            key={m.id}
            src={image}
            alt=""
            width="1600"
            height="900"
            className={`absolute inset-0 size-full scale-125 object-cover blur-3xl brightness-75 transition-opacity duration-1000 motion-reduce:transition-none ${i === featuredIndex ? "opacity-60" : "opacity-0"}`}
          />
        );
      })}
      {/* taste-skill-ignore: scrim neutro sobre fotografía */}<div className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-b from-transparent to-ground" />
    </div>
  );
}
