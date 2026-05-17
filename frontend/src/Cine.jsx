import { useState } from "react";
import { C, FONTS } from "./constants/theme";
import { MOVIES } from "./constants/mockData";
import Navbar from "./components/Navbar";
import Toast from "./components/ui/Toast";
import HomePage from "./pages/HomePage";
import MovieDetailPage from "./pages/MovieDetailPage";
import SeatsPage from "./pages/SeatsPage";
import CheckoutPage from "./pages/CheckoutPage";
import TicketPage from "./pages/TicketPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(MOVIES[0]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (msg, type = "info") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  };

  const onLogout = () => { setUser(null); setPage("home"); addToast("Sesión cerrada", "info"); };

  const nav = (p) => {
    if ((p === "seats" || p === "checkout") && !user) { addToast("Inicia sesión para continuar", "error"); setPage("login"); return; }
    setPage(p);
  };

  return (
    <>
      <style>{FONTS}</style>
      <div style={{ background: C.bg, minHeight: "100vh" }}>
        <Toast toasts={toasts} />
        <Navbar page={page} setPage={nav} user={user} onLogout={onLogout} />
        <div>
          {page === "home"         && <HomePage        setPage={nav} setSelectedMovie={setSelectedMovie} />}
          {page === "cartelera"    && <HomePage        setPage={nav} setSelectedMovie={setSelectedMovie} />}
          {page === "movie-detail" && <MovieDetailPage movie={selectedMovie} setPage={nav} setSelectedMovie={setSelectedMovie} setSelectedSchedule={setSelectedSchedule} />}
          {page === "seats"        && <SeatsPage       movie={selectedMovie} schedule={selectedSchedule} setPage={nav} addToast={addToast} user={user} />}
          {page === "checkout"     && <CheckoutPage    movie={selectedMovie} user={user} setPage={nav} addToast={addToast} />}
          {page === "ticket"       && <TicketPage      movie={selectedMovie} addToast={addToast} />}
          {page === "login"        && <LoginPage       setPage={nav} setUser={setUser} addToast={addToast} />}
          {page === "register"     && <RegisterPage    setPage={nav} addToast={addToast} />}
          {page === "admin"        && <AdminPage       user={user} setPage={nav} />}
        </div>
      </div>
    </>
  );
}
