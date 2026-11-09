import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { getScreening } from "../api/purchases";
import PillButton from "../components/ui/PillButton";
import Spinner from "../components/ui/Spinner";
import SeatMap from "../components/seats/SeatMap";
import { SEAT_LOOK } from "../components/seats/seatLook";
import { useBooking } from "../context/BookingContext";
import { useAuth } from "../context/AuthContext";
import { fmtShowtime } from "../utils/images";

const LANG_LABEL = { original: "Original", dubbed: "Doblada", subtitled: "Subtitulada" };
const MAX_SEATS = 8;

const money = (n) => `$${n.toFixed(2)}`;
const seatsWord = (n) => (n === 1 ? "asiento" : "asientos");

function Legend() {
  const items = [["free", "Libre"], ["selected", "Tu selección"], ["occupied", "Ocupado"]];
  return (
    <ul className="m-0 mt-8 flex list-none lg:mt-5 flex-wrap justify-center gap-x-6 gap-y-2 p-0 text-sm text-muted">
      {items.map(([status, label]) => (
        <li key={status} className="flex items-center gap-2">
          <span aria-hidden="true" className={`flex h-[1.125rem] w-5 items-center justify-center rounded-t-md rounded-b-[3px] ${SEAT_LOOK[status]}`}>
            {status === "occupied" && <X size={10} strokeWidth={2.5} />}
          </span>
          {label}
        </li>
      ))}
    </ul>
  );
}

