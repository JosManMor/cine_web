/** Error general del formulario (credenciales incorrectas, fallo del servidor). */
export default function FormAlert({ message }) {
  return (
    <div role="alert" className={message ? "rounded-tile bg-accent/20 px-5 py-4 text-base font-medium text-ink" : "sr-only"}>
      {message}
    </div>
  );
}
