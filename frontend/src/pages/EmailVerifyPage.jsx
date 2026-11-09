import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PillButton from "../components/ui/PillButton";
import { AlertIcon, CheckIcon, RefreshIcon, SpinnerIcon } from "../components/ui/icons";
import { verifyEmail } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { takeReturnTo } from "../utils/returnTo";

const TITLE = "m-0 mt-8 text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] font-extrabold tracking-tight text-balance text-ink";
const TEXT = "mx-auto mt-4 max-w-md text-lg leading-relaxed text-ink";

export default function EmailVerifyPage({ addToast }) {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id        = searchParams.get("id");
  const hash      = searchParams.get("hash");
  const expires   = searchParams.get("expires");
  const signature = searchParams.get("signature");
  const linkComplete = Boolean(id && hash && expires && signature);
  const [status, setStatus] = useState(linkComplete ? "loading" : "error");
  const [errorMsg, setErrorMsg] = useState(linkComplete ? "" : "Al enlace le faltan datos.");

  // El enlace firmado se consume una sola vez, al montar la página.
  useEffect(() => {
    if (!linkComplete) return;

    let timer;
    verifyEmail(id, hash, { expires, signature })
      .then(() => {
        updateUser({ verified: true });
        setStatus("success");
        addToast("Correo verificado", "success");
        timer = setTimeout(() => navigate(takeReturnTo(), { replace: true }), 1500);
      })
      .catch(err => {
        setStatus("error");
        setErrorMsg(err.response?.data?.message ?? "El enlace expiró o no es válido.");
      });
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="frame flex min-h-svh items-center justify-center bg-ground pt-28 pb-20 font-sans text-ink">
      <div key={status} aria-live="polite" className="w-full max-w-xl animate-rise text-center motion-reduce:animate-none">
        {status === "loading" && (
          <>
            <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-surface text-accent">
              <SpinnerIcon size={34} />
            </span>
            <h1 className={TITLE}>Verificando tu correo</h1>
            <p className={TEXT}>Esto solo tarda un momento.</p>
          </>
        )}

        {status === "success" && (
          <>
            <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-ink text-ground">
              <CheckIcon size={36} />
            </span>
            <h1 className={TITLE}>Correo verificado</h1>
            <p className={TEXT}>Tu cuenta ya está activa. Te llevamos de vuelta a tu compra en un momento.</p>
            <PillButton size="lg" className="mt-10" onClick={() => navigate(takeReturnTo(), { replace: true })}>
              Continuar con mi compra
            </PillButton>
          </>
        )}

        {status === "error" && (
          <>
            <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-surface text-accent">
              <AlertIcon size={34} />
            </span>
            <h1 className={TITLE}>Enlace no válido</h1>
            <p className={TEXT}>{errorMsg} Solicita un enlace nuevo para activar tu cuenta.</p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <PillButton size="lg" className="w-full sm:w-auto" onClick={() => navigate("/email/pendiente", { replace: true })}>
                <RefreshIcon />
                Solicitar enlace nuevo
              </PillButton>
              <PillButton size="lg" variant="ghost" className="w-full sm:w-auto" onClick={() => navigate("/", { replace: true })}>
                Volver al inicio
              </PillButton>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
