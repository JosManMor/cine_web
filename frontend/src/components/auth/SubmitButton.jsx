import PillButton from "../ui/PillButton";

function SpinnerIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin motion-reduce:animate-none">
      <path d="M21 12a9 9 0 1 1-6.22-8.56" />
    </svg>
  );
}

/** Botón de envío del formulario de acceso, con estado de carga accesible. */
export default function SubmitButton({ loading, loadingText, children }) {
  return (
    <PillButton
      type="submit"
      size="lg"
      disabled={loading}
      aria-busy={loading}
      className="mt-2 w-full disabled:cursor-wait disabled:opacity-70"
    >
      {loading && <SpinnerIcon />}
      {loading ? loadingText : children}
    </PillButton>
  );
}
