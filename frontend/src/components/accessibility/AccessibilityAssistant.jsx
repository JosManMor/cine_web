import { useState, useEffect, useRef, useCallback } from "react";

/* ─── Mapeo de páginas a anuncios de contexto ─────────────────────────────── */
const PAGE_ANNOUNCEMENTS = {
  home: "Estás en la página de inicio. Aquí puedes ver la cartelera de películas.",
  cartelera: "Estás en la cartelera. Aquí puedes ver todas las películas disponibles.",
  "movie-detail": "Estás en el detalle de una película. Puedes ver las funciones disponibles y seleccionar asientos.",
  seats: "Estás en la selección de asientos. Usa Tab para navegar por los asientos disponibles.",
  checkout: "Estás en la confirmación de compra. Revisa tu orden antes de confirmar.",
  ticket: "Tu comprobante está listo. Presenta el código QR en taquilla.",
  login: "Estás en la pantalla de inicio de sesión.",
  register: "Estás en la pantalla de registro. Crea tu cuenta de Cine Sendera.",
  "email-pending": "Revisa tu correo electrónico para verificar tu cuenta.",
  "email-verify": "Verificando tu correo electrónico.",
  admin: "Estás en el panel de administración.",
  "my-tickets": "Estás en tu sección de tickets. Aquí puedes ver tus compras activas.",
};

/* ─── Etiquetas amigables por tipo de elemento ──────────────────────────────── */
const TAG_LABELS = {
  BUTTON: "Botón",
  A: "Enlace",
  INPUT: "Campo de texto",
  SELECT: "Lista desplegable",
  TEXTAREA: "Área de texto",
  IMG: "Imagen",
  H1: "Título principal", H2: "Título", H3: "Subtítulo",
  P: "Párrafo", SPAN: "", DIV: "",
};

const INPUT_TYPE_LABELS = {
  email: "Correo electrónico",
  password: "Contraseña",
  text: "Texto",
  number: "Número",
  checkbox: "Casilla de verificación",
  radio: "Opción",
  search: "Búsqueda",
};

/* ─── Extrae etiqueta legible de cualquier elemento DOM ─────────────────────── */
function getElementDescription(el) {
  if (!el) return "";

  const tag = el.tagName;

  // Aria-label tiene máxima prioridad
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) return `${TAG_LABELS[tag] ?? ""}: ${ariaLabel}`.trim();

  // Input / select
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") {
    const typeLabel = INPUT_TYPE_LABELS[el.type] ?? TAG_LABELS[tag];
    // Busca label asociado
    const id = el.id;
    const label = id ? document.querySelector(`label[for="${id}"]`)?.textContent?.trim() : null;
    const placeholder = el.getAttribute("placeholder");
    const value = el.value ? `Valor actual: ${el.value}` : "";
    const disabled = el.disabled ? "deshabilitado" : "";
    const parts = [typeLabel, label || placeholder, disabled, value].filter(Boolean);
    return parts.join(". ");
  }

  if (tag === "BUTTON") {
    const text = el.textContent?.trim().replace(/\s+/g, " ");
    const disabled = el.disabled ? "deshabilitado" : "";
    return [TAG_LABELS.BUTTON, text, disabled].filter(Boolean).join(": ");
  }

  // Imagen
  if (tag === "IMG") {
    const alt = el.getAttribute("alt");
    return alt ? `Imagen: ${alt}` : "Imagen decorativa";
  }

  if (tag === "A") {
    const text = el.textContent?.trim().replace(/\s+/g, " ");
    return `Enlace: ${text}`;
  }

  if (["H1", "H2", "H3", "H4"].includes(tag)) {
    return `${TAG_LABELS[tag]}: ${el.textContent?.trim()}`;
  }

  const text = el.textContent?.trim().replace(/\s+/g, " ");
  return text || el.tagName.toLowerCase();
}