export default function SeatsPage({ addToast }) {
  const { screeningId } = useParams();
  const { setSelectedSeats, setSelectedMovie, setSelectedSchedule } = useBooking();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Cada estado guarda la función a la que pertenece: al cambiar de función se descarta sin un reset en el efecto.
  const [loaded, setLoaded]     = useState({ id: null, data: null, error: false });
  const [picked, setPicked]     = useState({ id: null, seats: [] });
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!screeningId) return;
    let alive = true;
    getScreening(screeningId)
      .then(data => {
        if (!alive) return;
        setLoaded({ id: screeningId, data, error: false });
        setSelectedMovie(data.movie);
        setSelectedSchedule(data);
      })
      .catch(() => {
        if (!alive) return;
        setLoaded({ id: screeningId, data: null, error: true });
        addToast("Error al cargar los asientos", "error");
      });
    return () => { alive = false; };
  }, [screeningId, addToast, setSelectedMovie, setSelectedSchedule]);

  const current      = loaded.id === screeningId ? loaded : { data: null, error: false };
  const screening    = current.data;
  const selected     = picked.id === screeningId ? picked.seats : [];

  if (current.error) {
    return (
      <main className="frame flex min-h-svh items-center justify-center bg-ground font-sans text-ink">
        <div className="max-w-md text-center">
          <h1 className="m-0 text-2xl font-bold tracking-tight">No pudimos cargar la sala</h1>
          <p className="mt-3 text-base text-muted">Revisa tu conexión e inténtalo otra vez, o vuelve a la cartelera para elegir otra función.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <PillButton onClick={() => globalThis.location.reload()}>Reintentar</PillButton>
            <PillButton variant="ghost" onClick={() => navigate("/")}>Ir a la cartelera</PillButton>
          </div>
        </div>
      </main>
    );
  }

  if (!screening) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-ground">
        <Spinner />
      </div>
    );
  }

  const movie       = screening.movie;
  const rows        = screening.room?.rows ?? 0;
  const seatsPerRow = screening.room?.seats_per_row ?? 0;
  const occupied    = screening.occupied_seats ?? [];
  const rowLabels   = Array.from({ length: rows }, (_, i) => String.fromCodePoint(65 + i));
  const roomName    = screening.room?.name ?? "Sala";
  const freeCount   = rows * seatsPerRow - occupied.length;

  const isOccupied = (r, n) => occupied.some(s => s.row === r && s.seat_number === n);
  const isSelected = (r, n) => selected.some(s => s.row === r && s.seat_number === n);
  const getStatus  = (r, n) => {
    if (isOccupied(r, n)) return "occupied";
    if (isSelected(r, n)) return "selected";
    return "free";
  };

  // Actualización funcional: varios toques seguidos parten siempre de la selección más reciente.
  const updateSeats = (fn) => setPicked(prev => ({ id: screeningId, seats: fn(prev.id === screeningId ? prev.seats : []) }));
  const sameSeat = (r, n) => s => s.row === r && s.seat_number === n;

  const toggleSeat = (r, n) => {
    if (isOccupied(r, n)) return;
    if (!isSelected(r, n) && selected.length >= MAX_SEATS) { addToast(`Máximo ${MAX_SEATS} asientos por compra`, "error"); return; }
    updateSeats(seats => {
      if (seats.some(sameSeat(r, n))) return seats.filter(s => !sameSeat(r, n)(s));
      return seats.length >= MAX_SEATS ? seats : [...seats, { row: r, seat_number: n }];
    });
  };

  const sortedSeats = [...selected].sort((a, b) => a.row.localeCompare(b.row) || a.seat_number - b.seat_number);
  const unitPrice   = Number(screening.base_price ?? 0);
  const total       = selected.length * unitPrice;

  const meta = [
    roomName,
    fmtShowtime(screening.start_time),
    screening.format,
    LANG_LABEL[screening.language_type] ?? screening.language_type,
  ].filter(Boolean).join(" · ");

  const handleConfirm = () => {
    if (!user) { addToast("Inicia sesión para comprar", "error"); navigate("/login"); return; }
    if (!selected.length) { addToast("Selecciona al menos un asiento", "error"); return; }
    setConfirming(true);
    setSelectedSeats(sortedSeats);
    setTimeout(() => { setConfirming(false); navigate("/checkout"); }, 400);
  };

  const confirmLabel = confirming ? "Preparando tu compra…" : "Continuar al pago";

  return (
    <main className="frame min-h-svh bg-ground pt-24 pb-32 font-sans text-ink lg:pt-20 lg:pb-6">
      <div className="mx-auto w-full max-w-6xl">
        <button
          type="button"
          onClick={() => navigate(`/pelicula/${movie.id}`)}
          className="-ml-1 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-1 text-base font-semibold text-muted transition hover:text-ink focus-visible:outline-2 focus-visible:outline-white"
        >
          <ArrowLeft size={18} />
          Volver a la película
        </button>

        <header className="mt-4 flex lg:mt-1 animate-rise items-center gap-5 motion-reduce:animate-none">
          {movie.poster_url && (
            <img src={movie.poster_url} alt="" width="500" height="750" className="hidden w-16 shrink-0 rounded-tile object-cover sm:block lg:w-12" />
          )}
          <div className="min-w-0">
            <h1 className="m-0 text-[clamp(1.75rem,4vw,3rem)] lg:text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.05] font-extrabold tracking-tight text-balance text-ink">
              {movie.title}
            </h1>
            <p className="mt-2 text-base text-muted sm:text-lg lg:mt-1 lg:text-base">{meta}</p>
          </div>
        </header>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:mt-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-8">
          <section aria-labelledby="seats-title" className="rounded-card bg-surface px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-6">
            <div className="mb-8 flex flex-wrap items-baseline lg:mb-4 justify-between gap-x-6 gap-y-1">
              <h2 id="seats-title" className="m-0 text-xl font-bold tracking-tight text-ink sm:text-2xl">Elige tus asientos</h2>
              <p className="text-base text-muted tabular-nums">
                {freeCount} libres de {rows * seatsPerRow}
              </p>
            </div>
            <SeatMap rowLabels={rowLabels} seatsPerRow={seatsPerRow} getStatus={getStatus} onToggle={toggleSeat} />
            <Legend />
          </section>

          <aside aria-labelledby="summary-title" className="rounded-card bg-surface p-6 sm:p-8 lg:sticky lg:top-24 lg:p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="summary-title" className="m-0 text-xl font-bold tracking-tight text-ink">Tu selección</h2>
              <p className="text-sm text-muted tabular-nums">{selected.length} de {MAX_SEATS}</p>
            </div>

            {sortedSeats.length > 0 ? (
              <ul aria-live="polite" className="m-0 mt-5 flex list-none flex-wrap gap-2 p-0">
                {sortedSeats.map(s => {
                  const label = `${s.row}${s.seat_number}`;
                  return (
                    <li key={label}>
                      <button
                        type="button"
                        aria-label={`Quitar asiento ${label}`}
                        onClick={() => toggleSeat(s.row, s.seat_number)}
                        className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-accent/20 pr-2.5 pl-3.5 text-sm font-bold text-ink transition hover:bg-accent/35 focus-visible:outline-2 focus-visible:outline-white"
                      >
                        <span>{label}</span>
                        <X size={14} className="text-muted" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p aria-live="polite" className="mt-5 text-base text-muted">Toca una butaca libre en el plano para apartarla.</p>
            )}

            <dl className="m-0 mt-8 flex flex-col gap-3 text-base">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Precio por asiento</dt>
                <dd className="m-0 tabular-nums">{money(unitPrice)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 rounded-tile bg-raised px-4 py-3">
                <dt className="font-semibold">Total</dt>
                <dd className="m-0 text-2xl font-extrabold tracking-tight tabular-nums">{money(total)}</dd>
              </div>
            </dl>

            <PillButton
              size="lg"
              onClick={handleConfirm}
              disabled={!selected.length || confirming}
              aria-busy={confirming}
              className="mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50 max-lg:hidden"
            >
              {confirmLabel}
            </PillButton>
          </aside>
        </div>
      </div>

      {/* Barra de compra del teléfono: el total y la acción siempre a mano mientras se recorre el plano. */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-raised px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <p className="min-w-0 text-sm text-muted">
            <span className="block text-lg font-extrabold text-ink tabular-nums">{money(total)}</span>
            {selected.length} {seatsWord(selected.length)}
          </p>
          <PillButton
            onClick={handleConfirm}
            disabled={!selected.length || confirming}
            aria-busy={confirming}
            className="h-12 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmLabel}
          </PillButton>
        </div>
      </div>
    </main>
  );
}
