// Las películas solo traen un póster vertical. Cuando viene de picsum (semilla fija),
// pedimos la misma imagen en formato horizontal; si no, usamos el póster tal cual.
const PICSUM_SIZE = /^(https:\/\/picsum\.photos\/seed\/[^/]+)\/\d+\/\d+$/;

export function landscapeUrl(movie, width = 1600, height = 900) {
  const url = movie?.poster_url;
  if (!url) return null;
  const match = PICSUM_SIZE.exec(url);
  return match ? `${match[1]}/${width}/${height}` : url;
}

export function fmtShowtime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("es-MX", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  });
}