/* ─── Web Speech API helper ─────────────────────────────────────────────────── */
let currentUtterance = null;
function speak(text, rate = 1, volume = 1) {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "es-MX";
  utt.rate = rate;
  utt.volume = volume;
  // Prefiere voz femenina en español
  const voices = window.speechSynthesis.getVoices();
  const spanishFemale = voices.find(v => v.lang.startsWith("es") && v.name.toLowerCase().includes("female"))
    || voices.find(v => v.lang.startsWith("es"));
  if (spanishFemale) utt.voice = spanishFemale;
  currentUtterance = utt;
  window.speechSynthesis.speak(utt);
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Componente Principal
══════════════════════════════════════════════════════════════════════════════ */
export default function AccessibilityAssistant({ page }) {
  const [enabled, setEnabled] = useState(false);
  const [rate] = useState(1);
  const [volume] = useState(1);
  const prevPageRef = useRef(null);

  /* ── Anuncia el contexto cada vez que cambia la página ───────────────────── */
  useEffect(() => {
    if (!enabled || page === prevPageRef.current) return;
    prevPageRef.current = page;
    const announcement = PAGE_ANNOUNCEMENTS[page] ?? `Página: ${page}`;
    setTimeout(() => speak(announcement, rate, volume), 400);
  }, [page, enabled, rate, volume]);

  /* ── Activa/desactiva al habilitar el asistente ─────────────────────────── */
  useEffect(() => {
    if (enabled) {
      speak("Asistente Sendera activado. Navega con Tab para escuchar los elementos.", rate, volume);
      prevPageRef.current = null; // forzará anuncio de página actual
    } else {
      window.speechSynthesis?.cancel();
    }
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Listener de foco (Tab navigation) ─────────────────────────────────── */
  useEffect(() => {
    if (!enabled) return;

    function onFocusIn(e) {
      const el = e.target;
      const desc = getElementDescription(el);
      const type = TAG_LABELS[el.tagName] ?? "";
      speak(desc, rate, volume);
    }

    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, [enabled, rate, volume]);

  /* ── Atajos de teclado ───────────────────────────────────────────────────── */
  useEffect(() => {
    function onKeyDown(e) {
      // Alt+A → toggle asistente
      if (e.altKey && e.key === "a") {
        e.preventDefault();
        setEnabled(v => !v);
      }
      // Alt+R → releer elemento actual
      if (e.altKey && e.key === "r" && enabled) {
        e.preventDefault();
        const focused = document.activeElement;
        if (focused) speak(getElementDescription(focused), rate, volume);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enabled, rate, volume]);



  /* ─── Toggle flotante (siempre visible) ─────────────────────────────────── */
  const toggleStyle = {
    position: "fixed",
    right: 24,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: enabled ? "#E50914" : "rgba(30,30,30,0.9)",
    border: `2px solid ${enabled ? "#E50914" : "rgba(255,255,255,0.2)"}`,
    backdropFilter: "blur(10px)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    boxShadow: enabled ? "0 0 18px rgba(229,9,20,0.55)" : "0 4px 16px rgba(0,0,0,0.5)",
    transition: "all .3s",
    zIndex: 10000,
  };

  return (
    <>
      {/* Botón flotante de toggle */}
      <button
        style={toggleStyle}
        onClick={() => setEnabled(v => !v)}
        aria-label={enabled
          ? "Sendera Voz activado. Haz clic o presiona Alt+A para desactivar."
          : "Activar asistente de voz Sendera. Haz clic o presiona Alt+A para activar. Alt+R para releer el elemento actual."}
        title="Alt+A — Activar / Desactivar asistente de voz">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill={enabled ? "#FFFFFF" : "#E50914"}>
          <path d="M17 20c-.29 0-.56-.06-.76-.15-.71-.37-1.21-.88-1.71-2.38-.51-1.56-1.47-2.29-2.39-3-.79-.61-1.61-1.24-2.32-2.53C9.29 10.98 9 9.93 9 9c0-2.8 2.2-5 5-5s5 2.2 5 5h2c0-3.93-3.07-7-7-7S7 5.07 7 9c0 1.26.38 2.65 1.07 3.9.91 1.65 1.98 2.48 2.85 3.15.81.62 1.39 1.07 1.71 2.05.6 1.82 1.37 2.84 2.73 3.55A3.999 3.999 0 0 0 17 22c2.21 0 4-1.79 4-4h-2c0 1.1-.9 2-2 2zM6.5 10c0-1.25.54-2.47 1.5-3.32l-1.39-1.42C5.35 6.38 4.5 8.1 4.5 10c0 1.9.85 3.62 2.12 4.73l1.39-1.42A4.47 4.47 0 0 1 6.5 10zM3 10c0-2.61 1.09-5.01 2.89-6.71L4.44 1.84A10.94 10.94 0 0 0 1 10c0 3.15 1.33 6.04 3.44 8.15l1.45-1.45C4.33 15.01 3 12.61 3 10z" />
        </svg>
      </button>

    </>
  );
}
