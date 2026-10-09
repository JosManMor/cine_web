import api from "./axios";

export const getAdminMetrics  = () => api.get("/admin/metrics").then(r => r.data);
export const getAdminActivity = () => api.get("/admin/activity").then(r => r.data);
export const getAdminRooms    = () => api.get("/admin/rooms").then(r => r.data);
export const getAdminSystem   = () => api.get("/admin/system").then(r => r.data);

