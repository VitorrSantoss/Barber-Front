import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { ClientView } from "./components/ClientView";
import { BarberView } from "./components/BarberView";
import { LoginScreen } from "./components/LoginScreen";
import { BarberLogin } from "./components/BarberLogin";
import { Wordmark } from "./components/Brand";
import { clearProfile } from "./auth";
import {
  atualizarStatus,
  criarAgendamento,
  errorMessage,
  listarAgendamentos,
  listarBarbeiros,
  listarServicos,
} from "./api";
import { compareQueue, isActive, localDate, toDateTime } from "./queue";
import type {
  Service,
  Barber,
  TimeSlot,
  Appointment,
  ClientProfile,
} from "./types";

// A API não tem conceito de grade de horários: o expediente fica aqui.
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

// Intervalo da atualização automática da fila (a API também tem WebSocket,
// mas o polling dispensa dependência nova e basta para esta tela).
const POLL_MS = 5000;

type ViewMode = "client" | "barber";
type LoadState = "loading" | "ready" | "error";

function getQueuePosition(
  clientId: string,
  barberId: string,
  appointments: Appointment[],
): number | null {
  const queue = appointments
    .filter((a) => a.barberId === barberId && isActive(a))
    .sort(compareQueue);
  const idx = queue.findIndex((a) => a.clientId === clientId);
  return idx === -1 ? null : idx + 1;
}

