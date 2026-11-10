import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import PillButton from "../components/ui/PillButton";
import { CheckIcon, ClockIcon, InboxIcon, RefreshIcon, SpinnerIcon } from "../components/ui/icons";
import { resendVerification } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { takeReturnTo } from "../utils/returnTo";

export default function EmailPendingPage({ addToast }) {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // Si el correo se verificó en otra pestaña, retoma la compra aquí.
  useEffect(() => {
    if (user?.verified === true) navigate(takeReturnTo(), { replace: true });
  }, [user?.verified, navigate]);

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
        <section aria-labelledby="inbox-title">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent text-ink">
            <InboxIcon size={26} />
          </span>

          <h1 id="inbox-title" className="m-0 mt-8 text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] font-extrabold tracking-tight text-balance text-ink">
            Revisa la bandeja de demostración
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink">
            En esta simulación los correos no salen a internet: tu enlace de verificación está en el buzón de prueba.
          </p>

          <PillButton
            as="a"
            href="/mailpit/"
            target="_blank"
            rel="noopener"
            size="lg"
            className="mt-10 w-full sm:w-auto"
          >
            Abrir bandeja de correo
            <ArrowRight size={18} />
          </PillButton>

          <p className="mt-6 flex items-center gap-2 text-base text-muted">
            <ClockIcon size={18} />
            El enlace caduca en 60 minutos.
          </p>
        </section>

        <aside aria-labelledby="pending-title" className="rounded-card bg-surface p-6 sm:p-8 lg:p-10">
          <h2 id="pending-title" className="m-0 text-2xl font-bold tracking-tight text-ink">
            Verifica tu correo
          </h2>
          <p className="mt-3 text-base leading-relaxed text-ink">
            Enviamos el enlace a{" "}
            <strong className="mt-1 block font-semibold [overflow-wrap:anywhere]">{user?.email}</strong>
          </p>
          <p className="mt-3 text-base leading-relaxed text-muted">
            ¿No aparece? Espera unos segundos y actualiza la bandeja, o pide un enlace nuevo.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <PillButton
              variant="light"
              onClick={handleResend}
              disabled={loading}
              aria-busy={loading}
              className="w-full disabled:cursor-wait disabled:opacity-70 sm:w-auto"
            >
              {loading ? <SpinnerIcon size={18} /> : <RefreshIcon size={18} />}
              {loading ? "Enviando…" : "Reenviar correo"}
            </PillButton>
            <PillButton variant="ghost" onClick={handleLogout} className="w-full sm:w-auto">
              Cerrar sesión
            </PillButton>
          </div>

          <output className="mt-5 flex min-h-6 items-center gap-2 text-sm text-muted">
            {sent && (
              <>
                <CheckIcon size={18} className="text-ink" />
                Te enviamos un enlace nuevo.
              </>
            )}
          </output>
        </aside>
      </div>
    </main>
  );
}
