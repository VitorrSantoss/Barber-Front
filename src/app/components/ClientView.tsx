import { useState, useEffect } from "react";
import { Scissors, Clock, User, CheckCircle, ChevronRight, ChevronLeft, Star, Users, ChevronDown, ChevronUp, Calendar, Award } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Barber, Service, TimeSlot, Appointment, ClientProfile } from "../types";

interface ClientViewProps {
  barbers: Barber[];
  services: Service[];
  timeSlots: TimeSlot[];
  appointments: Appointment[];
  client: ClientProfile;
  onBook: (appointment: Omit<Appointment, "id" | "status">) => void;
}

const STEPS = ["Corte", "Barbeiro", "Horário", "Confirmar"];

function getBarberQueue(barberId: string, appointments: Appointment[]) {
  return appointments
    .filter((a) => a.barberId === barberId && (a.status === "aguardando" || a.status === "em_atendimento"))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function ClientView({ barbers, services, timeSlots, appointments, client, onBook }: ClientViewProps) {
  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [booked, setBooked] = useState(false);

  // Active booking for this client (already in the queue)
  const activeBooking = appointments.find(
    (a) => a.clientName === client.name && (a.status === "aguardando" || a.status === "em_atendimento")
  );

  const isSlotTaken = (slot: TimeSlot) =>
    appointments.some(
      (a) => a.barberId === selectedBarber?.id && a.time === slot.time && a.status !== "cancelado"
    );

  const handleBook = () => {
    if (!selectedService || !selectedBarber || !selectedSlot) return;
    onBook({
      clientName: client.name,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      barberId: selectedBarber.id,
      barberName: selectedBarber.name,
      time: selectedSlot.time,
    });
    setBooked(true);
  };

  const reset = () => {
    setStep(0);
    setSelectedService(null);
    setSelectedBarber(null);
    setSelectedSlot(null);
    setBooked(false);
  };

  // Post-booking confirmation view
  if (booked && selectedBarber) {
    const queue = getBarberQueue(selectedBarber.id, appointments);
    const alreadyIn = queue.some((a) => a.clientName === client.name && a.time === selectedSlot?.time);
    const optimisticQueue = alreadyIn
      ? queue
      : [...queue, {
          id: "new",
          clientName: client.name,
          serviceId: selectedService?.id ?? "",
          serviceName: selectedService?.name ?? "",
          barberId: selectedBarber.id,
          barberName: selectedBarber.name,
          time: selectedSlot?.time ?? "",
          status: "aguardando" as const,
        }].sort((a, b) => a.time.localeCompare(b.time));

    const myPosition = optimisticQueue.findIndex(
      (a) => a.clientName === client.name && a.time === selectedSlot?.time
    ) + 1;
    const estMinutes = optimisticQueue.slice(0, myPosition - 1).length * 30;

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(201,168,76,0.15)", border: "1px solid #c9a84c" }}>
            <CheckCircle size={32} color="#c9a84c" />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#c9a84c", marginBottom: 4 }}>Agendado!</h2>
          <p style={{ fontFamily: "Inter, sans-serif", color: "#888070", fontSize: 14 }}>
            {selectedService?.name} · {selectedBarber.name} · {selectedSlot?.time}
          </p>
        </div>

        <div className="rounded-xl p-6 mb-4 text-center" style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.25)" }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#888070", letterSpacing: "0.1em", marginBottom: 12 }}>
            SUA POSIÇÃO NA FILA
          </p>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: "rgba(201,168,76,0.12)", border: "2px solid #c9a84c" }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: "#c9a84c", fontWeight: 700 }}>
              {myPosition}°
            </span>
          </div>
          <p style={{ fontFamily: "Inter, sans-serif", color: "#f0ece0", fontSize: 15, fontWeight: 500 }}>{client.name}</p>
          {estMinutes > 0 ? (
            <p style={{ fontFamily: "Inter, sans-serif", color: "#888070", fontSize: 13, marginTop: 6 }}>
              <Clock size={12} style={{ display: "inline", marginRight: 4 }} />
              Espera estimada: ~{estMinutes} min
            </p>
          ) : (
            <p style={{ fontFamily: "Inter, sans-serif", color: "#34d399", fontSize: 13, marginTop: 6, fontWeight: 500 }}>
              Você é o próximo!
            </p>
          )}
        </div>

        <div className="rounded-xl p-5 mb-6" style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.12)" }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#888070", letterSpacing: "0.1em", marginBottom: 16 }}>
            FILA DE {selectedBarber.name.toUpperCase()}
          </p>
          <div className="space-y-2">
            {optimisticQueue.map((appt, idx) => {
              const isMe = appt.clientName === client.name && appt.time === selectedSlot?.time;
              const isActive = appt.status === "em_atendimento";
              return (
                <motion.div key={appt.id + idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }} className="flex items-center gap-3 px-4 py-3 rounded-lg"
                  style={{
                    background: isMe ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.03)",
                    border: isMe ? "1px solid rgba(201,168,76,0.4)" : "1px solid rgba(255,255,255,0.05)",
                  }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: isMe ? "#c9a84c" : isActive ? "rgba(96,165,250,0.15)" : "#1e1e1e", border: isActive && !isMe ? "1px solid rgba(96,165,250,0.4)" : "none" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isMe ? "#0a0a0a" : isActive ? "#60a5fa" : "#555" }}>{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: isMe ? 600 : 400, color: isMe ? "#c9a84c" : "#f0ece0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {isMe ? `${appt.clientName} (você)` : appt.clientName}
                    </p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#666" }}>{appt.serviceName}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#888070" }}>{appt.time}</span>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(96,165,250,0.12)", color: "#60a5fa", fontWeight: 600 }}>Em atend.</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <button onClick={reset} className="w-full py-3 rounded transition-all hover:opacity-90"
          style={{ background: "#c9a84c", color: "#0a0a0a", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15 }}>
          Novo Agendamento
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Profile card */}
      <ProfileCard client={client} appointments={appointments} />

      {/* Active booking tracker */}
      {activeBooking && !booked && (
        <ActiveBookingBanner booking={activeBooking} appointments={appointments} clientName={client.name} />
      )}

      {/* Stepper */}
      <div className="flex items-center justify-between mb-10 mt-6">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all"
                style={{
                  background: i < step ? "#c9a84c" : i === step ? "rgba(201,168,76,0.15)" : "#1e1e1e",
                  border: i <= step ? "1px solid #c9a84c" : "1px solid rgba(201,168,76,0.2)",
                  color: i < step ? "#0a0a0a" : i === step ? "#c9a84c" : "#888070",
                  fontWeight: 600,
                }}>
                {i < step ? <CheckCircle size={16} /> : i + 1}
              </div>
              <span className="mt-1 hidden sm:block" style={{ fontSize: 11, color: i === step ? "#c9a84c" : "#888070", fontFamily: "Inter, sans-serif" }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 mx-2 h-px" style={{ background: i < step ? "#c9a84c" : "rgba(201,168,76,0.15)" }} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <SectionTitle icon={<Scissors size={18} />} title="Escolha o Corte" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {services.map((svc) => (
                <ServiceCard key={svc.id} service={svc} selected={selectedService?.id === svc.id}
                  onClick={() => { setSelectedService(svc); setStep(1); }} />
              ))}
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <SectionTitle icon={<User size={18} />} title="Escolha o Barbeiro" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {barbers.map((barber) => {
                const queue = getBarberQueue(barber.id, appointments);
                return (
                  <BarberCard key={barber.id} barber={barber} queue={queue}
                    selected={selectedBarber?.id === barber.id}
                    onClick={() => { setSelectedBarber(barber); setStep(2); }} />
                );
              })}
            </div>
            <LiveQueuesPanel barbers={barbers} appointments={appointments} />
            <BackButton onClick={() => setStep(0)} />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <SectionTitle icon={<Clock size={18} />} title="Escolha o Horário" />
            <p className="text-muted-foreground mt-1 mb-6" style={{ fontFamily: "Inter, sans-serif", fontSize: 14 }}>
              Horários disponíveis com {selectedBarber?.name}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {timeSlots.map((slot) => {
                const taken = isSlotTaken(slot);
                const sel = selectedSlot?.id === slot.id;
                return (
                  <button key={slot.id} disabled={taken} onClick={() => { setSelectedSlot(slot); setStep(3); }}
                    className="py-3 rounded transition-all"
                    style={{
                      background: taken ? "#111" : sel ? "#c9a84c" : "rgba(201,168,76,0.08)",
                      border: taken ? "1px solid #222" : sel ? "1px solid #c9a84c" : "1px solid rgba(201,168,76,0.2)",
                      color: taken ? "#444" : sel ? "#0a0a0a" : "#f0ece0",
                      fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 500,
                      cursor: taken ? "not-allowed" : "pointer",
                      textDecoration: taken ? "line-through" : "none",
                    }}>
                    {slot.time}
                  </button>
                );
              })}
            </div>
            <BackButton onClick={() => setStep(1)} />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <SectionTitle icon={<CheckCircle size={18} />} title="Confirmar Agendamento" />
            <div className="mt-6 rounded-lg p-6 space-y-4" style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.15)" }}>
              <SummaryRow label="Cliente" value={client.name} />
              <SummaryRow label="Corte" value={`${selectedService?.name} — R$ ${selectedService?.price}`} />
              <SummaryRow label="Barbeiro" value={selectedBarber?.name || ""} />
              <SummaryRow label="Horário" value={selectedSlot?.time || ""} />
            </div>
            <div className="flex gap-3 mt-6">
              <BackButton onClick={() => setStep(2)} />
              <button onClick={handleBook} className="flex-1 py-3 rounded transition-all hover:opacity-90"
                style={{ background: "#c9a84c", color: "#0a0a0a", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15, border: "1px solid #c9a84c", cursor: "pointer" }}>
                Confirmar Agendamento
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Profile Card ---

