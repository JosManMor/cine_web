/** Agrupa los errores de un ZodError por campo: { email: ["..."], password: ["..."] }. */
export function fieldErrors(zodError) {
  const errors = {};
  for (const issue of zodError.issues) {
    const key = issue.path[0];
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}
