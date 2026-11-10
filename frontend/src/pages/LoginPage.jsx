import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import AuthField from "../components/auth/AuthField";
import FormAlert from "../components/auth/FormAlert";
import SubmitButton from "../components/auth/SubmitButton";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { loginSchema } from "../schemas/auth.schemas";
import { fieldErrors } from "../schemas/fieldErrors";

export default function LoginPage({ addToast }) {
  const { saveAuth } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from;
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handle = async (e) => {
    e.preventDefault();
    const result = loginSchema.safeParse({ email, password: pass });
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    setErrors({}); setLoading(true);
    try {
      const { data } = await login({ email, password: pass });
      saveAuth(data.user, data.token);
      addToast("Sesión iniciada", "success");
      navigate(from ? from.pathname + (from.search ?? "") : "/", { replace: true });
    } catch (err) {
      setErrors({ _general: [err.response?.data?.message ?? "Error al iniciar sesión"] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      titleId="login-title"
      title="Inicia sesión"
      intro="Entra a tu cuenta de Cine Sendera para comprar entradas y tener tus boletos a mano."
      footer={<>¿No tienes cuenta? <Link to="/registro" state={{ from }} className="font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4 transition hover:decoration-ink focus-visible:outline-2 focus-visible:outline-white">Regístrate gratis</Link></>}
    >
      <form onSubmit={handle} noValidate aria-labelledby="login-title" className="flex flex-col gap-6">
        <FormAlert message={errors._general?.[0]} />
        <AuthField
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email?.[0]}
          placeholder="tu@correo.com"
          autoComplete="email"
          inputMode="email"
        />
        <AuthField
          label="Contraseña"
          type="password"
          value={pass}
          onChange={setPass}
          error={errors.password?.[0]}
          autoComplete="current-password"
        />
        <SubmitButton loading={loading} loadingText="Verificando…">Iniciar sesión</SubmitButton>
      </form>
    </AuthLayout>
  );
}
