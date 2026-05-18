import { useState, useEffect } from "react";
import { C, FONTS } from "./constants/theme";
import { useAuth } from "./context/AuthContext";
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

export default function App() {
  const { user, clearAuth } = useAuth();
  const [page, setPage] = useState("home");
  const [selectedMovie, setSelectedMovie]     = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedSeats, setSelectedSeats]     = useState([]);
  const [purchaseResult, setPurchaseResult]   = useState(null);
  const [toasts, setToasts] = useState([]);

  // Detecta el link de verificación de correo al montar
  useEffect(() => {
    if (window.location.pathname === "/email/verify") setPage("email-verify");
  }, []);

  // Escucha eventos del interceptor de axios
  useEffect(() => {
    const handleLogout     = () => { clearAuth(); setPage("login"); };
    const handleUnverified = () => setPage("email-pending");
    window.addEventListener("auth:logout",     handleLogout);
    window.addEventListener("auth:unverified", handleUnverified);
    return () => {
      window.removeEventListener("auth:logout",     handleLogout);
      window.removeEventListener("auth:unverified", handleUnverified);
    };
  }, [clearAuth]);

  const addToast = (msg, type = "info") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  };

  const onLogout = async () => {
    try { await logout(); } catch { /* token ya inválido, se continúa */ }
    clearAuth();
    setPage("home");
    addToast("Sesión cerrada", "info");
  };

  const nav = (p) => {
    if ((p === "seats" || p === "checkout") && !user) {
      addToast("Inicia sesión para continuar", "error");
      setPage("login");
      return;
    }
    if ((p === "seats" || p === "checkout") && user?.verified === false) {
      addToast("Verifica tu correo para comprar entradas", "error");
      setPage("email-pending");
      return;
    }
    setPage(p);
  };

  return (
    <>
      <style>{FONTS}</style>
      <div style={{ background: C.bg, minHeight: "100vh" }}>
        <Toast toasts={toasts} />
        <Navbar page={page} setPage={nav} user={user} onLogout={onLogout} />
        <div>
          {page === "home"          && <HomePage         setPage={nav} setSelectedMovie={setSelectedMovie} />}
          {page === "cartelera"     && <HomePage         setPage={nav} setSelectedMovie={setSelectedMovie} />}
          {page === "movie-detail"  && <MovieDetailPage  movie={selectedMovie} setPage={nav} setSelectedMovie={setSelectedMovie} setSelectedSchedule={setSelectedSchedule} />}
          {page === "seats"         && <SeatsPage        movie={selectedMovie} schedule={selectedSchedule} setPage={nav} addToast={addToast} user={user} setSelectedSeats={setSelectedSeats} />}
          {page === "checkout"      && <CheckoutPage     movie={selectedMovie} schedule={selectedSchedule} user={user} selectedSeats={selectedSeats} setPage={nav} addToast={addToast} setPurchaseResult={setPurchaseResult} />}
          {page === "ticket"        && <TicketPage       movie={selectedMovie} schedule={selectedSchedule} purchaseResult={purchaseResult} user={user} setPage={nav} />}
          {page === "login"         && <LoginPage        setPage={nav} addToast={addToast} />}
          {page === "register"      && <RegisterPage     setPage={nav} addToast={addToast} />}
          {page === "email-pending" && <EmailPendingPage setPage={nav} addToast={addToast} />}
          {page === "email-verify"  && <EmailVerifyPage  setPage={nav} addToast={addToast} />}
          {page === "admin"         && <AdminPage        user={user} setPage={nav} />}
          {page === "my-tickets"    && <MyTicketsPage    setPage={nav} />}
        </div>
      </div>
    </>
  );
}