function ProfileCard({ client, appointments }: { client: ClientProfile; appointments: Appointment[] }) {
  const myAppts = appointments.filter((a) => a.clientName === client.name);
  const completed = myAppts.filter((a) => a.status === "concluido").length;

  return (
    <div className="rounded-xl p-5 mb-2 flex items-center gap-5"
      style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.2)" }}>
      <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "#c9a84c", fontSize: 22, fontWeight: 700, color: "#0a0a0a", fontFamily: "'Playfair Display', serif" }}>
        {client.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#f0ece0", fontWeight: 600 }}>
          Olá, {client.name.split(" ")[0]}!
        </p>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#888070", marginTop: 2 }}>
          Membro desde {client.memberSince}
        </p>
      </div>
      <div className="flex gap-4 flex-shrink-0">
        <Stat icon={<Award size={13} />} value={client.totalVisits + completed} label="visitas" />
        <Stat icon={<Calendar size={13} />} value={myAppts.filter((a) => a.status === "aguardando").length} label="na fila" />
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-0.5" style={{ color: "#c9a84c" }}>{icon}
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 16, fontWeight: 700, color: "#c9a84c" }}>{value}</span>
      </div>
      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888070" }}>{label}</span>
    </div>
  );
}

// --- Active Booking Banner ---

