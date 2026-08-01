import { useState } from "react";
import { Clock, Scissors, CheckCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Barber, Appointment } from "../types";

interface BarberViewProps {
  barbers: Barber[];
  appointments: Appointment[];
  onUpdateStatus: (id: string, status: Appointment["status"]) => void;
}

export function BarberView({ barbers, appointments, onUpdateStatus }: BarberViewProps) {
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);

  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);

  const myAppointments = appointments
    .filter((a) => a.barberId === selectedBarberId && a.status !== "cancelado")
    .sort((a, b) => a.time.localeCompare(b.time));

  if (!selectedBarberId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece0" }}>Acesso do Barbeiro</h2>
          <p style={{ fontFamily: "Inter, sans-serif", color: "#888070", fontSize: 14, marginTop: 6 }}>
            Selecione seu perfil para ver sua fila de espera
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {barbers.map((barber) => {
            const count = appointments.filter((a) => a.barberId === barber.id && a.status === "aguardando").length;
            return (
              <motion.button
                key={barber.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedBarberId(barber.id)}
                className="flex items-center gap-5 p-5 rounded-lg text-left transition-all"
                style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.15)", cursor: "pointer" }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)" }}
                >
                  {barber.avatar}
                </div>
                <div className="flex-1">
                  <p style={{ color: "#f0ece0", fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 500 }}>
                    {barber.name}
                  </p>
                  <p style={{ color: "#888070", fontFamily: "Inter, sans-serif", fontSize: 13, marginTop: 2 }}>{barber.specialty}</p>
                </div>
                {count > 0 && (
                  <div
                    className="px-3 py-1 rounded-full"
                    style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.4)" }}
                  >
                    <span style={{ color: "#c9a84c", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600 }}>
                      {count} na fila
                    </span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)" }}
          >
            {selectedBarber?.avatar}
          </div>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#f0ece0", fontSize: 22 }}>
              {selectedBarber?.name}
            </h2>
            <p style={{ fontFamily: "Inter, sans-serif", color: "#888070", fontSize: 13 }}>Fila de Espera</p>
          </div>
        </div>
        <button
          onClick={() => setSelectedBarberId(null)}
          className="px-4 py-2 rounded transition-all hover:opacity-80"
          style={{ background: "#1e1e1e", border: "1px solid rgba(201,168,76,0.15)", color: "#888070", fontFamily: "Inter, sans-serif", fontSize: 13, cursor: "pointer" }}
        >
          Trocar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard label="Aguardando" value={myAppointments.filter((a) => a.status === "aguardando").length} color="#c9a84c" />
        <StatCard label="Em Atendimento" value={myAppointments.filter((a) => a.status === "em_atendimento").length} color="#60a5fa" />
        <StatCard label="Concluídos" value={appointments.filter((a) => a.barberId === selectedBarberId && a.status === "concluido").length} color="#34d399" />
      </div>

      {/* Queue */}
      {myAppointments.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#1e1e1e", border: "1px solid #333" }}>
            <Scissors size={24} color="#555" />
          </div>
          <p style={{ color: "#888070", fontFamily: "Inter, sans-serif" }}>Nenhum cliente na fila</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {myAppointments.map((appt, idx) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                position={idx + 1}
                onUpdateStatus={onUpdateStatus}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg p-4 text-center" style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.1)" }}>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 24, fontWeight: 700, color }}>{value}</p>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#888070", marginTop: 2 }}>{label}</p>
    </div>
  );
}

function AppointmentCard({
  appointment,
  position,
  onUpdateStatus,
}: {
  appointment: Appointment;
  position: number;
  onUpdateStatus: (id: string, status: Appointment["status"]) => void;
}) {
  const statusConfig = {
    aguardando: { label: "Aguardando", color: "#c9a84c", bg: "rgba(201,168,76,0.1)" },
    em_atendimento: { label: "Em Atendimento", color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
    concluido: { label: "Concluído", color: "#34d399", bg: "rgba(52,211,153,0.1)" },
    cancelado: { label: "Cancelado", color: "#f87171", bg: "rgba(248,113,113,0.1)" },
  };

  const cfg = statusConfig[appointment.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      layout
      className="rounded-lg p-5"
      style={{ background: "#141414", border: "1px solid rgba(201,168,76,0.12)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: cfg.bg, border: `1px solid ${cfg.color}40` }}
          >
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700, color: cfg.color }}>
              {position}
            </span>
          </div>
          <div>
            <p style={{ color: "#f0ece0", fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 500 }}>
              {appointment.clientName}
            </p>
            <p style={{ color: "#888070", fontFamily: "Inter, sans-serif", fontSize: 13, marginTop: 2 }}>
              {appointment.serviceName}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <Clock size={12} color="#888070" />
              <span style={{ color: "#888070", fontFamily: "Inter, sans-serif", fontSize: 12 }}>{appointment.time}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 flex-shrink-0">
          <span
            className="px-2 py-1 rounded text-xs"
            style={{ background: cfg.bg, color: cfg.color, fontFamily: "Inter, sans-serif", fontWeight: 600 }}
          >
            {cfg.label}
          </span>
          <div className="flex gap-2">
            {appointment.status === "aguardando" && (
              <ActionButton
                icon={<Scissors size={13} />}
                label="Iniciar"
                color="#60a5fa"
                onClick={() => onUpdateStatus(appointment.id, "em_atendimento")}
              />
            )}
            {appointment.status === "em_atendimento" && (
              <ActionButton
                icon={<CheckCircle size={13} />}
                label="Concluir"
                color="#34d399"
                onClick={() => onUpdateStatus(appointment.id, "concluido")}
              />
            )}
            {appointment.status !== "concluido" && (
              <ActionButton
                icon={<X size={13} />}
                label="Cancelar"
                color="#f87171"
                onClick={() => onUpdateStatus(appointment.id, "cancelado")}
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ActionButton({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-3 py-1 rounded transition-all hover:opacity-90"
      style={{ background: `${color}18`, border: `1px solid ${color}40`, color, fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
    >
      {icon}
      {label}
    </button>
  );
}
