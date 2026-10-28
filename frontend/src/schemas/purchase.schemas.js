import { z } from "zod";

export const purchaseSchema = z.object({
  screening_id: z
    .number({ required_error: "La función es obligatoria" })
    .int("El ID de función debe ser un entero")
    .positive("El ID de función debe ser positivo"),
  seats: z
    .array(
      z.object({
        row: z
          .string({ required_error: "La fila es obligatoria" })
          .length(1, "La fila debe ser una sola letra")
          .regex(/^[A-Za-z]$/, "La fila debe ser una letra (A-Z)"),
        seat_number: z
          .number({ required_error: "El número de asiento es obligatorio" })
          .int("El número de asiento debe ser un entero")
          .min(1, "El número de asiento debe ser mayor a 0")
          .max(30, "El número de asiento no puede exceder 30"),
      }),
    )
    .min(1, "Debes seleccionar al menos un asiento"),
  payment_method: z.enum(["cash", "card", "online"], {
    errorMap: () => ({
      message: "El método de pago debe ser efectivo, tarjeta o en línea",
    }),
  }),
});
