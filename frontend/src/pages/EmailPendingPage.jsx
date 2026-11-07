import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PillButton from "../components/ui/PillButton";
import { CheckIcon, ClockIcon, ExternalIcon, InboxIcon, MailIcon, RefreshIcon, SpinnerIcon } from "../components/ui/icons";
import { resendVerification } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function EmailPendingPage({ addToast }) {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    setSent(false);
    try {
      await resendVerification();
      setSent(true);
      addToast("Correo reenviado", "success");
    } catch {
      addToast("No se pudo reenviar. Intenta más tarde.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/");
    addToast("Sesión cerrada", "info");
  };

  return (
    <main className="frame flex min-h-svh items-center bg-ground pt-28 pb-20 font-sans text-ink">
      <div className="mx-auto grid w-full max-w-6xl animate-rise items-start gap-10 motion-reduce:animate-none lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <section aria-labelledby="pending-title">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent text-ink">
            <MailIcon size={26} />
          </span>

          <h1 id="pending-title" className="m-0 mt-8 text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.02] font-extrabold tracking-tight text-balance text-ink">
            Verifica tu correo
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink">
            Enviamos un enlace de verificación a
            <strong className="mt-1 block text-xl font-semibold [overflow-wrap:anywhere] sm:text-2xl">{user?.email}</strong>
          </p>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink">
            Ábrelo para activar tu cuenta y poder comprar entradas.
          </p>

          <p className="mt-4 flex items-center gap-2 text-base text-muted">
            <ClockIcon size={18} />
            El enlace caduca en 60 minutos.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <PillButton
              size="lg"
              onClick={handleResend}
              disabled={loading}
              aria-busy={loading}
              className="w-full disabled:cursor-wait disabled:opacity-70 sm:w-auto"
            >
              {loading ? <SpinnerIcon /> : <RefreshIcon />}
              {loading ? "Enviando…" : "Reenviar correo"}
            </PillButton>
            <PillButton size="lg" variant="ghost" onClick={handleLogout} className="w-full sm:w-auto">
              Cerrar sesión
            </PillButton>
          </div>

          <p role="status" className="mt-5 flex min-h-6 items-center gap-2 text-base text-muted">
            {sent && (
              <>
                <CheckIcon size={18} className="text-ink" />
                Te enviamos un enlace nuevo. Revisa también la carpeta de spam.
              </>
            )}
          </p>
        </section>

        <aside aria-labelledby="inbox-title" className="rounded-card bg-surface p-6 sm:p-8 lg:p-10">
          <InboxIcon size={28} className="text-accent" />
          <h2 id="inbox-title" className="m-0 mt-6 text-2xl font-bold tracking-tight text-ink">
            Bandeja de la demostración
          </h2>
          <p className="mt-3 text-base leading-relaxed text-ink">
            En esta simulación los correos no salen a internet: llegan a un buzón de prueba donde puedes abrir el enlace de verificación.
          </p>
          <PillButton
            as="a"
            href="/mailpit/"
            target="_blank"
            rel="noopener noreferrer"
            variant="light"
            className="mt-8"
          >
            Abrir bandeja de correo
            <ExternalIcon size={18} />
          </PillButton>
          <p className="mt-6 text-sm leading-relaxed text-muted">
            ¿No aparece? Espera unos segundos o pulsa «Reenviar correo».
          </p>
        </aside>
      </div>
    </main>
  );
}
