import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import PillButton from "./ui/PillButton";

const CONSENTS = [
  { id: "simulation", label: "Entiendo que es un entorno de simulación y que no debo ingresar información verdadera en ningún momento." },
  { id: "terms", label: "He leído y acepto los términos y condiciones." },
  { id: "privacy", label: "He leído y acepto el aviso de privacidad." },
];

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h3 className="text-base font-bold text-ink">{title}</h3>
      {children}
    </section>
  );
}

/**
 * Diálogo modal con el aviso de simulación, los términos y condiciones y el aviso de privacidad.
 * - Modo consentimiento (por defecto): no se puede cerrar hasta marcar todas las casillas y aceptar.
 * - Modo consulta (`reviewOnly`): solo lectura, se cierra con el botón o con Escape.
 */
export default function TermsDialog({ open, reviewOnly = false, onAccept, onClose }) {
  const [checked, setChecked] = useState({});
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descId = useId();

  const allChecked = CONSENTS.every(c => checked[c.id]);

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // `showModal()` coloca el diálogo en la capa superior: el resto de la página queda inerte y el foco
  // atrapado dentro. jsdom no lo implementa, así que en los tests se cae al atributo `open`.
  useLayoutEffect(() => {
    const dialog = panelRef.current;
    if (!open || !dialog) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    // Sin esto el navegador enfoca el área con scroll; así el lector de pantalla anuncia el título.
    dialog.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  function toggle(id) {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  }

  // Escape dispara `cancel`: en modo consentimiento se ignora; en modo consulta cierra.
  function handleCancel(e) {
    e.preventDefault();
    if (reviewOnly) onCloseRef.current?.();
  }

  // Algunos navegadores cierran igualmente tras varios Escape; sin aceptar, el diálogo se reabre.
  function handleNativeClose() {
    if (reviewOnly) onCloseRef.current?.();
    else panelRef.current?.showModal?.();
  }

  function submit(e) {
    e.preventDefault();
    if (allChecked) onAccept?.();
  }

  return (
    <dialog
      ref={panelRef}
      aria-labelledby={titleId}
      aria-describedby={descId}
      onCancel={handleCancel}
      onClose={handleNativeClose}
      /* taste-skill-ignore: diálogo modal, overlay real */ className="m-auto mb-0 max-h-[92svh] w-full max-w-2xl animate-rise flex-col overflow-hidden rounded-t-card bg-surface p-0 font-sans text-ink shadow-2xl outline-none backdrop:bg-ground/80 open:flex motion-reduce:animate-none sm:mb-auto sm:max-h-[min(88svh,52rem)] sm:rounded-card"
    >
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <header className="px-5 pt-6 pb-4 sm:px-8 sm:pt-8">
          <h2 id={titleId} className="m-0 text-2xl leading-tight font-extrabold text-ink sm:text-3xl">
            {reviewOnly ? "Términos y privacidad" : "Antes de continuar"}
          </h2>
          <p id={descId} className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
            Cine Sendera es un proyecto académico. Lee estas condiciones antes de usar el sitio.
          </p>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 pb-6 text-sm leading-relaxed text-muted sm:px-8">
          <div className="rounded-tile bg-warning/15 p-4 text-ink sm:p-5">
            <h3 className="text-base font-bold text-warning">Esto es un entorno de simulación</h3>
            <p className="mt-2">
              Ninguna compra es real: los pagos se simulan, las entradas no son válidas en ningún cine y los
              correos no salen del servidor. <strong>No ingreses información verdadera en ningún momento</strong>:
              usa nombres, correos y contraseñas inventados y nunca escribas datos de tarjetas reales.
            </p>
          </div>

          <Section title="Términos y condiciones">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>El sitio se ofrece tal cual, con fines educativos y de demostración, sin garantía de disponibilidad.</li>
              <li>Las funciones, precios, asientos y entradas mostrados son ficticios y no generan obligación alguna.</li>
              <li>Los datos y cuentas pueden reiniciarse o eliminarse en cualquier momento sin previo aviso.</li>
              <li>No está permitido usar el sitio para fines ilícitos ni intentar afectar su funcionamiento.</li>
              <li>Al usar el sitio aceptas estas condiciones; si no estás de acuerdo, no lo utilices.</li>
            </ul>
          </Section>

          <Section title="Aviso de privacidad">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Solo se guardan los datos que escribes al registrarte y comprar: nombre, correo y compras simuladas.</li>
              <li>Se usan únicamente para que la demostración funcione (iniciar sesión, mostrar tus entradas).</li>
              <li>No se venden ni se comparten con terceros, y los correos se capturan localmente sin enviarse.</li>
              <li>La base de datos puede borrarse periódicamente; por eso no debes registrar información real.</li>
              <li>Tu aceptación se guarda solo en este navegador para no volver a mostrarte este aviso.</li>
            </ul>
          </Section>
        </div>

        <footer className="space-y-4 bg-raised px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-8 sm:pb-6">
          {reviewOnly ? (
            <div className="flex justify-end">
              <PillButton variant="light" onClick={onClose}>Cerrar</PillButton>
            </div>
          ) : (
            <>
              <fieldset className="flex flex-col gap-3 border-0 p-0">
                <legend className="sr-only">Confirmaciones requeridas</legend>
                {CONSENTS.map(c => (
                  /* `!`: la hoja global heredada de constants/theme.js fija label/input sin capa. */
                  <label key={c.id} className="m-0! flex! cursor-pointer items-start gap-3 font-sans! text-sm! leading-snug text-ink!">
                    <input
                      type="checkbox"
                      checked={!!checked[c.id]}
                      onChange={() => toggle(c.id)}
                      className="mt-0.5 size-5! shrink-0 cursor-pointer p-0! accent-accent"
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
              </fieldset>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted" aria-live="polite">
                  {allChecked ? "Listo, ya puedes continuar." : "Marca las tres casillas para continuar."}
                </p>
                <PillButton
                  type="submit"
                  disabled={!allChecked}
                  className="w-full disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted disabled:active:scale-100 sm:w-auto"
                >
                  Aceptar y continuar
                </PillButton>
              </div>
            </>
          )}
        </footer>
      </form>
    </dialog>
  );
}
