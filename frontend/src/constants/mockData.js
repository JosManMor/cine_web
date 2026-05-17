export const MOVIES = [
  { id: 1, title: "Inferno Nexus", genre: "Acción", duration: "2h 18m", seats: 48, total: 120, rating: "8.4", color: "#E50914", emoji: "🔥", schedule: ["14:00", "17:30", "21:00"], synopsis: "Un ex-agente infiltrado debe detener una conspiración global antes de que el mundo colapse en llamas. Acción sin tregua en cada fotograma.", cast: "Marco Reyes, Ana Villanueva, Luis Serrano" },
  { id: 2, title: "Hollow Depths", genre: "Terror", duration: "1h 52m", seats: 12, total: 120, rating: "7.9", color: "#6B21A8", emoji: "👁️", schedule: ["15:00", "19:00", "23:00"], synopsis: "Cinco investigadores descienden a una cueva submarina inexplorada. Lo que encuentran desafía toda lógica y amenaza con no dejarlos salir.", cast: "Carmen Solís, Diego Paz, Ema Ruiz" },
  { id: 3, title: "Última Vuelta", genre: "Comedia", duration: "1h 44m", seats: 85, total: 120, rating: "7.2", color: "#F59E0B", emoji: "🏎️", schedule: ["13:00", "16:00", "20:30"], synopsis: "Tres amigos de la infancia se reencuentran en una carrera de autos amateur y descubren que la vida los ha cambiado... o quizá no tanto.", cast: "Pablo Mora, Sofía Leal, Tomás Ibarra" },
];

export const SEAT_LAYOUT = [
  ["T", "T", "T", "T", "A", "T", "T", "T", "T", "A", "T", "T", "T", "T"],
  ["T", "T", "T", "T", "A", "T", "T", "T", "T", "A", "T", "T", "T", "T"],
  ["T", "T", "T", "T", "A", "T", "T", "T", "T", "A", "T", "T", "T", "T"],
  ["T", "T", "T", "T", "A", "T", "T", "O", "T", "A", "T", "T", "T", "T"],
  ["T", "T", "O", "T", "A", "T", "T", "T", "T", "A", "O", "T", "T", "T"],
  ["T", "T", "T", "T", "A", "O", "T", "T", "O", "A", "T", "T", "T", "T"],
  ["T", "T", "T", "T", "A", "T", "T", "T", "T", "A", "T", "T", "O", "T"],
];

export const ROW_LABELS = ["A", "B", "C", "D", "E", "F", "G"];
