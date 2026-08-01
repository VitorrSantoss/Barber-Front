import { useState, useEffect, useRef } from "react";
import { Scissors, Users, LogOut, Bell } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ClientView } from "./components/ClientView";
import { BarberView } from "./components/BarberView";
import { LoginScreen } from "./components/LoginScreen";
import { loadProfile, clearProfile, incrementVisits } from "./auth";
import type {
  Service,
  Barber,
  TimeSlot,
  Appointment,
  ClientProfile,
} from "./types";

const SERVICES: Service[] = [
  {
    id: "s1",
    name: "Corte Clássico",
    price: 40,
    duration: 30,
    description: "Tesoura e máquina, acabamento perfeito",
    emoji: "✂️",
  },
  {
    id: "s2",
    name: "Corte + Barba",
    price: 65,
    duration: 50,
    description: "Combo completo com toalha quente",
    emoji: "🧔",
  },
  {
    id: "s3",
    name: "Degradê",
    price: 50,
    duration: 40,
    description: "Fade americano ou skin fade",
    emoji: "💈",
  },
  {
    id: "s4",
    name: "Barba Completa",
    price: 35,
    duration: 30,
    description: "Navalha, modelagem e hidratação",
    emoji: "🪒",
  },
  {
    id: "s5",
    name: "Pigmentação",
    price: 80,
    duration: 60,
    description: "Cobertura de falhas na barba",
    emoji: "🎨",
  },
  {
    id: "s6",
    name: "Relaxamento",
    price: 70,
    duration: 50,
    description: "Alisamento suave dos fios",
    emoji: "💆",
  },
];

const BARBERS: Barber[] = [
  {
    id: "b1",
    name: "Rafael Mota",
    specialty: "Degradê & Skin Fade",
    rating: 4.9,
    reviews: 312,
    avatar: "✂️",
  },
  {
    id: "b2",
    name: "Diego Santos",
    specialty: "Barba & Navalha",
    rating: 4.8,
    reviews: 245,
    avatar: "🧔",
  },
  {
    id: "b3",
    name: "Lucas Andrade",
    specialty: "Corte Clássico",
    rating: 4.7,
    reviews: 189,
    avatar: "💈",
  },
];

const TIME_SLOTS: TimeSlot[] = [
  { id: "t1", time: "08:00" },
  { id: "t2", time: "08:30" },
  { id: "t3", time: "09:00" },
  { id: "t4", time: "09:30" },
  { id: "t5", time: "10:00" },
  { id: "t6", time: "10:30" },
  { id: "t7", time: "11:00" },
  { id: "t8", time: "11:30" },
  { id: "t9", time: "14:00" },
  { id: "t10", time: "14:30" },
  { id: "t11", time: "15:00" },
  { id: "t12", time: "15:30" },
  { id: "t13", time: "16:00" },
  { id: "t14", time: "16:30" },
  { id: "t15", time: "17:00" },
  { id: "t16", time: "17:30" },
  { id: "t17", time: "18:00" },
  { id: "t18", time: "18:30" },
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "a1",
    clientName: "Carlos Oliveira",
    serviceId: "s1",
    serviceName: "Corte Clássico",
    barberId: "b1",
    barberName: "Rafael Mota",
    time: "08:00",
    status: "em_atendimento",
  },
  {
    id: "a2",
    clientName: "Thiago Lima",
    serviceId: "s3",
    serviceName: "Degradê",
    barberId: "b1",
    barberName: "Rafael Mota",
    time: "08:30",
    status: "aguardando",
  },
  {
    id: "a3",
    clientName: "Marcos Pereira",
    serviceId: "s2",
    serviceName: "Corte + Barba",
    barberId: "b2",
    barberName: "Diego Santos",
    time: "09:00",
    status: "aguardando",
  },
  {
    id: "a4",
    clientName: "André Costa",
    serviceId: "s4",
    serviceName: "Barba Completa",
    barberId: "b3",
    barberName: "Lucas Andrade",
    time: "09:30",
    status: "aguardando",
  },
];

type ViewMode = "client" | "barber";

