import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../constants/theme";
import BtnPrimary from "../components/ui/BtnPrimary";
import Spinner from "../components/ui/Spinner";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { loginSchema } from "../schemas/auth.schemas";

export default function LoginPage({ addToast }) {
  const { saveAuth } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handle = async () => {
    const result = loginSchema.safeParse({ email, password: pass });
    if (!result.success) {
      const fieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({}); setLoading(true);
    try {
      const { data } = await login({ email, password: pass });
      saveAuth(data.user, data.token);
      addToast("Sesión iniciada ✓", "success");
      navigate("/");
    } catch (err) {
      setErrors({ _general: [err.response?.data?.message ?? "Error al iniciar sesión"] });
    } finally {
      setLoading(false);
    }
  };

  const generalError = errors._general?.[0];

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 64 }}>
      <div style={{ width: 400, animation: "fadeUp .5s ease forwards" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎬</div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 3 }}>INICIAR SESIÓN</h1>
          <p style={{ color: C.gray, fontSize: 14 }}>Accede a tu cuenta de Cine Sendera</p>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
          {generalError && <div style={{ background: "#3D0000", border: `1px solid ${C.red}`, borderRadius: 4, padding: "10px 14px", fontSize: 13, color: "#FF6B6B", marginBottom: 16 }}>{generalError}</div>}
          <div style={{ marginBottom: 16 }}>
            <label>Correo electrónico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com" />
            {errors.email && <p style={{ color: "#FF6B6B", fontSize: 12, marginTop: 4 }}>{errors.email[0]}</p>}
          </div>
          <div style={{ marginBottom: 20 }}>
            <label>Contraseña</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handle()} />
            {errors.password && <p style={{ color: "#FF6B6B", fontSize: 12, marginTop: 4 }}>{errors.password[0]}</p>}
          </div>
          {loading
            ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 14 }}>
                <Spinner /><span style={{ color: C.gray, fontSize: 14 }}>Verificando...</span>
              </div>
            : <BtnPrimary onClick={handle} style={{ width: "100%", padding: 13, fontSize: 14 }}>Iniciar sesión</BtnPrimary>
          }
          <div style={{ height: 1, background: C.border, margin: "20px 0" }} />
          <p style={{ textAlign: "center", fontSize: 13, color: C.gray }}>
            ¿No tienes cuenta? <button onClick={() => navigate("/registro")} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: 0 }}>Regístrate gratis</button>
          </p>
        </div>
      </div>
    </div>
  );
}
