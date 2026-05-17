import { C } from "../constants/theme";
import BtnPrimary from "./ui/BtnPrimary";

export default function Navbar({ page, setPage, user, onLogout }) {
  return (
    <nav style={{ background: `linear-gradient(to bottom, rgba(0,0,0,.95), rgba(10,10,10,0))`, position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "0 40px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div onClick={() => setPage("home")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, background: C.red, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎬</div>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: C.white }}>CINE SENDERA</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {["home", "cartelera"].map(p => (
          <button key={p} onClick={() => setPage(p)} style={{
            background: page === p ? C.redGlow : "none", border: page === p ? `1px solid ${C.red}` : "1px solid transparent",
            color: page === p ? C.white : C.gray, padding: "6px 14px", borderRadius: 4,
            fontFamily: "'Open Sans', sans-serif", fontSize: 13, cursor: "pointer", textTransform: "capitalize",
            transition: "all .2s"
          }}>{p === "home" ? "Inicio" : "Cartelera"}</button>
        ))}
        {user
          ? <>
            <button onClick={() => setPage("admin")} style={{ background: "none", border: "none", color: C.gray, fontSize: 13, fontFamily: "'Open Sans', sans-serif", cursor: "pointer" }}>Admin</button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8, padding: "6px 14px", borderRadius: 4, background: C.card, border: `1px solid ${C.border}` }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{user.name[0]}</div>
              <span style={{ fontSize: 13, color: C.gray }}>{user.name}</span>
            </div>
            <button onClick={onLogout} style={{ background: "none", border: `1px solid ${C.border}`, color: C.gray, padding: "6px 12px", borderRadius: 4, fontSize: 12, fontFamily: "'Open Sans', sans-serif", cursor: "pointer" }}>Salir</button>
          </>
          : <>
            <button onClick={() => setPage("login")} style={{ background: "none", border: "none", color: C.gray, fontSize: 13, fontFamily: "'Open Sans', sans-serif", cursor: "pointer" }}>Iniciar sesión</button>
            <BtnPrimary onClick={() => setPage("register")} style={{ padding: "7px 16px" }}>Registrarse</BtnPrimary>
          </>
        }
      </div>
    </nav>
  );
}
