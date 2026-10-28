import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ required_error: "El correo es obligatorio" })
    .min(1, "El correo es obligatorio")
    .email("El formato del correo no es válido")
    .max(255, "El correo no puede exceder 255 caracteres"),
  password: z
    .string({ required_error: "La contraseña es obligatoria" })
    .min(1, "La contraseña es obligatoria")
    .max(72, "La contraseña no puede exceder 72 caracteres"),
});

export const registerSchema = z
  .object({
    name: z
      .string({ required_error: "El nombre es obligatorio" })
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(255, "El nombre no puede exceder 255 caracteres")
      .regex(/\S/, "El nombre no puede ser solo espacios"),
    email: z
      .string({ required_error: "El correo es obligatorio" })
      .min(1, "El correo es obligatorio")
      .email("El formato del correo no es válido")
      .max(255, "El correo no puede exceder 255 caracteres"),
    password: z
      .string({ required_error: "La contraseña es obligatoria" })
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(72, "La contraseña no puede exceder 72 caracteres"),
    password_confirmation: z
      .string({ required_error: "Debes confirmar la contraseña" })
      .min(1, "Debes confirmar la contraseña"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Las contraseñas no coinciden",
    path: ["password_confirmation"],
  });
