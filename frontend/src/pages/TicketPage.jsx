import { Link } from "react-router-dom";
import { CircleCheck, Clock } from "lucide-react";
import PillButton from "../components/ui/PillButton";
import Poster from "../components/tickets/Poster";
import { useBooking } from "../context/BookingContext";
import { useAuth } from "../context/AuthContext";
import {
  PAYMENT_LABEL, bySeat, fmtDay, fmtTime, formatLine, money, seatLabel, seatsWord,
} from "../components/tickets/tickets";

function Detail({ label, children, className = "" }) {
  return (
    <div className={className}>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="m-0 mt-1 text-base text-ink">{children}</dd>
    </div>
  );
}

export default function TicketPage() {
  const { selectedMovie: movie, selectedSchedule: schedule, purchaseResult } = useBooking();
  const { user } = useAuth();

  if (!purchaseResult) {
    return (
      <main className="frame flex min-h-svh items-center justify-center bg-ground font-sans text-ink">
        <div className="max-w-md text-center">
          <h1 className="m-0 text-2xl font-bold tracking-tight">No hay una compra reciente</h1>
          <p className="mt-3 text-base text-muted">El comprobante se muestra justo después de pagar. Tus boletos y sus códigos QR siempre están en Mis tickets.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <PillButton as={Link} to="/mis-entradas" variant="light">Ver mis tickets</PillButton>
            <PillButton as={Link} to="/" variant="ghost">Ir a la cartelera</PillButton>
          </div>
        </div>
      </main>
    );
  }

  const { purchase_id, payment_status, seats = [], total, payment_method } = purchaseResult;
  const sorted    = [...seats].sort(bySeat);
  const count     = sorted.length;
  const unitPrice = count ? Number(total) / count : 0;
  const paid      = payment_status ? payment_status === "completed" : true;
  const method    = PAYMENT_LABEL[payment_method] ?? payment_method ?? "—";
  const format    = formatLine(schedule?.format, schedule?.language_type) || "—";
  const title     = movie?.title ?? "Película";

  return (
    <main className="frame min-h-svh bg-ground pt-24 pb-16 font-sans text-ink lg:pt-28">
      <div className="mx-auto w-full max-w-6xl">
        <header className="max-w-3xl">
          <h1 className="m-0 text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.05] font-extrabold tracking-tight text-ink">Compra registrada</h1>
          <p className="mt-3 flex items-start gap-2 text-base font-semibold text-ink sm:text-lg">
            {paid
              ? <CircleCheck size={20} className="mt-0.5 shrink-0 text-ink sm:mt-1" />
              : <Clock size={20} className="mt-0.5 shrink-0 text-warning sm:mt-1" />}
            <span>
              {paid ? `Pago confirmado de ${money(total)}` : `Pago pendiente de ${money(total)}`} <span className="whitespace-nowrap">· Pedido <span className="tabular-nums">#{purchase_id}</span></span>
            </span>
          </p>
          <p className="mt-2 text-base text-muted">
            {paid
              ? `Tus ${count} ${seatsWord(count)} ya están en Mis tickets, cada uno con su código QR para entrar a la sala.`
              : "Los códigos QR aparecerán en Mis tickets en cuanto se confirme el pago."}
          </p>
        </header>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-8">
          <section aria-labelledby="movie-title" className="rounded-card bg-surface p-5 sm:p-8">
            <div className="flex items-start gap-5 sm:gap-6">
              <Poster src={movie?.poster_url} title={title} className="w-20 sm:w-28" />
              <div className="min-w-0">
                <h2 id="movie-title" className="m-0 text-2xl leading-tight font-extrabold tracking-tight text-balance text-ink sm:text-3xl">{title}</h2>
                {movie?.genre && <p className="mt-1.5 text-base text-muted">{movie.genre}</p>}
                <p className="mt-3 text-base text-ink first-letter:uppercase">
                  {fmtDay(schedule?.start_time)}
                  {schedule?.start_time && <> <span className="whitespace-nowrap tabular-nums">· {fmtTime(schedule.start_time)}</span></>}
                </p>
              </div>
            </div>

            <dl className="m-0 mt-8 grid grid-cols-2 gap-x-8 gap-y-5 rounded-[1.25rem] bg-raised p-5 sm:grid-cols-2 sm:p-6">
              <Detail label="Sala">{schedule?.room?.name ?? "—"}</Detail>
              <Detail label="Formato">{format}</Detail>
              <Detail label={count === 1 ? "Asiento" : `Asientos (${count})`} className="col-span-2">
                <ul className="m-0 mt-1 flex list-none flex-wrap gap-2 p-0">
                  {sorted.map(s => (
                    <li key={seatLabel(s)} className="inline-flex h-9 items-center rounded-full bg-white/10 px-3.5 text-sm font-bold tabular-nums">
                      {seatLabel(s)}
                    </li>
                  ))}
                </ul>
              </Detail>
              <Detail label="A nombre de" className="max-sm:col-span-2">{user?.name ?? "—"}</Detail>
              <Detail label="Correo" className="max-sm:col-span-2 break-words">{user?.email ?? "—"}</Detail>
            </dl>
          </section>

          <aside aria-labelledby="payment-title" className="rounded-card bg-surface p-6 sm:p-8 lg:sticky lg:top-28">
            <h2 id="payment-title" className="m-0 text-xl font-bold tracking-tight text-ink">Resumen del pago</h2>

            <dl className="m-0 mt-6 flex flex-col gap-3 text-base">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{count} {seatsWord(count)} × {money(unitPrice)}</dt>
                <dd className="m-0 tabular-nums">{money(total)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Método de pago</dt>
                <dd className="m-0">{method}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Estado</dt>
                <dd className="m-0">{paid ? "Confirmado" : "Pendiente"}</dd>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-4 rounded-tile bg-raised px-4 py-3">
                <dt className="font-semibold">{paid ? "Total pagado" : "Total"}</dt>
                <dd className="m-0 text-2xl font-extrabold tracking-tight tabular-nums">{money(total)}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col gap-3">
              <PillButton as={Link} to="/mis-entradas" variant="light" size="lg" className="w-full">
                {count === 1 ? "Ver mi ticket" : "Ver mis tickets"}
              </PillButton>
              <PillButton as={Link} to="/" variant="ghost" size="lg" className="w-full">Volver a la cartelera</PillButton>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
