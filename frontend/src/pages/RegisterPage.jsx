import { useState } from "react";
import { C } from "../constants/theme";
import BtnPrimary from "../components/ui/BtnPrimary";
import Spinner from "../components/ui/Spinner";
import { register } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage({ setPage, addToast }) {
  const { saveAuth } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReg = async () => {
    if (!form.name || !form.email || !form.password) { setError("Completa todos los campos"); return; }
    if (form.password !== form.password_confirmation) { setError("Las contraseñas no coinciden"); return; }
    setError(""); setLoading(true);
    try {
      const { data } = await register(form);
      saveAuth({ ...data.user, verified: false }, data.token);
      addToast("Cuenta creada. Revisa tu correo", "info");
      setPage("email-pending");
    } catch (err) {
      const errors = err.response?.data?.errors;
      const first = errors ? Object.values(errors)[0]?.[0] : null;
      setError(first ?? err.response?.data?.message ?? "Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 64 }}>
      <div style={{ width: 420, animation: "fadeUp .5s ease forwards" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 3 }}>CREAR CUENTA</h1>
          <p style={{ color: C.gray, fontSize: 14 }}>Únete a Cine Sendera</p>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
          {error && <div style={{ background: "#3D0000", border: `1px solid ${C.red}`, borderRadius: 4, padding: "10px 14px", fontSize: 13, color: "#FF6B6B", marginBottom: 16 }}>{error}</div>}
          {[
            ["Nombre completo",       "name",                  "text",     "Tu nombre"],
            ["Correo electrónico",    "email",                 "email",    "tu@correo.com"],
            ["Contraseña",            "password",              "password", "Mínimo 8 caracteres"],
            ["Confirmar contraseña",  "password_confirmation", "password", "Repite tu contraseña"],
          ].map(([label, key, type, ph]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label>{label}</label>
              <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={ph} />
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
          ¿Ya tienes cuenta? <span style={{ color: C.red, cursor: "pointer" }} onClick={() => setPage("login")}>Inicia sesión</span>
        </p>
      </div>
    </div>
  );
}
