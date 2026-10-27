import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PillButton from "./ui/PillButton";
import { demoBannerActive } from "./DemoBanner";

function useClickOutside(ref, active, setter) {
  useEffect(() => {
    if (!active) return;
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setter(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [ref, active, setter]);
}

const LINK = "cursor-pointer rounded-full px-3 py-2 text-base font-medium text-muted transition hover:text-ink focus-visible:outline-2 focus-visible:outline-white";

function DiamondMark({ size = 28 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M14 2.5 25.5 14 14 25.5 2.5 14 14 2.5Z" stroke="#ee3a50" strokeWidth="3.5" strokeLinejoin="round" />
    </svg>
  );
}

function SideLink({ label, path, go }) {
  return (
    <button
      type="button"
      onClick={() => go(path)}
      className="w-full cursor-pointer rounded-tile px-4 py-4 text-left text-lg font-medium text-ink transition hover:bg-white/10"
    >
      {label}
    </button>
  );
}

function ProfileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, open, setOpen);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex h-11 cursor-pointer items-center gap-2 rounded-full bg-white/10 py-1 pr-4 pl-1.5 transition select-none hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-accent text-sm font-bold">{user.name[0]}</span>
        <span className="text-sm font-semibold">{user.name}</span>
        <span className={`inline-block text-[10px] text-muted transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+8px)] right-0 z-10 min-w-48 overflow-hidden rounded-tile bg-raised shadow-2xl">
          <div className="px-4 py-3 text-sm font-semibold">{user.name}</div>
          <button
            type="button"
            onClick={() => { onLogout(); setOpen(false); }}
            className="w-full cursor-pointer px-4 py-3 text-left text-sm text-muted transition hover:bg-white/10 hover:text-ink"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

function SidebarProfile({ user, onLogout, onClose }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, open, setOpen);

  return (
    <div ref={ref} className="mb-6">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex w-full cursor-pointer items-center gap-3 rounded-tile bg-raised px-4 py-3.5 select-none"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-base font-bold">{user.name[0]}</span>
        <span className="flex-1 text-left text-sm font-semibold">{user.name}</span>
        <span className={`inline-block text-[10px] text-muted transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {open && (
        <button
          type="button"
          onClick={() => { onLogout(); onClose(); setOpen(false); }}
          className="mt-2 w-full cursor-pointer rounded-tile bg-raised px-4 py-3 text-left text-sm text-muted transition hover:text-ink"
        >
          Cerrar sesión
        </button>
      )}
    </div>
  );
}

function useBannerOffset() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (!demoBannerActive()) return;
    const el = document.getElementById('demo-banner');
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setOffset(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return offset;
}

export default function Navbar({ user, onLogout }) {
  const bannerOffset = useBannerOffset();
  const [sideOpen, setSideOpen] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  // Cierra el menú lateral al cambiar de ruta (ajuste de estado durante el render).
  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setSideOpen(false);
  }

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") setSideOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sideOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sideOpen]);

  function go(path) {
    navigate(path);
    setSideOpen(false);
  }

  const bar = "bg-white";

  return (
    <>
      <nav
        style={{ top: bannerOffset }}
        className="frame fixed inset-x-0 z-200 flex h-16 items-center justify-between gap-4 bg-ground/95 font-sans text-ink"
      >
        <div className="flex items-center gap-4 lg:gap-8">
          <button
            type="button"
            onClick={() => go("/")}
            className="flex cursor-pointer items-center gap-3 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <DiamondMark />
            <span className="text-lg font-extrabold tracking-wide whitespace-nowrap">CINE SENDERA</span>
          </button>

          <div className="hidden items-center md:flex">
            <button type="button" onClick={() => go("/")} className={LINK}>Inicio</button>
            <button type="button" onClick={() => go("/cartelera")} className={LINK}>Cartelera</button>
            {user && user.role === "admin" && (
              <button type="button" onClick={() => go("/admin")} className={LINK}>Admin</button>
            )}
            {user && <button type="button" onClick={() => go("/mis-entradas")} className={LINK}>Mis tickets</button>}
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <ProfileMenu user={user} onLogout={onLogout} />
          ) : (
            <>
              <PillButton variant="ghost" onClick={() => go("/registro")}>Registrarse</PillButton>
              <PillButton variant="light" onClick={() => go("/login")}>Iniciar sesión</PillButton>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setSideOpen(v => !v)}
          aria-label="Menú"
          aria-expanded={sideOpen}
          className="flex size-11 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-full md:hidden"
        >
          <span className={`block h-0.5 w-5.5 rounded-full transition ${bar} ${sideOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-5.5 rounded-full transition ${bar} ${sideOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5.5 rounded-full transition ${bar} ${sideOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </nav>

      <div
        aria-hidden="true"
        onClick={() => setSideOpen(false)}
        className={`fixed inset-0 z-210 bg-black/60 transition-opacity duration-300 ${sideOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />

      <aside
        className={`fixed top-0 right-0 bottom-0 z-220 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-surface px-6 py-6 font-sans text-ink transition-transform duration-300 ${sideOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DiamondMark size={22} />
            <span className="text-base font-extrabold tracking-wide">CINE SENDERA</span>
          </div>
          <button type="button" onClick={() => setSideOpen(false)} aria-label="Cerrar" className="size-10 cursor-pointer rounded-full text-muted hover:text-ink">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" className="mx-auto" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3l12 12M15 3 3 15" /></svg>
          </button>
        </div>

        {user && <SidebarProfile user={user} onLogout={onLogout} onClose={() => setSideOpen(false)} />}

        <div className="flex flex-1 flex-col">
          <SideLink label="Inicio" path="/" go={go} />
          <SideLink label="Cartelera" path="/cartelera" go={go} />
          {user ? (
            <>
              {user.role === "admin" && <SideLink label="Panel Admin" path="/admin" go={go} />}
              <SideLink label="Mis tickets" path="/mis-entradas" go={go} />
            </>
          ) : (
            <>
              <SideLink label="Iniciar sesión" path="/login" go={go} />
              <PillButton variant="primary" size="lg" onClick={() => go("/registro")} className="mt-4 w-full">
                Registrarse
              </PillButton>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
