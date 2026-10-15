import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { C, FONTS } from "./constants/theme";
import { useAuth } from "./context/AuthContext";
import { useToast } from "./context/ToastContext";
import { logout } from "./api/auth";
import Navbar from "./components/Navbar";
import Toast from "./components/ui/Toast";
import HomePage from "./pages/HomePage";
import MovieDetailPage from "./pages/MovieDetailPage";
import SeatsPage from "./pages/SeatsPage";
import CheckoutPage from "./pages/CheckoutPage";
import TicketPage from "./pages/TicketPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import EmailPendingPage from "./pages/EmailPendingPage";
import EmailVerifyPage from "./pages/EmailVerifyPage";
import AdminPage from "./pages/AdminPage";
import MyTicketsPage from "./pages/MyTicketsPage";
import RequireAuth from "./components/guards/RequireAuth";
import RequireVerified from "./components/guards/RequireVerified";
import RequireAdmin from "./components/guards/RequireAdmin";
import RedirectIfAuth from "./components/guards/RedirectIfAuth";

export default function App() {
  const { user, clearAuth } = useAuth();
  const { toasts, addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = () => { clearAuth(); navigate("/login"); };
    const handleUnverified = () => navigate("/email/pendiente");
    window.addEventListener("auth:logout", handleLogout);
    window.addEventListener("auth:unverified", handleUnverified);
    return () => {
      window.removeEventListener("auth:logout", handleLogout);
      window.removeEventListener("auth:unverified", handleUnverified);
    };
  }, [clearAuth, navigate]);

  const onLogout = async () => {
    try { await logout(); } catch { /* token already invalid, continue */ }
    clearAuth();
    navigate("/");
    addToast("Sesión cerrada", "info");
  };

  return (
    <>
      <style>{FONTS}</style>
      <div style={{ background: C.bg, minHeight: "100vh" }}>
        <Toast toasts={toasts} />
        <Navbar user={user} onLogout={onLogout} />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cartelera" element={<HomePage />} />
          <Route path="/pelicula/:id" element={<MovieDetailPage />} />

          <Route path="/asientos" element={
            <RequireVerified><SeatsPage addToast={addToast} /></RequireVerified>
          } />
          <Route path="/checkout" element={
            <RequireVerified><CheckoutPage addToast={addToast} /></RequireVerified>
          } />
          <Route path="/ticket" element={
            <RequireAuth><TicketPage /></RequireAuth>
          } />

          <Route path="/login" element={
            <RedirectIfAuth><LoginPage addToast={addToast} /></RedirectIfAuth>
          } />
          <Route path="/registro" element={
            <RedirectIfAuth><RegisterPage addToast={addToast} /></RedirectIfAuth>
          } />

          <Route path="/email/pendiente" element={
            <RequireAuth><EmailPendingPage addToast={addToast} /></RequireAuth>
          } />
          <Route path="/email/verificar" element={<EmailVerifyPage addToast={addToast} />} />

          <Route path="/admin" element={
            <RequireAdmin><AdminPage /></RequireAdmin>
          } />
          <Route path="/mis-entradas" element={
            <RequireAuth><MyTicketsPage /></RequireAuth>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}
