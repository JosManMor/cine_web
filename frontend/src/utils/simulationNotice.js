// Persistencia del consentimiento y del aviso de demostración. El almacenamiento del navegador puede
// estar bloqueado (modo privado, cookies deshabilitadas), así que cada acceso va en try/catch y, si
// falla, el aviso simplemente se vuelve a mostrar.

/** Cambiar la versión obliga a todos los usuarios a aceptar de nuevo los términos. */
export const TERMS_STORAGE_KEY = "cine-sendera:terms-accepted:v1";
const BANNER_STORAGE_KEY = "cine-sendera:demo-banner-dismissed";

export function demoModeActive() {
  return import.meta.env.VITE_DEMO_MODE === "true";
}

function read(storage, key) {
  try { return storage.getItem(key); } catch { return null; }
}

function write(storage, key, value) {
  try { storage.setItem(key, value); } catch { /* almacenamiento no disponible */ }
}

export function hasAcceptedTerms() {
  return read(window.localStorage, TERMS_STORAGE_KEY) !== null;
}

export function saveTermsAcceptance() {
  write(window.localStorage, TERMS_STORAGE_KEY, new Date().toISOString());
}

/** El banner se oculta solo durante la sesión del navegador; vuelve a aparecer en la siguiente. */
export function bannerDismissed() {
  return read(window.sessionStorage, BANNER_STORAGE_KEY) === "1";
}

export function dismissBanner() {
  write(window.sessionStorage, BANNER_STORAGE_KEY, "1");
}
