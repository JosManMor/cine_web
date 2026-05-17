import { useEffect, useState } from "react";
import { C } from "../constants/theme";
import Spinner from "../components/ui/Spinner";
import BtnPrimary from "../components/ui/BtnPrimary";
import { verifyEmail } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function EmailVerifyPage({ setPage, addToast }) {
  const { updateUser } = useAuth();
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id        = params.get("id");
    const hash      = params.get("hash");
    const expires   = params.get("expires");
    const signature = params.get("signature");

    if (!id || !hash || !expires || !signature) {
      setStatus("error");
      setErrorMsg("Enlace de verificación inválido.");
      return;
    }

    verifyEmail(id, hash, { expires, signature })
      .then(() => {
        updateUser({ verified: true });
        setStatus("success");
        addToast("¡Correo verificado! ✓", "success");
        setTimeout(() => {
          window.history.replaceState({}, "", "/");
          setPage("home");
        }, 2000);
      })
      .catch(err => {
        setStatus("error");
        setErrorMsg(err.response?.data?.message ?? "El enlace expiró o no es válido.");
      });
  }, []);

  const goToPending = () => {
    window.history.replaceState({}, "", "/");
    setPage("email-pending");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 400, width: "100%", textAlign: "center", animation: "fadeUp .5s ease forwards" }}>
        {status === "loading" && (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <Spinner />
            </div>
            <p style={{ color: C.gray, fontSize: 14 }}>Verificando tu correo...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div style={{ width: 72, height: 72, background: C.green, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, margin: "0 auto 16px" }}>✓</div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 3, marginBottom: 8 }}>¡CORREO VERIFICADO!</h1>
            <p style={{ color: C.gray, fontSize: 14 }}>Redirigiendo a la cartelera...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 3, marginBottom: 12 }}>ENLACE INVÁLIDO</h1>
            <p style={{ color: C.gray, fontSize: 14, marginBottom: 24 }}>{errorMsg}</p>
            <BtnPrimary onClick={goToPending} style={{ padding: "12px 24px", fontSize: 14 }}>
              Reenviar verificación
            </BtnPrimary>
          </>
        )}
      </div>
    </div>
  );
}
