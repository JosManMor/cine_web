import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../constants/theme";
import BtnPrimary from "../components/ui/BtnPrimary";
import Spinner from "../components/ui/Spinner";
import { register } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { registerSchema } from "../schemas/auth.schemas";

export default function RegisterPage({ addToast }) {
  const { saveAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleReg = async () => {
    const result = registerSchema.safeParse(form);
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
      const { data } = await register(form);
      saveAuth({ ...data.user, verified: false }, data.token);
      addToast("Cuenta creada. Revisa tu correo", "info");
      navigate("/email/pendiente");
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        setErrors(serverErrors);
      } else {
        setErrors({ _general: [err.response?.data?.message ?? "Error al registrar"] });
      }
    } finally {
      setLoading(false);
    }
  };

  const generalError = errors._general?.[0];

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 64 }}>
      <div style={{ width: 420, animation: "fadeUp .5s ease forwards" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 3 }}>CREAR CUENTA</h1>
          <p style={{ color: C.gray, fontSize: 14 }}>Únete a Cine Sendera</p>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
          {generalError && <div style={{ background: "#3D0000", border: `1px solid ${C.red}`, borderRadius: 4, padding: "10px 14px", fontSize: 13, color: "#FF6B6B", marginBottom: 16 }}>{generalError}</div>}
          {[
            ["Nombre completo",       "name",                  "text",     "Tu nombre"],
            ["Correo electrónico",    "email",                 "email",    "tu@correo.com"],
            ["Contraseña",            "password",              "password", "Mínimo 8 caracteres"],
            ["Confirmar contraseña",  "password_confirmation", "password", "Repite tu contraseña"],
          ].map(([label, key, type, ph]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label>{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={ph} />
              {errors[key] && <p style={{ color: "#FF6B6B", fontSize: 12, marginTop: 4 }}>{errors[key][0]}</p>}
            </div>
          ))}
          {loading
            ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 14 }}>
                <Spinner /><span style={{ color: C.gray, fontSize: 14 }}>Creando cuenta...</span>
              </div>
            : <BtnPrimary onClick={handleReg} style={{ width: "100%", padding: 13, fontSize: 14, marginTop: 6 }}>Crear cuenta</BtnPrimary>
          }
        </div>
        <p style={{ textAlign: "center", fontSize: 13, color: C.gray, marginTop: 16 }}>
          ¿Ya tienes cuenta? <button onClick={() => navigate("/login")} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 13, fontFamily: "inherit", padding: 0 }}>Inicia sesión</button>
        </p>
      </div>
    </div>
  );
}
