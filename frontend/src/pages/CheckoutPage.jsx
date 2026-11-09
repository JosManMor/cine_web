import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Banknote, CircleCheck, Clock, CreditCard, Globe } from "lucide-react";
import { createPurchase } from "../api/purchases";
import PillButton from "../components/ui/PillButton";
import Spinner from "../components/ui/Spinner";
import Poster from "../components/tickets/Poster";
import { useBooking } from "../context/BookingContext";
import { purchaseSchema } from "../schemas/purchase.schemas";
import { fmtShowtime } from "../utils/images";
import { bySeat, money, seatLabel, seatsWord } from "../components/tickets/tickets";

const PAYMENT_METHODS = [
  { id: "cash",   label: "Efectivo", Icon: Banknote },
  { id: "card",   label: "Tarjeta",  Icon: CreditCard },
  { id: "online", label: "En línea", Icon: Globe },
];

// Pausa antes de abrir el comprobante; la barra de avance (animate-fill) dura lo mismo.
const REDIRECT_DELAY_MS = 800;

export default function CheckoutPage({ addToast }) {
  const { selectedMovie: movie, selectedSchedule: schedule, selectedSeats, setPurchaseResult } = useBooking();
  const navigate = useNavigate();

  const [loading, setLoading]             = useState(false);
  const [done, setDone]                   = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const goBack = () => navigate(schedule?.id ? `/asientos/${schedule.id}` : -1);

  if (!selectedSeats.length) {
    return (
      <main className="frame flex min-h-svh items-center justify-center bg-ground font-sans text-ink">
        <div className="max-w-md text-center">
          <h1 className="m-0 text-2xl! font-bold tracking-tight">No hay asientos seleccionados.</h1>
          <p className="mt-3 text-base text-muted">Elige tus butacas en el plano de la sala para continuar con la compra.</p>
          <PillButton variant="ghost" onClick={goBack} className="mt-8">
            <ArrowLeft size={18} />
            Volver a selección de asientos
          </PillButton>
        </div>
      </main>
    );
  }

  const unitPrice  = Number(schedule?.base_price ?? 0);
  const total      = selectedSeats.length * unitPrice;
  const seatLabels = selectedSeats.map(s => `${s.row}${s.seat_number}`).join(", ");

  const handlePurchase = async () => {
    const payload = {
      screening_id:   schedule.id,
      seats:          selectedSeats,
      payment_method: paymentMethod,
    };
    const validation = purchaseSchema.safeParse(payload);
    if (!validation.success) {
      const msg = validation.error.issues.map(i => i.message).join(". ");
      addToast(msg, "error");
      return;
    }
    setLoading(true);
    try {
      const result = await createPurchase(payload);
      const purchase = {
        purchase_id:    result.purchase_id,
        payment_status: result.payment_status,
        seats:          selectedSeats,
        total,
        payment_method: paymentMethod,
      };
      setPurchaseResult(purchase);
      setDone(purchase);
      addToast("Compra registrada con éxito", "success");
      setTimeout(() => navigate("/ticket"), REDIRECT_DELAY_MS);
    } catch (err) {
      if (err.response?.status === 409) {
        addToast("Uno o más asientos ya fueron reservados. Elige otros.", "error");
        navigate(schedule?.id ? `/asientos/${schedule.id}` : -1);
      } else {
        addToast(err.response?.data?.message ?? "Error al procesar la compra", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    const paid  = done.payment_status ? done.payment_status === "completed" : true;
    const seats = [...done.seats].sort(bySeat).map(seatLabel).join(", ");
    const count = done.seats.length;
    return (
      <main className="frame flex min-h-svh items-center justify-center bg-ground pt-24 pb-16 font-sans text-ink">
        <section aria-labelledby="done-title" className="w-full max-w-md animate-rise rounded-card bg-surface p-6 text-center motion-reduce:animate-none sm:p-10">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-raised">
            {paid
              ? <CircleCheck size={32} className="text-ink" />
              : <Clock size={32} className="text-warning" />}
          </span>
          <h1 id="done-title" className="m-0 mt-6 text-[clamp(1.75rem,6vw,2rem)] leading-[1.05] font-extrabold tracking-tight text-ink">
            Compra registrada
          </h1>
          <p className="mt-3 text-base font-semibold text-ink">
            {paid ? `Pago confirmado de ${money(done.total)}` : `Pago pendiente de ${money(done.total)}`}{" "}
            <span className="whitespace-nowrap">· Pedido <span className="tabular-nums">#{done.purchase_id}</span></span>
          </p>

          <dl className="m-0 mt-6 flex flex-col gap-1 rounded-tile bg-raised px-4 py-3 text-left">
            <dt className="text-sm text-muted">{movie?.title ?? "Película"}</dt>
            <dd className="m-0 text-base text-ink">
              {count} {seatsWord(count)} <span className="tabular-nums">· {seats}</span>
            </dd>
          </dl>

          <div className="mt-8">
            <output className="block text-sm text-muted">Preparando tu comprobante</output>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-raised" aria-hidden="true">
              <div className="h-full origin-left animate-fill rounded-full bg-accent motion-reduce:animate-none" />
            </div>
          </div>

          <Link to="/ticket" className="mt-6 inline-block rounded-full text-sm font-semibold text-ink underline underline-offset-4 hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            Ver comprobante ahora
          </Link>
        </section>
      </main>
    );
  }

  const meta = [schedule?.room?.name ?? "Sala", fmtShowtime(schedule?.start_time)].filter(Boolean).join(" · ");
  const count = selectedSeats.length;

  return (
    <main className="frame min-h-svh bg-ground pt-24 pb-32 font-sans text-ink lg:pt-20 lg:pb-10">
      <div className="mx-auto w-full max-w-6xl">
        <button
          type="button"
          onClick={goBack}
          className="-ml-1 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-1 text-base font-semibold text-muted transition hover:text-ink focus-visible:outline-2 focus-visible:outline-white"
        >
          <ArrowLeft size={18} />
          Volver a asientos
        </button>

        <header className="mt-4 animate-rise motion-reduce:animate-none lg:mt-1">
          <h1 className="m-0 text-[clamp(1.5rem,4vw,2rem)]! leading-[1.1] font-extrabold tracking-tight text-balance text-ink">
            Confirmar compra
          </h1>
          <p className="mt-2 text-base text-muted sm:text-lg lg:mt-1 lg:text-base">Revisa tu orden y elige cómo quieres pagar.</p>
        </header>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:mt-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-8">
          <section aria-labelledby="order-title" className="rounded-card bg-surface p-6 sm:p-8">
            <h2 id="order-title" className="m-0 text-xl font-bold tracking-tight text-ink sm:text-2xl">Resumen de orden</h2>

            <div className="mt-6 flex items-start gap-4 sm:gap-5">
              <Poster src={movie?.poster_url} title={movie?.title} className="w-20 sm:w-24" />
              <div className="min-w-0">
                <p className="m-0 text-lg font-bold tracking-tight break-words sm:text-xl">{movie?.title ?? "Película"}</p>
                <p className="mt-1 text-base text-muted">{meta}</p>
              </div>
            </div>

            <dl className="m-0 mt-8 flex flex-col gap-3 text-base">
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 text-muted">{count === 1 ? "Asiento" : "Asientos"}</dt>
                <dd className="m-0 text-right font-semibold break-words">{seatLabels}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Precio por asiento</dt>
                <dd className="m-0 tabular-nums">{money(unitPrice)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Cantidad</dt>
                <dd className="m-0 tabular-nums">×{count}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 rounded-tile bg-raised px-4 py-3">
                <dt className="font-semibold">Total</dt>
                <dd className="m-0 text-2xl font-extrabold tracking-tight tabular-nums">{money(total)}</dd>
              </div>
            </dl>
          </section>

          <aside className="rounded-card bg-surface p-6 sm:p-8 lg:sticky lg:top-24">
            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className="mb-5 p-0 text-xl font-bold tracking-tight text-ink">Método de pago</legend>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {PAYMENT_METHODS.map(({ id, label, Icon }) => (
                  <label
                    key={id}
                    className={`flex min-h-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-tile px-1 py-3 text-sm font-semibold transition has-focus-visible:outline-2 has-focus-visible:outline-white ${
                      paymentMethod === id ? "bg-accent text-ink" : "bg-raised text-muted hover:text-ink"
                    } ${loading ? "pointer-events-none opacity-60" : ""}`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={id}
                      checked={paymentMethod === id}
                      disabled={loading}
                      onChange={() => setPaymentMethod(id)}
                      className="sr-only"
                    />
                    <Icon size={20} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* En el teléfono la acción se fija abajo con el total, como en la selección de asientos. */}
            <div className="fixed inset-x-0 bottom-0 z-40 bg-raised px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:static lg:mt-6 lg:bg-transparent lg:p-0">
              <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 lg:block">
                <p className="min-w-0 text-sm text-muted lg:hidden">
                  <span className="block text-lg font-extrabold text-ink tabular-nums">{money(total)}</span>
                  {count} {count === 1 ? "asiento" : "asientos"}
                </p>
                {loading ? (
                  <div className="flex items-center gap-3 lg:rounded-tile lg:bg-raised lg:p-4">
                    <Spinner />
                    <output className="text-right lg:text-left">
                      <span className="block text-base font-semibold">Procesando compra...</span>
                      <span className="block text-sm text-muted">No cierres esta ventana</span>
                    </output>
                  </div>
                ) : (
                  <PillButton size="lg" onClick={handlePurchase} className="max-lg:h-12 max-lg:px-6 lg:w-full">
                    Confirmar compra
                  </PillButton>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
