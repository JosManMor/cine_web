import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Clock, Ticket } from "lucide-react";
import { getMyTickets } from "../api/purchases";
import QRCode from "../components/QRCode";
import Spinner from "../components/ui/Spinner";
import PillButton from "../components/ui/PillButton";
import Poster from "../components/tickets/Poster";
import {
  bucketOf, fmtDay, fmtShort, fmtTime, formatLine, groupByScreening,
  money, seatLabel, seatsWord, untilLabel,
} from "../components/tickets/tickets";

const FILTERS = [
  { id: "all", label: "Todas", heading: "Más funciones" },
  { id: "today", label: "Hoy", heading: "Hoy" },
  { id: "week", label: "Esta semana", heading: "Esta semana" },
  { id: "later", label: "Más adelante", heading: "Más adelante" },
];

const EMPTY_FILTER = {
  today: "No tienes funciones hoy.",
  week: "No tienes funciones en los próximos siete días.",
  later: "No tienes funciones para más adelante.",
};

const functionsWord = (n) => (n === 1 ? "función" : "funciones");

/** Selector de asiento y el QR que se presenta en la entrada de la sala. */
function QrPanel({ group, id }) {
  const [current, setCurrent] = useState(group.tickets[0].ticket_code);
  const ticket = group.tickets.find(t => t.ticket_code === current) ?? group.tickets[0];
  const many = group.tickets.length > 1;

  return (
    <div id={id} className="mx-3 mb-3 grid gap-6 rounded-[1.25rem] bg-raised p-5 sm:mx-4 sm:mb-4 sm:p-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-8">
      <div className="mx-auto rounded-tile bg-white p-3 md:mx-0">
        <QRCode code={ticket.ticket_code} size={176} />
      </div>

      <div className="min-w-0">
        {many && (
          <fieldset className="m-0 mb-5 min-w-0 border-0 p-0">
            <legend className="mb-2 p-0 text-sm text-muted">Cada asiento tiene su propio código</legend>
            <div className="flex flex-wrap gap-2">
              {group.tickets.map(t => {
                const active = t.ticket_code === ticket.ticket_code;
                return (
                  <button
                    key={t.ticket_code}
                    type="button"
                    aria-pressed={active}
                    aria-label={`Código del asiento ${seatLabel(t)}`}
                    onClick={() => setCurrent(t.ticket_code)}
                    className={`h-10 min-w-12 cursor-pointer rounded-full px-4 text-sm font-bold tabular-nums transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${active ? "bg-ink text-ground" : "bg-white/10 text-ink hover:bg-white/20"}`}
                  >
                    {seatLabel(t)}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-4 text-base">
          <div>
            <dt className="text-sm text-muted">Asiento</dt>
            <dd className="m-0 mt-0.5 text-2xl font-extrabold tracking-tight tabular-nums">{seatLabel(ticket)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Precio pagado</dt>
            <dd className="m-0 mt-0.5 text-2xl font-extrabold tracking-tight tabular-nums">{money(ticket.price_paid)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-sm text-muted">Código</dt>
            <dd className="m-0 mt-0.5 text-sm font-semibold break-all">{ticket.ticket_code}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">A nombre de</dt>
            <dd className="m-0 mt-0.5">{ticket.user_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Comprado</dt>
            <dd className="m-0 mt-0.5 tabular-nums">{fmtShort(ticket.purchased_at)}</dd>
          </div>
        </dl>

        <p className="mt-5 text-sm text-muted">Muestra este código en la entrada de la sala; se escanea una sola vez.</p>
      </div>
    </div>
  );
}

function FunctionCard({ group, featured, open, onToggle, now }) {
  const titleId = `fn-${group.key}`;
  const panelId = `qr-${group.key}`;
  const count = group.tickets.length;
  const codeWord = count === 1 ? "código" : "códigos";
  const toggleLabel = open ? "Ocultar código" : `Mostrar ${codeWord}`;

  return (
    <article aria-labelledby={titleId} className="rounded-card bg-surface">
      <div className={`flex items-start gap-4 sm:gap-6 ${featured ? "p-5 sm:p-7" : "p-4 sm:p-5"}`}>
        <Poster src={group.poster_url} title={group.movie_title} className={featured ? "w-20 sm:w-28" : "w-14 sm:w-16"} />

        <div className="min-w-0 flex-1">
          <h3 id={titleId} className={`m-0 leading-tight font-extrabold tracking-tight text-balance text-ink ${featured ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"}`}>
            {group.movie_title}
          </h3>
          <p className="mt-1.5 text-base text-ink first-letter:uppercase">
            {fmtDay(group.start_time)} <span className="whitespace-nowrap tabular-nums">· {fmtTime(group.start_time)}</span>
          </p>
          <p className="mt-0.5 text-base text-muted">
            {[group.room, formatLine(group.format, group.language_type)].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <Clock size={16} className="text-accent" />
            {untilLabel(group.start_time, now)}
          </p>
        </div>

        <div className="shrink-0 text-right max-sm:hidden">
          <p className="text-xl font-extrabold tracking-tight tabular-nums">{money(group.total)}</p>
          <p className="mt-0.5 text-sm text-muted tabular-nums">{count} {seatsWord(count)}</p>
        </div>
      </div>

      <div className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 ${featured ? "px-5 pb-4 sm:px-7" : "px-4 pb-3 sm:px-5"}`}>
        <p className="m-0 text-sm text-muted tabular-nums">
          <span className="sm:hidden">{money(group.total)} · </span>
          {group.tickets.map(seatLabel).join(", ")}
        </p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="-mr-2 inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
        >
          {toggleLabel}
          <ChevronDown size={18} className={`transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && <QrPanel group={group} id={panelId} />}
    </article>
  );
}

function CenteredState({ title, children, actions }) {
  return (
    <div className="rounded-card bg-surface px-6 py-14 text-center sm:py-20">
      <h2 className="m-0 text-xl font-bold tracking-tight text-ink sm:text-2xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-base text-muted">{children}</p>
      {actions && <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  );
}

export default function MyTicketsPage() {
  const [state, setState]     = useState({ status: "loading", tickets: [] });
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter]   = useState("all");
  const [toggled, setToggled] = useState({});
  const [now, setNow]         = useState(() => new Date());

  useEffect(() => {
    let alive = true;
    getMyTickets()
      .then(data => { if (alive) setState({ status: "ready", tickets: Array.isArray(data) ? data : [] }); })
      .catch(() => { if (alive) setState({ status: "error", tickets: [] }); });
    return () => { alive = false; };
  }, [attempt]);

  // Mantiene al día la cuenta regresiva de cada función.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const retry = () => { setState({ status: "loading", tickets: [] }); setAttempt(a => a + 1); };

  const groups   = groupByScreening(state.tickets);
  const counts   = { all: groups.length, today: 0, week: 0, later: 0 };
  for (const g of groups) counts[bucketOf(g.start_time, now)] += 1;
  const seatCount = state.tickets.length;

  const visible  = filter === "all" ? groups : groups.filter(g => bucketOf(g.start_time, now) === filter);
  const [first, ...rest] = visible;
  const isOpen   = (g) => toggled[g.key] ?? g === first;
  const toggle   = (g) => setToggled(prev => ({ ...prev, [g.key]: !isOpen(g) }));
  const filterDef = FILTERS.find(f => f.id === filter);

  let summary = "Tus boletos pagados, con el código QR de cada asiento para entrar a la sala.";
  if (state.status === "ready" && groups.length > 0) {
    summary = `${groups.length} ${functionsWord(groups.length)} con ${seatCount} ${seatsWord(seatCount)} pagados. Cada asiento entra con su propio código QR.`;
  }

  const renderCard = (g, featured) => (
    <FunctionCard key={g.key} group={g} featured={featured} open={isOpen(g)} onToggle={() => toggle(g)} now={now} />
  );

  return (
    <main className="frame min-h-svh bg-ground pt-24 pb-16 font-sans text-ink lg:pt-28">
      <div className="mx-auto w-full max-w-4xl">
        <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div className="min-w-0 max-w-xl">
            <h1 className="m-0 text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.05] font-extrabold tracking-tight text-ink">Mis tickets</h1>
            <p className="mt-3 text-base text-muted sm:text-lg">{summary}</p>
          </div>
          <PillButton as={Link} to="/" variant="light">Ver cartelera</PillButton>
        </header>

        {state.status === "loading" && (
          <output aria-label="Cargando tus tickets" className="flex justify-center py-24">
            <Spinner />
          </output>
        )}

        {state.status === "error" && (
          <div className="mt-10">
            <CenteredState title="No pudimos cargar tus tickets" actions={<PillButton onClick={retry} variant="light">Reintentar</PillButton>}>
              Revisa tu conexión e inténtalo otra vez. Tus boletos siguen guardados.
            </CenteredState>
          </div>
        )}

        {state.status === "ready" && groups.length === 0 && (
          <div className="mt-10">
            <CenteredState
              title="Aún no tienes funciones próximas"
              actions={<PillButton as={Link} to="/" variant="light"><Ticket size={18} />Elegir una película</PillButton>}
            >
              Cuando compres boletos aparecerán aquí, con el código QR de cada asiento.
            </CenteredState>
          </div>
        )}

        {state.status === "ready" && groups.length > 0 && (
          <>
            <fieldset className="m-0 mt-8 min-w-0 border-0 p-0">
              <legend className="sr-only">Filtrar funciones por fecha</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {FILTERS.map(f => {
                  const active = f.id === filter;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFilter(f.id)}
                      className={`flex cursor-pointer flex-col items-start rounded-tile px-4 py-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${active ? "bg-raised text-ink ring-[1.5px] ring-ink ring-inset" : "bg-surface text-ink hover:bg-raised"}`}
                    >
                      <span className="text-sm text-muted">{f.label}</span>
                      <span className="mt-0.5 text-xl font-bold tabular-nums">{counts[f.id]}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {visible.length === 0 && (
              <div className="mt-6">
                <CenteredState title={filterDef.heading} actions={<PillButton variant="ghost" onClick={() => setFilter("all")}>Ver todas</PillButton>}>
                  {EMPTY_FILTER[filter]}
                </CenteredState>
              </div>
            )}

            {filter === "all" && first && (
              <>
                <section aria-labelledby="next-title" className="mt-10">
                  <h2 id="next-title" className="m-0 mb-4 text-xl font-bold tracking-tight text-ink">Próxima función</h2>
                  {renderCard(first, true)}
                </section>
                {rest.length > 0 && (
                  <section aria-labelledby="more-title" className="mt-12">
                    <h2 id="more-title" className="m-0 mb-4 text-xl font-bold tracking-tight text-ink">{filterDef.heading}</h2>
                    <div className="flex flex-col gap-3">{rest.map(g => renderCard(g, false))}</div>
                  </section>
                )}
              </>
            )}

            {filter !== "all" && visible.length > 0 && (
              <section aria-labelledby="filtered-title" className="mt-10">
                <h2 id="filtered-title" className="m-0 mb-4 text-xl font-bold tracking-tight text-ink">{filterDef.heading}</h2>
                <div className="flex flex-col gap-3">{visible.map(g => renderCard(g, g === groups[0]))}</div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