function getQueuePosition(
  clientName: string,
  barberId: string,
  appointments: Appointment[],
): number | null {
  const queue = appointments
    .filter(
      (a) =>
        a.barberId === barberId &&
        (a.status === "aguardando" || a.status === "em_atendimento"),
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  const idx = queue.findIndex((a) => a.clientName === clientName);
  return idx === -1 ? null : idx + 1;
}

export default function App() {
  const [view, setView] = useState<ViewMode>("client");
  const [appointments, setAppointments] =
    useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [client, setClient] = useState<ClientProfile | null>(() =>
    loadProfile(),
  );
  const [notification, setNotification] = useState<string | null>(null);
  const prevPositionRef = useRef<number | null>(null);

  // Watch queue position and fire notification when client becomes next
  useEffect(() => {
    if (!client) return;

    const myAppt = appointments.find(
      (a) =>
        a.clientName === client.name &&
        (a.status === "aguardando" || a.status === "em_atendimento"),
    );
    if (!myAppt) {
      prevPositionRef.current = null;
      return;
    }

    const pos = getQueuePosition(client.name, myAppt.barberId, appointments);

    if (
      pos === 1 &&
      prevPositionRef.current !== null &&
      prevPositionRef.current > 1
    ) {
      // Client just became next in line
      const msg = `${client.name}, você é o próximo! Prepare-se.`;
      setNotification(msg);
      // Browser notification if permission granted
      if (Notification.permission === "granted") {
        new Notification("✂️ BarberHouse", { body: msg, icon: "/favicon.ico" });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted")
            new Notification("✂️ BarberHouse", { body: msg });
        });
      }
    }

    prevPositionRef.current = pos;
  }, [appointments, client]);

  const handleLogin = (profile: ClientProfile) => setClient(profile);

  const handleLogout = () => {
    clearProfile();
    setClient(null);
    setNotification(null);
    prevPositionRef.current = null;
  };

  const handleBook = (data: Omit<Appointment, "id" | "status">) => {
    const newAppt: Appointment = {
      ...data,
      id: `a${Date.now()}`,
      status: "aguardando",
    };
    setAppointments((prev) => [...prev, newAppt]);
    if (client) incrementVisits(client);
  };

  const handleUpdateStatus = (id: string, status: Appointment["status"]) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a)),
    );
  };

  // Show login only for client view
  if (view === "client" && !client) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "#0a0a0a", fontFamily: "Inter, sans-serif" }}
    >
      {/* Notification banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3"
            style={{ background: "#c9a84c" }}
          >
            <div className="flex items-center gap-3">
              <Bell size={18} color="#0a0a0a" />
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  color: "#0a0a0a",
                }}
              >
                {notification}
              </span>
            </div>
            <button
              onClick={() => setNotification(null)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#0a0a0a",
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid rgba(201,168,76,0.15)",
          background: "#0a0a0a",
        }}
        className="sticky top-0 z-10"
      >
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div
              className="w-9 h-9 rounded flex items-center justify-center"
              style={{
                background: "rgba(201,168,76,0.12)",
                border: "1px solid rgba(201,168,76,0.4)",
              }}
            >
              <Scissors size={18} color="#c9a84c" />
            </div>
            <div>
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 19,
                  color: "#f0ece0",
                  fontWeight: 600,
                }}
              >
                Barber
              </span>
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 19,
                  color: "#c9a84c",
                  fontWeight: 600,
                }}
              >
                House
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* View toggle */}
            <div
              className="flex rounded-lg p-1"
              style={{
                background: "#141414",
                border: "1px solid rgba(201,168,76,0.15)",
              }}
            >
              <TabButton
                active={view === "client"}
                icon={<Scissors size={14} />}
                label="Cliente"
                onClick={() => setView("client")}
              />
              <TabButton
                active={view === "barber"}
                icon={<Users size={14} />}
                label="Barbeiro"
                onClick={() => setView("barber")}
              />
            </div>

            {/* Profile chip */}
            {client && view === "client" && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  background: "#141414",
                  border: "1px solid rgba(201,168,76,0.15)",
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "#c9a84c" }}
                >
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#0a0a0a",
                    }}
                  >
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 13,
                    color: "#f0ece0",
                    fontWeight: 500,
                  }}
                >
                  {client.name.split(" ")[0]}
                </span>
                <button
                  onClick={handleLogout}
                  title="Sair"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#888070",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <LogOut size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pb-12">
        {view === "client" ? (
          <ClientView
            barbers={BARBERS}
            services={SERVICES}
            timeSlots={TIME_SLOTS}
            appointments={appointments}
            client={client!}
            onBook={handleBook}
          />
        ) : (
          <BarberView
            barbers={BARBERS}
            appointments={appointments}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </main>
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded transition-all"
      style={{
        background: active ? "rgba(201,168,76,0.15)" : "transparent",
        border: active
          ? "1px solid rgba(201,168,76,0.4)"
          : "1px solid transparent",
        color: active ? "#c9a84c" : "#888070",
        fontFamily: "Inter, sans-serif",
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
