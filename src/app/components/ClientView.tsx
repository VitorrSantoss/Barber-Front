import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Barber, Service, TimeSlot, Appointment, ClientProfile } from "../types";
import { Initials } from "./Brand";
import { errorMessage } from "../api";
import { compareQueue, isActive, localDate, toDateTime, useNow } from "../queue";

interface ClientViewProps {
  barbers: Barber[];
  services: Service[];
  timeSlots: TimeSlot[];
  appointments: Appointment[];
  client: ClientProfile;
  onBook: (appointment: Omit<Appointment, "id" | "status">) => Promise<void>;
}

const STEPS = ["Serviço", "Barbeiro", "Horário", "Confirmar"];

const stepMotion = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
  transition: { duration: 0.18 },
};

function getBarberQueue(barberId: string, appointments: Appointment[]) {
  return appointments
    .filter((a) => a.barberId === barberId && isActive(a))
    .sort(compareQueue);
}

export function ClientView({ barbers, services, timeSlots, appointments, client, onBook }: ClientViewProps) {
  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [booked, setBooked] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState("");
  const now = useNow();
  const today = localDate(now);
  // Passou do último horário do expediente: a agenda passa a ser a de amanhã.
  const dayClosed = timeSlots.every((s) => new Date(toDateTime(today, s.time)) <= now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const day = dayClosed ? localDate(tomorrow) : today;

  // Active booking for this client (already in the queue)
  const activeBooking = appointments.find((a) => a.clientId === client.id && isActive(a));

  // Ocupado: já existe agendamento do barbeiro nesse horário, nesse dia.
  const isSlotTaken = (slot: TimeSlot) =>
    appointments.some(
      (a) =>
        a.barberId === selectedBarber?.id &&
        a.dateTime?.slice(0, 10) === day &&
        a.time === slot.time &&
        a.status !== "cancelado"
    );

  // A API só aceita horário no futuro.
  const isSlotPast = (slot: TimeSlot) => new Date(toDateTime(day, slot.time)) <= now;

  const handleBook = async () => {
    if (!selectedService || !selectedBarber || !selectedSlot || booking) return;
    setBooking(true);
    setBookError("");
    try {
      await onBook({
        clientId: client.id,
        clientName: client.name,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        barberId: selectedBarber.id,
        barberName: selectedBarber.name,
        time: selectedSlot.time,
        dateTime: toDateTime(day, selectedSlot.time),
      });
      setBooked(true);
    } catch (err) {
      setBookError(errorMessage(err));
    } finally {
      setBooking(false);
    }
  };

  const reset = () => {
    setStep(0);
    setSelectedService(null);
    setSelectedBarber(null);
    setSelectedSlot(null);
    setBooked(false);
    setBookError("");
  };

  // Post-booking confirmation view
  if (booked && selectedBarber) {
    const queue = getBarberQueue(selectedBarber.id, appointments);
    const isMeAppt = (a: Appointment) => a.clientId === client.id && a.time === selectedSlot?.time;
    const alreadyIn = queue.some(isMeAppt);
    const optimisticQueue = alreadyIn
      ? queue
      : [...queue, {
          id: "new",
          clientId: client.id,
          dateTime: toDateTime(day, selectedSlot?.time ?? ""),
          scheduled: true,
          clientName: client.name,
          serviceId: selectedService?.id ?? "",
          serviceName: selectedService?.name ?? "",
          barberId: selectedBarber.id,
          barberName: selectedBarber.name,
          time: selectedSlot?.time ?? "",
          status: "aguardando" as const,
        }].sort(compareQueue);

    const myPosition = optimisticQueue.findIndex(isMeAppt) + 1;
    const estMinutes = optimisticQueue.slice(0, myPosition - 1).length * 30;

    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <h2 className="text-center text-3xl">Tá marcado!</h2>
        <p className="mt-1 text-center text-ink-soft">Guarda sua senha, a gente te chama.</p>

        <motion.div
          initial={{ opacity: 0, y: -28, rotate: -3 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="ticket mx-auto mt-6 px-6 pb-8 pt-9"
        >
          <p className="text-center text-sm font-medium text-ink-soft">BarberHouse · sua posição na fila</p>
          <p className="mt-2 text-center font-display leading-none">
            <span className="align-top text-2xl">Nº</span>
            <span className="text-8xl">{myPosition}</span>
          </p>
          <p className={`mt-3 text-center font-semibold ${estMinutes > 0 ? "" : "text-pole-red"}`}>
            {estMinutes > 0 ? `Espera estimada: ~${estMinutes} min` : "Você é o próximo!"}
          </p>

          <dl className="mt-6 space-y-2 border-t-2 border-dashed border-rule pt-5">
            <ReceiptRow label="Nome" value={client.name} />
            <ReceiptRow label="Serviço" value={selectedService?.name ?? ""} />
            <ReceiptRow label="Barbeiro" value={selectedBarber.name} />
            <ReceiptRow label="Horário" value={selectedSlot?.time ?? ""} />
          </dl>
        </motion.div>

        <section className="mt-10" aria-labelledby="fila-titulo">
          <h3 id="fila-titulo">Fila de {selectedBarber.name}</h3>
          <QueueList
            queue={optimisticQueue}
            isMe={isMeAppt}
          />
        </section>

        <button onClick={reset} className="btn btn-ink mt-8 w-full">
          Marcar outro horário
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <ProfileLine client={client} appointments={appointments} />

      {/* Active booking tracker */}
      {activeBooking && !booked && (
        <ActiveBookingBanner booking={activeBooking} appointments={appointments} />
      )}

      <StepIndicator step={step} />

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.section key="step0" {...stepMotion} aria-labelledby="step-title">
            <StepTitle title="Tabela de preços" hint="Escolha o serviço." />
            {services.length === 0 && (
              <p className="mt-5 border-t-2 border-ink pt-4 text-ink-soft">Nenhum serviço disponível agora.</p>
            )}
            <ul className="mt-5 border-t-2 border-ink">
              {services.map((svc) => (
                <li key={svc.id} className="border-b border-rule">
                  <ServiceRow service={svc} selected={selectedService?.id === svc.id}
                    onClick={() => { setSelectedService(svc); setStep(1); }} />
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {step === 1 && (
          <motion.section key="step1" {...stepMotion} aria-labelledby="step-title">
            <StepTitle title="Na cadeira hoje" hint="Escolha quem vai te atender." />
            {barbers.length === 0 && (
              <p className="mt-5 border-t-2 border-ink pt-4 text-ink-soft">Nenhum barbeiro disponível agora.</p>
            )}
            <ul className="mt-5 border-t-2 border-ink">
              {barbers.map((barber) => {
                const queue = getBarberQueue(barber.id, appointments);
                return (
                  <li key={barber.id} className="border-b border-rule">
                    <BarberRow barber={barber} queue={queue}
                      selected={selectedBarber?.id === barber.id}
                      onClick={() => { setSelectedBarber(barber); setStep(2); }} />
                  </li>
                );
              })}
            </ul>
            <LiveQueuesPanel barbers={barbers} appointments={appointments} />
            <BackButton onClick={() => setStep(0)} />
          </motion.section>
        )}

        {step === 2 && (
          <motion.section key="step2" {...stepMotion} aria-labelledby="step-title">
            <StepTitle
              title={`Agenda de ${selectedBarber?.name ?? ""}`}
              hint={
                dayClosed
                  ? "A agenda de hoje já fechou. Estes são os horários de amanhã."
                  : "Horário riscado já tem cliente ou já passou."
              }
            />
            <div className="mt-5 space-y-5 rounded-sm border-2 border-ink bg-ticket p-4">
              {[
                { label: "Manhã", slots: timeSlots.filter((s) => s.time < "12:00") },
                { label: "Tarde", slots: timeSlots.filter((s) => s.time >= "12:00") },
              ].map((period) => period.slots.length > 0 && (
                <div key={period.label}>
                  <h3 className="border-b-2 border-ink pb-1 text-lg">{period.label}</h3>
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {period.slots.map((slot) => {
                      const past = isSlotPast(slot);
                      const taken = past || isSlotTaken(slot);
                      const sel = selectedSlot?.id === slot.id;
                      return (
                        <button
                          key={slot.id}
                          disabled={taken}
                          aria-pressed={sel}
                          aria-label={past ? `${slot.time}, já passou` : taken ? `${slot.time}, ocupado` : slot.time}
                          onClick={() => { setSelectedSlot(slot); setStep(3); }}
                          className={`min-h-12 rounded-sm border-2 font-display text-lg transition-colors ${
                            taken
                              ? "slot-taken border-rule text-ink-soft line-through"
                              : sel
                                ? "border-ink bg-ink text-paper"
                                : "border-ink bg-paper text-ink hover:bg-paper-2"
                          }`}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <BackButton onClick={() => setStep(1)} />
          </motion.section>
        )}

        {step === 3 && (
          <motion.section key="step3" {...stepMotion} aria-labelledby="step-title">
            <StepTitle title="Confere aí" hint="Se estiver tudo certo, é só marcar." />
            <dl className="mt-5 space-y-3 rounded-sm border-2 border-ink bg-ticket p-5">
              <ReceiptRow label="Cliente" value={client.name} />
              <ReceiptRow label="Serviço" value={selectedService?.name ?? ""} />
              <ReceiptRow label="Barbeiro" value={selectedBarber?.name || ""} />
              <ReceiptRow label="Horário" value={selectedSlot?.time || ""} />
              <div className="flex items-baseline gap-2 border-t-2 border-ink pt-3">
                <dt className="font-semibold">Valor</dt>
                <span className="leader" aria-hidden="true" />
                <dd className="font-display text-2xl text-pole-red">R$ {selectedService?.price}</dd>
              </div>
            </dl>
            {bookError && (
              <p role="alert" className="mt-4 font-medium text-pole-red">{bookError}</p>
            )}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <BackButton onClick={() => setStep(2)} inline />
              <button
                onClick={handleBook}
                disabled={booking}
                className="btn btn-red text-lg disabled:opacity-60 sm:min-w-64"
              >
                {booking ? "Marcando…" : "Marcar horário"}
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Profile line ---

function ProfileLine({ client, appointments }: { client: ClientProfile; appointments: Appointment[] }) {
  const myAppts = appointments.filter((a) => a.clientId === client.id);
  const completed = myAppts.filter((a) => a.status === "concluido").length;
  const visits = client.totalVisits + completed;

  return (
    <p className="text-ink-soft">
      Olá, <span className="font-semibold text-ink">{client.name.split(" ")[0]}</span>.{" "}
      {visits === 0 ? "Seja bem-vindo à casa." : `${visits} ${visits === 1 ? "visita" : "visitas"} por aqui.`}
    </p>
  );
}

// --- Active Booking Banner (senha compacta) ---

function ActiveBookingBanner({ booking, appointments }: { booking: Appointment; appointments: Appointment[] }) {
  const queue = getBarberQueue(booking.barberId, appointments);
  const pos = queue.findIndex((a) => a.id === booking.id) + 1;
  const isNext = pos === 1 && booking.status === "aguardando";
  const inChair = booking.status === "em_atendimento";
  const estMinutes = Math.max(0, (pos - 1) * 30);

  return (
    <div role="status" className="ticket ticket-sm mt-4 flex items-center gap-4 px-4 py-4">
      <div className="shrink-0 border-r-2 border-dashed border-rule pr-4 text-center">
        <span className="block text-xs font-medium text-ink-soft">senha</span>
        <span className="font-display text-4xl leading-none">{pos}</span>
      </div>
      <div className="min-w-0">
        <p className={isNext || inChair ? "font-display text-lg text-pole-red" : "font-semibold"}>
          {inChair
            ? "Você está na cadeira."
            : isNext
              ? "Você é o próximo! Prepare-se."
              : booking.scheduled
                ? `Horário marcado com ${booking.barberName}`
                : `Na fila de ${booking.barberName}`}
        </p>
        <p className="text-sm text-ink-soft">
          {booking.serviceName} · {booking.time}
          {!isNext && !inChair && estMinutes > 0 && ` · ~${estMinutes} min`}
        </p>
      </div>
    </div>
  );
}

// --- Live Queues Panel ---

function LiveQueuesPanel({ barbers, appointments }: { barbers: Barber[]; appointments: Appointment[] }) {
  const totalActive = appointments.filter((a) => a.status === "aguardando" || a.status === "em_atendimento").length;

  return (
    <details className="group mt-6 border-y-2 border-ink">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-2 font-semibold [&::-webkit-details-marker]:hidden">
        <span>
          Ver as filas de hoje <span className="font-normal text-ink-soft">({totalActive} na casa)</span>
        </span>
        <span aria-hidden="true" className="font-display transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="grid gap-6 pb-5 pt-2 sm:grid-cols-3">
        {barbers.map((barber) => {
          const queue = getBarberQueue(barber.id, appointments);
          return (
            <div key={barber.id}>
              <h3 className="text-lg">{barber.name}</h3>
              {queue.length === 0 ? (
                <p className="mt-1 text-sm text-ink-soft">Livre agora.</p>
              ) : (
                <QueueList queue={queue} compact />
              )}
            </div>
          );
        })}
      </div>
    </details>
  );
}

// --- Reusable subcomponents ---

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="mb-6 mt-8">
      <p className="text-sm">
        <span className="font-semibold">Passo {step + 1} de {STEPS.length}</span>
        <span className="text-ink-soft"> — {STEPS[step]}</span>
      </p>
      <div className="mt-2 grid grid-cols-4 gap-1" aria-hidden="true">
        {STEPS.map((label, i) => (
          <span key={label} className={`h-1 transition-colors ${i <= step ? "bg-pole-red" : "bg-rule"}`} />
        ))}
      </div>
    </div>
  );
}

function StepTitle({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <h2 id="step-title" className="text-2xl sm:text-3xl">{title}</h2>
      <p className="mt-1 text-ink-soft">{hint}</p>
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="shrink-0 text-ink-soft">{label}</dt>
      <span className="leader" aria-hidden="true" />
      <dd className="min-w-0 text-right font-semibold">{value}</dd>
    </div>
  );
}

function QueueList({
  queue, isMe, compact = false,
}: {
  queue: Appointment[];
  isMe?: (appt: Appointment) => boolean;
  compact?: boolean;
}) {
  return (
    <ol className={`border-t-2 border-ink ${compact ? "mt-2 text-sm" : "mt-3"}`}>
      {queue.map((appt, idx) => {
        const me = isMe?.(appt) ?? false;
        const inChair = appt.status === "em_atendimento";
        return (
          <li
            key={appt.id + idx}
            className={`flex items-center gap-3 border-b border-rule ${compact ? "py-2" : "py-3"} ${
              me ? "border-l-4 border-l-pole-red bg-paper-2 pl-2" : "pl-3"
            }`}
          >
            <span className={`w-6 shrink-0 text-right font-display ${compact ? "" : "text-lg"}`}>{idx + 1}.</span>
            <span className="min-w-0 flex-1">
              <span className={`block truncate ${me ? "font-semibold" : ""}`}>
                {appt.clientName}{me && " (você)"}
              </span>
              <span className="block truncate text-sm text-ink-soft">{appt.serviceName}</span>
            </span>
            <span className="shrink-0 pr-2 text-right">
              <span className="block font-display">{appt.time}</span>
              {inChair && <span className="block text-sm font-semibold text-navy">na cadeira</span>}
              {appt.scheduled && <span className="block text-sm text-ink-soft">marcado</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function BackButton({ onClick, inline = false }: { onClick: () => void; inline?: boolean }) {
  return (
    <button onClick={onClick} className={`btn-text -ml-2 ${inline ? "" : "mt-5"}`}>
      <span aria-hidden="true">←</span> Voltar
    </button>
  );
}

function ServiceRow({ service, selected, onClick }: { service: Service; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`block min-h-11 w-full px-2 py-4 text-left transition-colors hover:bg-paper-2 ${
        selected ? "border-l-4 border-l-pole-red bg-paper-2" : ""
      }`}
    >
      <span className="flex items-baseline gap-2">
        <span className="font-display text-lg sm:text-xl">{service.name}</span>
        <span className="leader" aria-hidden="true" />
        <span className="shrink-0 font-display text-lg text-pole-red sm:text-xl">R$ {service.price}</span>
      </span>
      <span className="mt-1 block text-sm text-ink-soft">
        {service.duration} min{service.description && ` · ${service.description}`}
      </span>
    </button>
  );
}

function BarberRow({ barber, queue, selected, onClick }: { barber: Barber; queue: Appointment[]; selected: boolean; onClick: () => void }) {
  const busy = queue.some((a) => a.status === "em_atendimento");
  const estWait = queue.length * 30;

  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-11 w-full items-center gap-4 px-2 py-4 text-left transition-colors hover:bg-paper-2 ${
        selected ? "border-l-4 border-l-pole-red bg-paper-2" : ""
      }`}
    >
      <Initials name={barber.name} />
      <span className="min-w-0 flex-1">
        <span className="block font-display text-xl">{barber.name}</span>
        {barber.specialty && <span className="block text-sm text-ink-soft">{barber.specialty}</span>}
        <span className={`mt-1 block text-sm font-semibold ${queue.length === 0 ? "text-navy" : "text-ink"}`}>
          {queue.length === 0
            ? "Livre agora"
            : `${queue.length} na frente · ~${estWait} min${busy ? " · atendendo" : ""}`}
        </span>
      </span>
      <span aria-hidden="true" className="font-display text-xl">→</span>
    </button>
  );
}
