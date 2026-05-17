import { useState, useRef } from "react";
import { C } from "../constants/theme";
import BtnPrimary from "../components/ui/BtnPrimary";
import Spinner from "../components/ui/Spinner";

export default function RegisterPage({ setPage, addToast }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", pass: "", confirm: "" });
  const [code, setCode] = useState(["", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef()];
  const realCode = "48271";

  const handleReg = () => {
    if (!form.name || !form.email || !form.pass) return;
    if (form.pass !== form.confirm) { addToast("Las contraseñas no coinciden", "error"); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(2); addToast(`Código enviado a ${form.email}`, "info"); }, 1800);
  };

  const handleCode = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...code]; next[i] = v; setCode(next);
    if (v && i < 4) refs[i + 1].current?.focus();
  };

  const handleVerify = () => {
    if (code.join("") !== realCode) { addToast("Código incorrecto. Prueba: " + realCode, "error"); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); addToast("¡Registro exitoso! Inicia sesión", "success"); setPage("login"); }, 1400);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 64 }}>
      <div style={{ width: 420, animation: "fadeUp .5s ease forwards" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 3 }}>{step === 1 ? "CREAR CUENTA" : "VERIFICAR EMAIL"}</h1>
          <p style={{ color: C.gray, fontSize: 14 }}>{step === 1 ? "Únete a Cine Sendera" : `Ingresa el código enviado a ${form.email}`}</p>
        </div>
        {/* Steps indicator */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 28, gap: 8 }}>
          {[1, 2].map(s => <>
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? C.red : C.border, transition: "background .3s" }} />
            {s === 1 && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, flexShrink: 0 }} />}
          </>)}
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28 }}>
          {step === 1 ? <>
            {[["Nombre completo", "name", "text", "Tu nombre"], ["Correo electrónico", "email", "email", "tu@correo.com"], ["Contraseña", "pass", "password", "Mínimo 8 caracteres"], ["Confirmar contraseña", "confirm", "password", "Repite tu contraseña"]].map(([label, key, type, ph]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label>{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={ph} />
              </div>
            ))}
            {loading
              ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 14 }}><Spinner /><span style={{ color: C.gray, fontSize: 14 }}>Enviando código...</span></div>
              : <BtnPrimary onClick={handleReg} style={{ width: "100%", padding: 13, fontSize: 14, marginTop: 6 }}>Continuar →</BtnPrimary>
            }
          </> : <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
              <p style={{ color: C.gray, fontSize: 14, lineHeight: 1.7 }}>Ingresa el código de 5 dígitos que enviamos a tu correo para confirmar tu identidad.</p>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
              {code.map((v, i) => (
                <input key={i} ref={refs[i]} maxLength={1} value={v} onChange={e => handleCode(i, e.target.value)}
                  onKeyDown={e => e.key === "Backspace" && !v && i > 0 && refs[i - 1].current?.focus()}
                  style={{ width: 52, height: 60, textAlign: "center", fontSize: 24, fontFamily: "'Montserrat', sans-serif", fontWeight: 700, borderRadius: 6, border: `1.5px solid ${v ? C.red : C.border}`, background: v ? C.redGlow : C.surface }} />
              ))}
            </div>
            {loading
              ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: 14 }}><Spinner /><span style={{ color: C.gray, fontSize: 14 }}>Verificando...</span></div>
              : <BtnPrimary onClick={handleVerify} style={{ width: "100%", padding: 13, fontSize: 14 }}>Verificar y crear cuenta</BtnPrimary>
            }
            <p style={{ textAlign: "center", fontSize: 12, color: C.grayDark, marginTop: 16 }}>¿No llegó? <span style={{ color: C.red, cursor: "pointer" }} onClick={() => addToast("Código reenviado", "info")}>Reenviar código</span></p>
            <p style={{ textAlign: "center", fontSize: 11, color: C.grayDark, marginTop: 6 }}>Código de prueba: <strong style={{ color: C.gray }}>{realCode}</strong></p>
          </>}
        </div>
        <p style={{ textAlign: "center", fontSize: 13, color: C.gray, marginTop: 16 }}>¿Ya tienes cuenta? <span style={{ color: C.red, cursor: "pointer" }} onClick={() => setPage("login")}>Inicia sesión</span></p>
      </div>
    </div>
  );
}
