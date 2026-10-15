import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { C } from "../constants/theme";
import BtnPrimary from "./ui/BtnPrimary";

export default function Navbar({ user, onLogout }) {
  const [sideOpen, setSideOpen]             = useState(false);
  const [profileOpen, setProfileOpen]       = useState(false);
  const [sideProfileOpen, setSideProfileOpen] = useState(false);
  const profileRef     = useRef(null);
  const sideProfileRef = useRef(null);
  const navigate       = useNavigate();
  const location       = useLocation();

  useEffect(() => { setSideOpen(false); setProfileOpen(false); setSideProfileOpen(false); }, [location.pathname]);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") { setSideOpen(false); setProfileOpen(false); } }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sideOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sideOpen]);

  useEffect(() => {
    function onClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    if (profileOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [profileOpen]);

  useEffect(() => {
    function onClickOutside(e) {
      if (sideProfileRef.current && !sideProfileRef.current.contains(e.target)) setSideProfileOpen(false);
    }
    if (sideProfileOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [sideProfileOpen]);

  function go(path) {
    navigate(path);
    setSideOpen(false);
  }

  const SideLink = ({ label, path }) => (
    <button
      onClick={() => go(path)}
      style={{ background: "none", border: "none", color: C.white, fontSize: 18, fontFamily: "'Open Sans', sans-serif", cursor: "pointer", textAlign: "left", padding: "14px 0", borderBottom: `1px solid ${C.border}`, width: "100%" }}
    >
      {label}
    </button>
  );

  return (
    <>
      <nav style={{ background: "linear-gradient(to bottom, rgba(0,0,0,.95), rgba(10,10,10,0))", position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        <div onClick={() => go("/")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: C.red, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎬</div>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2, color: C.white }}>CINE SENDERA</span>
        </div>

        <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {user ? (
            <>
              {user.role === "admin" && (
                <button onClick={() => go("/admin")} style={{ background: "none", border: "none", color: C.gray, fontSize: 15, fontFamily: "'Open Sans', sans-serif", cursor: "pointer", textShadow: "0 1px 6px rgba(0,0,0,.85)" }}>Admin</button>
              )}
              <button onClick={() => go("/mis-entradas")} style={{ background: "none", border: "none", color: C.gray, fontSize: 15, fontFamily: "'Open Sans', sans-serif", cursor: "pointer", textShadow: "0 1px 6px rgba(0,0,0,.85)" }}>Mis tickets</button>

              <div ref={profileRef} style={{ position: "relative" }}>
                <div
                  onClick={() => setProfileOpen(v => !v)}
                  style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8, padding: "6px 14px", borderRadius: 4, background: C.card, border: `1px solid ${profileOpen ? C.red : C.border}`, cursor: "pointer", userSelect: "none", transition: "border-color .2s" }}
                >
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{user.name[0]}</div>
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
              <button onClick={() => go("/login")} style={{ background: "none", border: "none", color: C.gray, fontSize: 15, fontFamily: "'Open Sans', sans-serif", cursor: "pointer", textShadow: "0 1px 6px rgba(0,0,0,.85)" }}>Iniciar sesión</button>
              <BtnPrimary onClick={() => go("/registro")} style={{ padding: "7px 16px" }}>Registrarse</BtnPrimary>
            </>
          )}
        </div>

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

      <div
        onClick={() => setSideOpen(false)}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 210, opacity: sideOpen ? 1 : 0, pointerEvents: sideOpen ? "auto" : "none", transition: "opacity .3s" }}
      />

      <aside
        style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 280, background: C.surface, zIndex: 220, transform: sideOpen ? "translateX(0)" : "translateX(100%)", transition: "transform .3s cubic-bezier(.4,0,.2,1)", display: "flex", flexDirection: "column", padding: "24px 28px", overflowY: "auto" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, background: C.red, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🎬</div>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, color: C.white }}>CINE SENDERA</span>
          </div>
          <button onClick={() => setSideOpen(false)} aria-label="Cerrar" style={{ background: "none", border: "none", color: C.gray, fontSize: 22, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        {user && (
          <div ref={sideProfileRef} style={{ position: "relative", marginBottom: 24 }}>
            <div
              onClick={() => setSideProfileOpen(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: sideProfileOpen ? "6px 6px 0 0" : 6, background: C.card, border: `1px solid ${sideProfileOpen ? C.red : C.border}`, cursor: "pointer", userSelect: "none", transition: "border-color .2s" }}
            >
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, flexShrink: 0 }}>{user.name[0]}</div>
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

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <SideLink label="Inicio" path="/" />
          {user ? (
            <>
              {user.role === "admin" && <SideLink label="Panel Admin" path="/admin" />}
              <SideLink label="Mis tickets" path="/mis-entradas" />
            </>
          ) : (
            <>
              <SideLink label="Iniciar sesión" path="/login" />
              <BtnPrimary onClick={() => go("/registro")} style={{ width: "100%", textAlign: "center", padding: "11px 0", marginTop: 16 }}>
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
