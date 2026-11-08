import { useId, useState } from "react";

function EyeIcon({ off }) {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="m3 3 18 18" />}
    </svg>
  );
}

/**
 * Campo de formulario con etiqueta, indicación permanente opcional y error de validación,
 * enlazados por aria-describedby. Los campos de contraseña añaden el botón para mostrarla.
 */
export default function AuthField({ label, type = "text", value, onChange, error, hint, ...rest }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && visible ? "text" : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          className={`field-input ${isPassword ? "field-input--action" : ""}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-1 my-auto flex size-11 cursor-pointer items-center justify-center rounded-full text-muted transition hover:text-ink focus-visible:outline-2 focus-visible:outline-white active:scale-95"
          >
            <EyeIcon off={visible} />
          </button>
        )}
      </div>
      {hint && <p id={hintId} className="mt-2 text-sm text-muted">{hint}</p>}
      {error && <p id={errorId} className="mt-2 text-sm font-medium text-[#ff7a8a]">{error}</p>}
    </div>
  );
}
