import api from "./axios";

export const register = (data) =>
  api.post("/register", data);

export const login = (data) =>
  api.post("/login", data);

export const logout = () =>
  api.post("/logout");

export const resendVerification = () =>
  api.post("/email/verification-notification");

export const verifyEmail = (id, hash, params) =>
  api.get(`/email/verify/${id}/${hash}`, { params });
