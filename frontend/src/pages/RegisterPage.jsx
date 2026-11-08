import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import AuthField from "../components/auth/AuthField";
import FormAlert from "../components/auth/FormAlert";
import SubmitButton from "../components/auth/SubmitButton";
import { register } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { registerSchema } from "../schemas/auth.schemas";
import { fieldErrors } from "../schemas/fieldErrors";

const FIELDS = [
  { key: "name", label: "Nombre completo", type: "text", placeholder: "Tu nombre", autoComplete: "name" },
  { key: "email", label: "Correo electrónico", type: "email", placeholder: "tu@correo.com", autoComplete: "email", inputMode: "email" },
  { key: "password", label: "Contraseña", type: "password", autoComplete: "new-password", hint: "Mínimo 8 caracteres." },
  { key: "password_confirmation", label: "Confirmar contraseña", type: "password", autoComplete: "new-password" },
];

export default function RegisterPage({ addToast }) {
  const { saveAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleReg = async (e) => {
    e.preventDefault();
    const result = registerSchema.safeParse(form);
    if (!result.success) {
      setErrors(fieldErrors(result.error));
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

  return (
    <AuthLayout
      titleId="register-title"
      title="Crea tu cuenta"
      intro="Regístrate gratis para reservar asientos y recibir tus entradas por correo."
      footer={<>¿Ya tienes cuenta? <Link to="/login" className="font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4 transition hover:decoration-ink focus-visible:outline-2 focus-visible:outline-white">Inicia sesión</Link></>}
    >
      <form onSubmit={handleReg} noValidate aria-labelledby="register-title" className="flex flex-col gap-6">
        <FormAlert message={errors._general?.[0]} />
        {FIELDS.map(({ key, ...field }) => (
          <AuthField
            key={key}
            {...field}
            value={form[key]}
            onChange={value => setForm(f => ({ ...f, [key]: value }))}
            error={errors[key]?.[0]}
          />
        ))}
        <SubmitButton loading={loading} loadingText="Creando cuenta…">Crear cuenta</SubmitButton>
      </form>
    </AuthLayout>
  );
}
