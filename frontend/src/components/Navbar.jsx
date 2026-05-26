import { useState, useEffect, useRef } from "react";
import { C } from "../constants/theme";
import BtnPrimary from "./ui/BtnPrimary";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/logo.png";

const SunIcon = ({ size = 14, color = "currentColor", style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = ({ size = 14, color = "currentColor", style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

function ThemeToggle({ style }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label="Cambiar tema"
      style={{
        width: 56,
        height: 30,
        borderRadius: 15,
        padding: 3,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        position: "relative",
        background: isDark ? "#121212" : "#E5E5EA",
        border: `1px solid ${isDark ? "#3D3939" : "#D1D1D6"}`,
        boxShadow: isDark ? "inset 0 2px 4px rgba(0,0,0,0.6)" : "inset 0 2px 4px rgba(0,0,0,0.06)",
        outline: "none",
        flexShrink: 0,
        ...style
      }}
    >
      <div style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", pointerEvents: "none", opacity: isDark ? 0.3 : 0 }}>
        <SunIcon size={13} color="#F59E0B" />
      </div>
      <div style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", pointerEvents: "none", opacity: isDark ? 0 : 0.4 }}>
        <MoonIcon size={12} color="#A1A1AA" />
      </div>

      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: isDark ? "#E50914" : "#F59E0B",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "absolute",
          left: 3,
          transform: isDark ? "translateX(28px)" : "translateX(0)",
          transition: "transform 0.45s cubic-bezier(0.25, 0.8, 0.25, 1.25), background-color 0.3s ease, box-shadow 0.3s",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
        }}
      >
        <SunIcon
          size={12}
          color="#FFFFFF"
          style={{
            position: "absolute",
            opacity: isDark ? 0 : 1,
            transform: isDark ? "rotate(-180deg) scale(0.6)" : "rotate(0) scale(1)",
            transition: "transform 0.45s cubic-bezier(0.25, 0.8, 0.25, 1.25), opacity 0.3s"
          }}
        />
        <MoonIcon
          size={11}
          color="#FFFFFF"
          style={{
            position: "absolute",
            opacity: isDark ? 1 : 0,
            transform: isDark ? "rotate(0) scale(1)" : "rotate(180deg) scale(0.6)",
            transition: "transform 0.45s cubic-bezier(0.25, 0.8, 0.25, 1.25), opacity 0.3s"
          }}
        />
      </div>
    </button>
  );
}

export default function Navbar({ page, setPage, user, onLogout }) {
  const [sideOpen, setSideOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sideProfileOpen, setSideProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const sideProfileRef = useRef(null);

  // Cierra sidebar y dropdowns al cambiar de página
  useEffect(() => { setSideOpen(false); setProfileOpen(false); setSideProfileOpen(false); }, [page]);

  // Cierra sidebar con Escape
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") { setSideOpen(false); setProfileOpen(false); } }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Bloquea scroll del body cuando el sidebar está abierto
  useEffect(() => {
    document.body.style.overflow = sideOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sideOpen]);

  // Cierra dropdown de perfil (desktop) al hacer clic fuera
  useEffect(() => {
    function onClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    if (profileOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [profileOpen]);

  // Cierra dropdown de perfil (sidebar) al hacer clic fuera
  useEffect(() => {
    function onClickOutside(e) {
      if (sideProfileRef.current && !sideProfileRef.current.contains(e.target)) setSideProfileOpen(false);
    }
    if (sideProfileOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [sideProfileOpen]);

  function navigate(target) {
    setPage(target);
    setSideOpen(false); // cierra sidebar siempre, incluso si ya está en esa página
  }

  const SideLink = ({ label, target }) => (
    <button
      onClick={() => navigate(target)}
      style={{ background: "none", border: "none", color: C.white, fontSize: 18, fontFamily: "'Open Sans', sans-serif", cursor: "pointer", textAlign: "left", padding: "14px 0", borderBottom: `1px solid ${C.border}`, width: "100%" }}
    >
      {label}
    </button>
  );

  return (
    <>
      <nav style={{ background: C.navBg, borderBottom: `1px solid ${C.navBorder}`, position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        {/* Logo */}
        <div 
          onClick={() => setPage("home")} 
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPage("home"); } }}
          tabIndex={0}
          role="link"
          aria-label="Ir a inicio"
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
          <img src={logo} alt="" style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 4 }} />
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: C.white }}>CINE SENDERA</span>
        </div>

        {/* Desktop nav */}
        <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <ThemeToggle />
          {user ? (
            <>
              {user.role === "admin" && (
                <button onClick={() => setPage("admin")} style={{ background: "none", border: "none", color: C.gray, fontSize: 15, fontFamily: "'Open Sans', sans-serif", cursor: "pointer", textShadow: "0 1px 6px rgba(0,0,0,.85)" }}>Admin</button>
              )}
              <button onClick={() => setPage("my-tickets")} style={{ background: "none", border: "none", color: C.gray, fontSize: 15, fontFamily: "'Open Sans', sans-serif", cursor: "pointer", textShadow: "0 1px 6px rgba(0,0,0,.85)" }}>Mis tickets</button>

              {/* Profile dropdown */}
              <div ref={profileRef} style={{ position: "relative" }}>
                <div
                  onClick={() => setProfileOpen(v => !v)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setProfileOpen(v => !v); } }}
                  tabIndex={0}
                  role="button"
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                  aria-label="Menú de usuario"
                  style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8, padding: "6px 14px", borderRadius: 4, background: C.card, border: `1px solid ${profileOpen ? C.red : C.border}`, cursor: "pointer", userSelect: "none", transition: "border-color .2s" }}
                >
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#FFFFFF" }}>{user.name[0]}</div>
                  <span style={{ fontSize: 13, color: C.gray }}>{user.name}</span>
                  <span style={{ fontSize: 10, color: C.grayDark, transition: "transform .2s", display: "inline-block", transform: profileOpen ? "rotate(180deg)" : "none" }}>▼</span>
                </div>

                {profileOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, minWidth: 160, background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,.5)" }}>
                    <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 13, color: C.white, fontWeight: 600 }}>{user.name}</div>
                    </div>
                    <button
                      onClick={() => { onLogout(); setProfileOpen(false); }}
                      style={{ width: "100%", background: "none", border: "none", color: C.gray, padding: "10px 14px", fontSize: 13, fontFamily: "'Open Sans', sans-serif", cursor: "pointer", textAlign: "left" }}
                      onMouseEnter={e => e.currentTarget.style.background = C.grayDarker}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setPage("login")} style={{ background: "none", border: "none", color: C.gray, fontSize: 15, fontFamily: "'Open Sans', sans-serif", cursor: "pointer", textShadow: "0 1px 6px rgba(0,0,0,.85)" }}>Iniciar sesión</button>
              <BtnPrimary onClick={() => setPage("register")} style={{ padding: "7px 16px" }}>Registrarse</BtnPrimary>
            </>
          )}
        </div>

        {/* Hamburger (mobile) */}
        <button
          className="nav-hamburger"
          onClick={() => setSideOpen(v => !v)}
          aria-label="Menú"
          style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: 6, flexDirection: "column", gap: 5, alignItems: "center", justifyContent: "center" }}
        >
          <span style={{ display: "block", width: 22, height: 2, background: sideOpen ? C.red : C.gray, borderRadius: 2, transition: "transform .25s, opacity .25s", transform: sideOpen ? "translateY(7px) rotate(45deg)" : "none" }} />
          <span style={{ display: "block", width: 22, height: 2, background: C.gray, borderRadius: 2, transition: "opacity .25s", opacity: sideOpen ? 0 : 1 }} />
          <span style={{ display: "block", width: 22, height: 2, background: sideOpen ? C.red : C.gray, borderRadius: 2, transition: "transform .25s, opacity .25s", transform: sideOpen ? "translateY(-7px) rotate(-45deg)" : "none" }} />
        </button>
      </nav>

      {/* Overlay */}
      <div
        onClick={() => setSideOpen(false)}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 210, opacity: sideOpen ? 1 : 0, pointerEvents: sideOpen ? "auto" : "none", transition: "opacity .3s" }}
      />

      {/* Sidebar */}
      <aside
        style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 280, background: C.surface, zIndex: 220, transform: sideOpen ? "translateX(0)" : "translateX(100%)", visibility: sideOpen ? "visible" : "hidden", transition: `transform .3s cubic-bezier(.4,0,.2,1), visibility 0s linear ${sideOpen ? "0s" : "0.3s"}`, display: "flex", flexDirection: "column", padding: "24px 28px", overflowY: "auto" }}
      >
        {/* Sidebar header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src={logo} alt="Cine Sendera" style={{ width: 26, height: 26, objectFit: "contain", borderRadius: 3 }} />
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, color: C.white }}>CINE SENDERA</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <ThemeToggle />
            <button onClick={() => setSideOpen(false)} aria-label="Cerrar" style={{ background: "none", border: "none", color: C.gray, fontSize: 22, cursor: "pointer", lineHeight: 1 }}>✕</button>
          </div>
        </div>

        {/* User info con dropdown */}
        {user && (
          <div ref={sideProfileRef} style={{ position: "relative", marginBottom: 24 }}>
            <div
              onClick={() => setSideProfileOpen(v => !v)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSideProfileOpen(v => !v); } }}
              tabIndex={0}
              role="button"
              aria-expanded={sideProfileOpen}
              aria-haspopup="menu"
              aria-label="Menú de usuario"
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: sideProfileOpen ? "6px 6px 0 0" : 6, background: C.card, border: `1px solid ${sideProfileOpen ? C.red : C.border}`, cursor: "pointer", userSelect: "none", transition: "border-color .2s" }}
            >
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, flexShrink: 0, color: "#FFFFFF" }}>{user.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: C.white, fontWeight: 600 }}>{user.name}</div>
              </div>
              <span style={{ fontSize: 10, color: C.grayDark, transition: "transform .2s", display: "inline-block", transform: sideProfileOpen ? "rotate(180deg)" : "none" }}>▼</span>
            </div>
            {sideProfileOpen && (
              <button
                onClick={() => { onLogout(); setSideOpen(false); setSideProfileOpen(false); }}
                style={{ width: "100%", background: C.grayDarker, border: `1px solid ${C.red}`, borderTop: "none", color: C.gray, padding: "11px 16px", fontSize: 14, fontFamily: "'Open Sans', sans-serif", cursor: "pointer", textAlign: "left", borderRadius: "0 0 6px 6px" }}
                onMouseEnter={e => e.currentTarget.style.background = C.border}
                onMouseLeave={e => e.currentTarget.style.background = C.grayDarker}
              >
                Cerrar sesión
              </button>
            )}
          </div>
        )}

        {/* Links */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <SideLink label="Inicio" target="home" />
          {user ? (
            <>
              {user.role === "admin" && <SideLink label="Panel Admin" target="admin" />}
              <SideLink label="Mis tickets" target="my-tickets" />
            </>
          ) : (
            <>
              <SideLink label="Iniciar sesión" target="login" />
              <BtnPrimary onClick={() => navigate("register")} style={{ width: "100%", textAlign: "center", padding: "11px 0", marginTop: 16 }}>
                Registrarse
              </BtnPrimary>
            </>
          )}
        </div>
      </aside>

      <style>{`
        @media (max-width: 600px) {
          .nav-desktop   { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
}
