import type { Barber, Appointment } from "../types";
import { Initials } from "./Brand";
import { compareQueue, localDate, useNow } from "../queue";

interface BarberViewProps {
  barber: Barber;
  appointments: Appointment[];
  onUpdateStatus: (id: string, status: Appointment["status"]) => void | Promise<void>;
}

export function BarberView({ barber, appointments, onUpdateStatus }: BarberViewProps) {
  const today = localDate(useNow(60_000));

  // A API guarda todo o histórico: a folha do balcão mostra a fila em aberto
  // e só os atendidos de hoje.
  const doneToday = (a: Appointment) => a.status === "concluido" && a.dateTime?.slice(0, 10) === today;
  const myAppointments = appointments
    .filter((a) => a.barberId === barber.id && a.status !== "cancelado" && (a.status !== "concluido" || doneToday(a)))
    .sort(compareQueue);

  const waiting = myAppointments.filter((a) => a.status === "aguardando" && !a.scheduled).length;
  const scheduled = myAppointments.filter((a) => a.scheduled).length;
  const inChair = myAppointments.filter((a) => a.status === "em_atendimento").length;
  const done = myAppointments.filter((a) => a.status === "concluido").length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3">
        <Initials name={barber.name} />
        <div>
          <h2 className="text-2xl">{barber.name}</h2>
          <p className="text-sm text-ink-soft">Folha do balcão · hoje</p>
        </div>
      </div>

      <p className="mt-6 border-y-2 border-ink py-3">
        <strong className="font-display font-normal">{waiting}</strong> esperando
        <span aria-hidden="true" className="text-ink-soft"> · </span>
        <strong className="font-display font-normal text-navy">{inChair}</strong> na cadeira
        <span aria-hidden="true" className="text-ink-soft"> · </span>
        {scheduled > 0 && (
          <>
            <strong className="font-display font-normal">{scheduled}</strong> {scheduled === 1 ? "marcado" : "marcados"}
            <span aria-hidden="true" className="text-ink-soft"> · </span>
          </>
        )}
        <strong className="font-display font-normal">{done}</strong> {done === 1 ? "atendido" : "atendidos"} hoje
      </p>

      {myAppointments.length === 0 ? (
        <p className="py-16 text-center text-ink-soft">Ninguém na fila. Hora do cafezinho.</p>
      ) : (
        <ol className="mt-2">
          {myAppointments.map((appt) => (
            <AppointmentRow key={appt.id} appointment={appt} onUpdateStatus={onUpdateStatus} />
          ))}
        </ol>
      )}
    </div>
  );
}

const STATUS_LABEL: Record<Appointment["status"], { label: string; className: string }> = {
  aguardando: { label: "esperando", className: "text-ink-soft" },
  em_atendimento: { label: "na cadeira", className: "text-navy" },
  concluido: { label: "atendido", className: "text-ink-soft" },
  cancelado: { label: "cancelado", className: "text-pole-red" },
};

function AppointmentRow({
  appointment,
  onUpdateStatus,
}: {
  appointment: Appointment;
  onUpdateStatus: (id: string, status: Appointment["status"]) => void | Promise<void>;
}) {
  const status = appointment.scheduled
    ? { label: "marcado", className: "text-ink-soft" }
    : STATUS_LABEL[appointment.status];
  const inChair = appointment.status === "em_atendimento";
  const done = appointment.status === "concluido";

  return (
    <li
      className={`grid grid-cols-[4.5rem_1fr] gap-x-3 border-b border-rule px-2 py-4 ${
        inChair ? "border-l-4 border-l-navy bg-paper-2" : ""
      }`}
    >
      <span className={`font-display text-xl ${done ? "text-ink-soft" : ""}`}>{appointment.time}</span>
      <div className="min-w-0">
        <p className={`text-lg font-semibold ${done ? "text-ink-soft line-through" : ""}`}>{appointment.clientName}</p>
        <p className="text-sm text-ink-soft">
          {appointment.serviceName} · <span className={`font-semibold ${status.className}`}>{status.label}</span>
        </p>
        {!done && (
          <div className="-ml-2 mt-1 flex flex-wrap gap-x-2">
            {appointment.status === "aguardando" && !appointment.scheduled && (
              <button onClick={() => onUpdateStatus(appointment.id, "em_atendimento")} className="btn-text text-navy">
                Iniciar
              </button>
            )}
            {inChair && (
              <button onClick={() => onUpdateStatus(appointment.id, "concluido")} className="btn-text text-navy">
                Concluir
              </button>
            )}
            {!inChair && (
              <button onClick={() => onUpdateStatus(appointment.id, "cancelado")} className="btn-text text-pole-red">
                Cancelar
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
