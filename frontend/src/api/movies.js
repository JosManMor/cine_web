import api from "./axios";

export const getMovies = () => api.get("/movies").then(r => r.data);
export const getMovie  = (id) => api.get(`/movies/${id}`).then(r => r.data);