function ActiveBookingBanner({ booking, appointments, clientName }: { booking: Appointment; appointments: Appointment[]; clientName: string }) {
  const queue = getBarberQueue(booking.barberId, appointments);
  const pos = queue.findIndex((a) => a.clientName === clientName) + 1;
  const isNext = pos === 1 && booking.status === "aguardando";
  const estMinutes = Math.max(0, (pos - 1) * 30);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 mb-2 flex items-center justify-between gap-4"
      style={{
        background: isNext ? "rgba(201,168,76,0.12)" : "rgba(96,165,250,0.07)",
        border: isNext ? "1px solid rgba(201,168,76,0.5)" : "1px solid rgba(96,165,250,0.25)",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: isNext ? "#c9a84c" : "rgba(96,165,250,0.15)", border: isNext ? "none" : "1px solid rgba(96,165,250,0.3)" }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700, color: isNext ? "#0a0a0a" : "#60a5fa" }}>
            {pos}°
          </span>
        </div>
        <div>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: isNext ? "#c9a84c" : "#f0ece0" }}>
            {isNext ? "Você é o próximo! Prepare-se." : `Na fila de ${booking.barberName}`}
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#888070" }}>
            {booking.serviceName} · {booking.time}
            {!isNext && estMinutes > 0 && ` · ~${estMinutes} min`}
          </p>
        </div>
      </div>
      {isNext && (
        <div className="flex-shrink-0 px-3 py-1 rounded-full"
          style={{ background: "#c9a84c" }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, color: "#0a0a0a" }}>PROX</span>
        </div>
      )}
    </motion.div>
  );
}

// --- Live Queues Panel ---

