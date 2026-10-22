import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../constants/theme";
import BtnPrimary from "../components/ui/BtnPrimary";
import BtnSecondary from "../components/ui/BtnSecondary";
import Spinner from "../components/ui/Spinner";
import { resendVerification } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function EmailPendingPage({ addToast }) {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    try {
      await resendVerification();
      addToast("Correo reenviado ✓", "success");
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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center", animation: "fadeUp .5s ease forwards" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 3, marginBottom: 12 }}>VERIFICA TU CORREO</h1>
        <p style={{ color: C.gray, fontSize: 15, lineHeight: 1.7, marginBottom: 6 }}>
          Enviamos un enlace de verificación a
        </p>
        <p style={{ color: C.white, fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 24 }}>
          {user?.email}
        </p>
        <p style={{ color: C.gray, fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
          Haz clic en el enlace del correo para activar tu cuenta. El enlace expira en 60 minutos.
        </p>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, marginBottom: 20 }}>
          <p style={{ color: C.gray, fontSize: 13, marginBottom: 16 }}>¿No llegó? Revisa tu carpeta de spam o solicita un nuevo correo.</p>
          {loading
            ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <Spinner />
                <span style={{ color: C.gray, fontSize: 14 }}>Enviando...</span>
              </div>
            : <BtnPrimary onClick={handleResend} style={{ width: "100%", padding: 12, fontSize: 14 }}>
                Reenviar correo
              </BtnPrimary>
          }
        </div>
        {import.meta.env.VITE_DEMO_MODE === 'true' && (
          <div style={{
            background: "#451a03",
            border: "1px solid #92400e",
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 20,
            textAlign: "left",
          }}>
            <p style={{ color: "#fbbf24", fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
              ⚠️ Entorno de demostración
            </p>
            <p style={{ color: "#fde68a", fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
              Los emails no se envían realmente. Puedes ver el correo de verificación en el buzón de Mailpit.
            </p>
            <a
              href={import.meta.env.VITE_MAILPIT_URL ?? '/mailpit/'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#f59e0b",
                color: "#1c1917",
                fontWeight: 600,
                fontSize: 13,
                padding: "8px 16px",
                borderRadius: 6,
                textDecoration: "none",
              }}
            >
              📬 Revisar correo en Mailpit
            </a>
          </div>
        )}
        <BtnSecondary onClick={handleLogout} style={{ padding: "10px 24px", fontSize: 13 }}>
          Cerrar sesión
        </BtnSecondary>
      </div>
    </div>
  );
}