export default function App() {
  const [view, setView] = useState<ViewMode>("client");
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  // Sempre inicia deslogado, para abrir na tela de login a cada carregamento.
  // Se no futuro quiser voltar a "lembrar" o cliente entre sessões,
  // troque para: useState<ClientProfile | null>(() => loadProfile())
  const [client, setClient] = useState<ClientProfile | null>(null);
  // Barbeiro autenticado pela senha de 6 dígitos (só em memória, como o cliente).
  const [barber, setBarber] = useState<Barber | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const prevPositionRef = useRef<number | null>(null);

  // Garante que qualquer sessão anterior salva no navegador seja limpa
  useEffect(() => {
    clearProfile();
  }, []);

  const refreshAppointments = useCallback(async () => {
    try {
      setAppointments(await listarAgendamentos());
    } catch {
      // Falha momentânea de rede: mantém a última fila e tenta no próximo ciclo.
    }
  }, []);

  // Carga inicial (barbeiros, serviços, fila) + atualização periódica da fila
  useEffect(() => {
    let cancelled = false;
    Promise.all([listarBarbeiros(), listarServicos(), listarAgendamentos()])
      .then(([b, s, a]) => {
        if (cancelled) return;
        setBarbers(b);
        setServices(s);
        setAppointments(a);
        setLoadState("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(errorMessage(err));
        setLoadState("error");
      });

    const id = setInterval(() => {
      if (document.visibilityState === "visible") void refreshAppointments();
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [refreshAppointments, reloadKey]);

  // Watch queue position and fire notification when client becomes next
  useEffect(() => {
    if (!client) return;

    const myAppt = appointments.find((a) => a.clientId === client.id && isActive(a));
    if (!myAppt) {
      prevPositionRef.current = null;
      return;
    }

    const pos = getQueuePosition(client.id, myAppt.barberId, appointments);

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
        new Notification("BarberHouse", { body: msg, icon: "/favicon.svg" });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted")
            new Notification("BarberHouse", { body: msg, icon: "/favicon.svg" });
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

  const handleBarberLogout = () => {
    setBarber(null);
    setView("client");
  };

  // Erros sobem para a tela de confirmação, que mostra a mensagem da API.
  const handleBook = async (data: Omit<Appointment, "id" | "status">) => {
    if (!client) return;
    await criarAgendamento({
      clienteId: client.id,
      barbeiroId: data.barberId,
      servicoId: data.serviceId,
      dataHora: data.dateTime ?? toDateTime(localDate(new Date()), data.time),
    });
    await refreshAppointments();
  };

  const handleUpdateStatus = async (id: string, status: Appointment["status"]) => {
    if (status === "aguardando") return;
    try {
      await atualizarStatus(id, status);
      setActionError(null);
    } catch (err) {
      setActionError(errorMessage(err));
    }
    await refreshAppointments();
  };

  const firstName = client?.name.split(" ")[0] ?? "";

  return (
    <MotionConfig reducedMotion="user">
      {/* Show login only for client view */}
      {view === "client" && !client ? (
        <LoginScreen onLogin={handleLogin} onBarber={() => setView("barber")} />
      ) : (
        <div className="min-h-screen bg-paper text-ink">
          {/* Notification banner */}
          <AnimatePresence>
            {notification && (
              <motion.div
                role="status"
                initial={{ y: "-100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className="pole-stripes fixed inset-x-0 top-0 z-50 p-2"
              >
                <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-sm border-2 border-ink bg-paper py-2 pl-4 pr-2">
                  <p className="font-display text-lg leading-tight sm:text-xl">{notification}</p>
                  <button onClick={() => setNotification(null)} className="btn-text shrink-0">
                    Fechar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <header className="sticky top-0 z-10 border-b-2 border-ink bg-paper">
            <div className="pole-stripes h-1.5" aria-hidden="true" />
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
              <Wordmark />
              <nav aria-label="Conta e modo" className="flex flex-wrap items-center justify-end gap-x-1 text-sm">
                {client && view === "client" && (
                  <>
                    <span className="px-2 text-ink-soft">
                      <span className="sr-only">Logado como </span>
                      {firstName}
                    </span>
                    <button onClick={handleLogout} className="btn-text">
                      Sair
                    </button>
                    <span aria-hidden="true" className="text-rule">
                      |
                    </span>
                  </>
                )}
                {view === "client" ? (
                  <button onClick={() => setView("barber")} className="btn-text text-navy">
                    Sou barbeiro <span aria-hidden="true">→</span>
                  </button>
                ) : barber ? (
                  <>
                    <span className="px-2 text-ink-soft">
                      <span className="sr-only">Barbeiro logado: </span>
                      {barber.name.split(" ")[0]}
                    </span>
                    <button onClick={handleBarberLogout} className="btn-text">
                      Sair
                    </button>
                  </>
                ) : (
                  <button onClick={() => setView("client")} className="btn-text text-navy">
                    <span aria-hidden="true">←</span> Voltar pro cliente
                  </button>
                )}
              </nav>
            </div>
          </header>

          {actionError && (
            <div role="alert" className="border-b-2 border-ink bg-paper-2">
              <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2">
                <p className="font-medium text-pole-red">{actionError}</p>
                <button onClick={() => setActionError(null)} className="btn-text shrink-0">
                  Fechar
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <main className="pb-16">
            {loadState === "loading" && (
              <p role="status" className="px-4 py-16 text-center text-ink-soft">
                Abrindo a barbearia…
              </p>
            )}

            {loadState === "error" && (
              <div role="alert" className="mx-auto max-w-md px-4 py-16 text-center">
                <p className="font-display text-xl">A barbearia não abriu.</p>
                <p className="mt-2 text-ink-soft">{loadError}</p>
                <button
                  onClick={() => {
                    setLoadState("loading");
                    setReloadKey((k) => k + 1);
                  }}
                  className="btn btn-ink mt-6"
                >
                  Tentar de novo
                </button>
              </div>
            )}

            {loadState === "ready" &&
              (view === "client" ? (
                <ClientView
                  barbers={barbers}
                  services={services}
                  timeSlots={TIME_SLOTS}
                  appointments={appointments}
                  client={client!}
                  onBook={handleBook}
                />
              ) : barber ? (
                <BarberView
                  barber={barber}
                  appointments={appointments}
                  onUpdateStatus={handleUpdateStatus}
                />
              ) : (
                <BarberLogin onLogin={setBarber} onBack={() => setView("client")} />
              ))}
          </main>
        </div>
      )}
    </MotionConfig>
  );
}
