import { useState } from "react";
import { bannerDismissed, demoModeActive, dismissBanner } from "../utils/simulationNotice";

/** Aviso flotante de entorno de demostración: fijo sobre el contenido, sin desplazarlo, y cerrable. */
export default function DemoBanner({ onShowTerms }) {
  const [visible, setVisible] = useState(() => demoModeActive() && !bannerDismissed());

  if (!visible) return null;

  function close() {
    dismissBanner();
    setVisible(false);
  }

  return (
    <aside
      aria-label="Aviso de entorno de demostración"
      /* taste-skill-ignore: aviso fijo que flota sobre el contenido */ className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-300 mx-auto flex max-w-3xl items-start gap-3 rounded-tile bg-warning/85 py-3 pr-2 pl-4 font-sans text-sm text-ground shadow-2xl sm:items-center sm:pl-5"
    >
      <p className="min-w-0 flex-1 leading-snug">
        <strong className="font-bold">Entorno de demostración.</strong>{" "}
        Los pagos son simulados y los correos se capturan en{" "}
        <a
          href={import.meta.env.VITE_MAILPIT_URL ?? "/mailpit/"}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline underline-offset-2"
        >
          Mailpit
        </a>
        . No ingreses datos reales.{" "}
        {onShowTerms && (
          <button
            type="button"
            onClick={onShowTerms}
            className="cursor-pointer font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-ground"
          >
            Ver términos
          </button>
        )}
      </p>
      <button
        type="button"
        onClick={close}
        aria-label="Cerrar aviso"
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition hover:bg-ground/10 focus-visible:outline-2 focus-visible:outline-ground"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </aside>
  );
}
