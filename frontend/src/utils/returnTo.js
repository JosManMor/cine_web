// Destino al que volver tras verificar el correo (p. ej. los asientos de la función elegida).
// Va en localStorage porque el enlace del correo se abre en otra pestaña.
const KEY = "post_verify_return";

// Solo rutas internas: evita redirecciones abiertas ("//host" o "https://...").
const isInternal = (path) => typeof path === "string" && path.startsWith("/") && !path.startsWith("//");

export function saveReturnTo(path) {
  try {
    if (isInternal(path)) localStorage.setItem(KEY, path);
  } catch { /* almacenamiento no disponible */ }
}

export function peekReturnTo() {
  try {
    const path = localStorage.getItem(KEY);
    return isInternal(path) ? path : "/";
  } catch {
    return "/";
  }
}

export function takeReturnTo() {
  const path = peekReturnTo();
  try { localStorage.removeItem(KEY); } catch { /* almacenamiento no disponible */ }
  return path;
}
