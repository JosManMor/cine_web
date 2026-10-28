const VARIANTS = {
  primary: "bg-accent text-ink hover:bg-accent-strong",
  ghost: "bg-white/10 text-ink hover:bg-white/20",
  light: "bg-ink text-ground hover:bg-white/85",
};

const SIZES = {
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-8 text-base",
};

/** Botón en forma de píldora; con `to` o `href` se renderiza como enlace. */
export default function PillButton({ variant = "primary", size = "md", className = "", as: Tag = "button", children, ...rest }) {
  const props = Tag === "button" ? { type: "button", ...rest } : rest;
  return (
    <Tag
      className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
