import api from "./axios";

export const getScreening   = (id)   => api.get(`/screenings/${id}`).then(r => r.data);
export const createPurchase = (data) => api.post("/purchases", data).then(r => r.data);
export const getMyTickets   = ()     => api.get("/my-tickets").then(r => r.data);
export const getTicket      = (code) => api.get(`/tickets/${code}`).then(r => r.data);
