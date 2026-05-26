import { useState } from "react";
import { C } from "../constants/theme";
import BtnPrimary from "../components/ui/BtnPrimary";
import SmallSpinner from "../components/ui/SmallSpinner";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function LoginPage({ setPage, addToast }) {
  const { saveAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    if (!email || !pass) { setError("Completa todos los campos"); return; }
    setError(""); setLoading(true);
    try {
      const { data } = await login({ email, password: pass });
      saveAuth(data.user, data.token);
      addToast("Sesión iniciada ✓", "success");
      setPage("home");
    } catch (err) {
      setError(err.response?.data?.message ?? "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 64 }}>
      <div style={{ width: 400, animation: "fadeUp .5s ease forwards" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎬</div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 3 }}>INICIAR SESIÓN</h1>
          <p style={{ color: C.gray, fontSize: 14 }}>Accede a tu cuenta de Cine Sendera</p>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
          {error && <div style={{ background: "#3D0000", border: `1px solid ${C.red}`, borderRadius: 4, padding: "10px 14px", fontSize: 13, color: "#FF6B6B", marginBottom: 16 }}>{error}</div>}
          <div style={{ marginBottom: 16 }}>
            <label>Correo electrónico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label>Contraseña</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handle()} />
          </div>
          {loading
            ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 14 }}>
                <SmallSpinner /><span style={{ color: C.gray, fontSize: 14 }}>Verificando...</span>
              </div>
            : <BtnPrimary onClick={handle} style={{ width: "100%", padding: 13, fontSize: 14 }}>Iniciar sesión</BtnPrimary>
          }
          <div style={{ height: 1, background: C.border, margin: "20px 0" }} />
          <p style={{ textAlign: "center", fontSize: 13, color: C.gray }}>
            ¿No tienes cuenta? <span style={{ color: C.red, cursor: "pointer" }} onClick={() => setPage("register")}>Regístrate gratis</span>
          </p>
        </div>
      </div>
    </div>
  );
}