function LiveQueuesPanel({ barbers, appointments }: { barbers: Barber[]; appointments: Appointment[] }) {
  const [open, setOpen] = useState(false);
  const totalActive = appointments.filter((a) => a.status === "aguardando" || a.status === "em_atendimento").length;

  return (
    <div className="mt-6 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(201,168,76,0.2)" }}>
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 transition-all hover:opacity-90"
        style={{ background: "#141414", cursor: "pointer" }}>
        <div className="flex items-center gap-3">
          <Users size={16} color="#c9a84c" />
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600, color: "#f0ece0" }}>Filas ao Vivo</span>
          <span className="px-2 py-0.5 rounded-full text-xs"
            style={{ background: "rgba(201,168,76,0.15)", color: "#c9a84c", fontWeight: 600 }}>
            {totalActive} ativos
          </span>
        </div>
        {open ? <ChevronUp size={16} color="#888070" /> : <ChevronDown size={16} color="#888070" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", background: "#0a0a0a" }}>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {barbers.map((barber) => {
                const queue = getBarberQueue(barber.id, appointments);
                const waiting = queue.filter((a) => a.status === "aguardando");
                const current = queue.find((a) => a.status === "em_atendimento");

                return (
                  <div key={barber.id} className="rounded-xl flex flex-col"
                    style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.12)" }}>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-t-xl"
                      style={{ borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)" }}>
                        {barber.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, color: "#f0ece0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {barber.name}
                        </p>
                        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888070" }}>
                          {queue.length === 0 ? "Livre agora" : `${waiting.length} aguardando${current ? " · 1 em atend." : ""}`}
                        </p>
                      </div>
                      {queue.length === 0 ? (
                        <span style={{ background: "rgba(52,211,153,0.12)", color: "#34d399", fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>LIVRE</span>
                      ) : (
                        <span style={{ background: "rgba(201,168,76,0.12)", color: "#c9a84c", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{queue.length}</span>
                      )}
                    </div>
                    <div className="flex-1 px-3 py-3 space-y-2">
                      {queue.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-5 gap-2">
                          <Scissors size={18} color="#333" />
                          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#444", textAlign: "center" }}>Nenhum cliente</p>
                        </div>
                      ) : (
                        queue.map((appt, idx) => {
                          const isActive = appt.status === "em_atendimento";
                          return (
                            <div key={appt.id} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                              style={{
                                background: isActive ? "rgba(96,165,250,0.07)" : "rgba(255,255,255,0.025)",
                                border: isActive ? "1px solid rgba(96,165,250,0.2)" : "1px solid rgba(255,255,255,0.04)",
                              }}>
                              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: isActive ? "#60a5fa" : "#555", width: 16, textAlign: "center", flexShrink: 0 }}>
                                {idx + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#d0c8b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.clientName}</p>
                                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.serviceName}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888070" }}>{appt.time}</span>
                                {isActive && (
                                  <span style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa", fontFamily: "Inter, sans-serif", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3 }}>ATEND.</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Reusable subcomponents ---

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span style={{ color: "#c9a84c" }}>{icon}</span>
      <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece0" }}>{title}</h2>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#888070", letterSpacing: "0.08em" }}>{label.toUpperCase()}</span>
      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#f0ece0", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 mt-5 transition-all hover:opacity-80"
      style={{ color: "#888070", fontFamily: "Inter, sans-serif", fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>
      <ChevronLeft size={16} /> Voltar
    </button>
  );
}

function ServiceCard({ service, selected, onClick }: { service: Service; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left rounded-lg p-5 transition-all hover:scale-[1.01]"
      style={{ background: selected ? "rgba(201,168,76,0.1)" : "#141414", border: selected ? "1px solid #c9a84c" : "1px solid rgba(201,168,76,0.15)", cursor: "pointer" }}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-2xl">{service.emoji}</span>
        <span style={{ color: "#c9a84c", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15 }}>R$ {service.price}</span>
      </div>
      <p style={{ color: "#f0ece0", fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 500 }}>{service.name}</p>
      <p style={{ color: "#888070", fontFamily: "Inter, sans-serif", fontSize: 13, marginTop: 4 }}>{service.duration} min</p>
      <div className="flex items-center justify-between mt-3">
        <p style={{ color: "#666", fontFamily: "Inter, sans-serif", fontSize: 12 }}>{service.description}</p>
        <ChevronRight size={16} color={selected ? "#c9a84c" : "#444"} />
      </div>
    </button>
  );
}

function BarberCard({ barber, queue, selected, onClick }: { barber: Barber; queue: Appointment[]; selected: boolean; onClick: () => void }) {
  const waiting = queue.filter((a) => a.status === "aguardando").length;
  const busy = queue.some((a) => a.status === "em_atendimento");
  const estWait = queue.length * 30;

  return (
    <button onClick={onClick} className="text-left rounded-lg p-5 transition-all hover:scale-[1.01]"
      style={{ background: selected ? "rgba(201,168,76,0.1)" : "#141414", border: selected ? "1px solid #c9a84c" : "1px solid rgba(201,168,76,0.15)", cursor: "pointer" }}>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)" }}>
          {barber.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ color: "#f0ece0", fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 500 }}>{barber.name}</p>
          <p style={{ color: "#888070", fontFamily: "Inter, sans-serif", fontSize: 12, marginTop: 2 }}>{barber.specialty}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star size={11} fill="#c9a84c" color="#c9a84c" />
            <span style={{ color: "#c9a84c", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600 }}>{barber.rating}</span>
            <span style={{ color: "#555", fontFamily: "Inter, sans-serif", fontSize: 12 }}>({barber.reviews})</span>
          </div>
        </div>
        <ChevronRight size={16} color={selected ? "#c9a84c" : "#444"} />
      </div>
      <div className="flex items-center justify-between rounded-lg px-3 py-2"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: queue.length === 0 ? "#34d399" : busy ? "#60a5fa" : "#c9a84c" }} />
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#888070" }}>
            {queue.length === 0 ? "Livre agora" : busy ? "Em atendimento" : "Aguardando"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#666" }}>
            <Users size={11} style={{ display: "inline", marginRight: 3 }} />{waiting} na fila
          </span>
          {queue.length > 0 && <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#666" }}>~{estWait} min</span>}
        </div>
      </div>
    </button>
  );
}
