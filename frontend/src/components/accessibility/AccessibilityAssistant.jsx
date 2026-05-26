import { useState, useEffect, useRef, useCallback } from "react";

/* ─── Mapeo de páginas a anuncios de contexto ─────────────────────────────── */
const PAGE_ANNOUNCEMENTS = {
  home:          "Estás en la página de inicio. Aquí puedes ver la cartelera de películas.",
  cartelera:     "Estás en la cartelera. Aquí puedes ver todas las películas disponibles.",
  "movie-detail":"Estás en el detalle de una película. Puedes ver las funciones disponibles y seleccionar asientos.",
  seats:         "Estás en la selección de asientos. Usa Tab para navegar por los asientos disponibles.",
  checkout:      "Estás en la confirmación de compra. Revisa tu orden antes de confirmar.",
  ticket:        "Tu comprobante está listo. Presenta el código QR en taquilla.",
  login:         "Estás en la pantalla de inicio de sesión.",
  register:      "Estás en la pantalla de registro. Crea tu cuenta de Cine Sendera.",
  "email-pending":"Revisa tu correo electrónico para verificar tu cuenta.",
  "email-verify":"Verificando tu correo electrónico.",
  admin:         "Estás en el panel de administración.",
  "my-tickets":  "Estás en tu sección de tickets. Aquí puedes ver tus compras activas.",
};

/* ─── Etiquetas amigables por tipo de elemento ──────────────────────────────── */
const TAG_LABELS = {
  BUTTON:   "Botón",
  A:        "Enlace",
  INPUT:    "Campo de texto",
  SELECT:   "Lista desplegable",
  TEXTAREA: "Área de texto",
  IMG:      "Imagen",
  H1: "Título principal", H2: "Título", H3: "Subtítulo",
  P:  "Párrafo", SPAN: "", DIV: "",
};

const INPUT_TYPE_LABELS = {
  email:    "Correo electrónico",
  password: "Contraseña",
  text:     "Texto",
  number:   "Número",
  checkbox: "Casilla de verificación",
  radio:    "Opción",
  search:   "Búsqueda",
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

  // Botón
  if (tag === "BUTTON") {
    const text = el.textContent?.trim().replace(/\s+/g, " ").slice(0, 80);
    const disabled = el.disabled ? "deshabilitado" : "";
    return [TAG_LABELS.BUTTON, text, disabled].filter(Boolean).join(": ");
  }

  // Imagen
  if (tag === "IMG") {
    const alt = el.getAttribute("alt");
    return alt ? `Imagen: ${alt}` : "Imagen decorativa";
  }

  // Enlace
  if (tag === "A") {
    const text = el.textContent?.trim().replace(/\s+/g, " ").slice(0, 80);
    return `Enlace: ${text}`;
  }

  // Heading
  if (["H1","H2","H3","H4"].includes(tag)) {
    return `${TAG_LABELS[tag]}: ${el.textContent?.trim().slice(0, 80)}`;
  }

  // Cualquier otro elemento focusable
  const text = el.textContent?.trim().replace(/\s+/g, " ").slice(0, 80);
  return text || el.tagName.toLowerCase();
}

/* ─── Web Speech API helper ─────────────────────────────────────────────────── */
let currentUtterance = null;
function speak(text, rate = 1, volume = 1) {
  if (!window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang    = "es-MX";
  utt.rate    = rate;
  utt.volume  = volume;
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
  const [enabled, setEnabled]         = useState(false);
  const [rate]                        = useState(1);
  const [volume]                      = useState(1);
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
    position:   "fixed",
    right:      24,
    bottom:     24,
    width:      52,
    height:     52,
    borderRadius: "50%",
    background:  enabled ? "#E50914" : "rgba(30,30,30,0.9)",
    border:      `2px solid ${enabled ? "#E50914" : "rgba(255,255,255,0.2)"}`,
    backdropFilter: "blur(10px)",
    cursor:      "pointer",
    display:     "flex",
    alignItems:  "center",
    justifyContent: "center",
    fontSize:    22,
    boxShadow:   enabled ? "0 0 18px rgba(229,9,20,0.55)" : "0 4px 16px rgba(0,0,0,0.5)",
    transition:  "all .3s",
    zIndex:      10000,
  };

  return (
    <>
      {/* Botón flotante de toggle */}
      <button
        style={toggleStyle}
        onClick={() => setEnabled(v => !v)}
        aria-label={enabled ? "Desactivar asistente de accesibilidad" : "Activar asistente de accesibilidad"}
        title="Alt+A para activar/desactivar"
      >
        ♿
      </button>

    </>
  );
}
