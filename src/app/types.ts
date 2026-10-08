export interface ClientProfile {
  id: string;
  name: string;
  phone: string;
  memberSince: string;
  totalVisits: number;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  emoji: string;
}

export interface Barber {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  avatar: string;
}

export interface TimeSlot {
  id: string;
  time: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  barberId: string;
  barberName: string;
  time: string;
  status: "aguardando" | "em_atendimento" | "concluido" | "cancelado";
  /** Id do cliente na API (identifica a pessoa, já que nomes podem repetir). */
  clientId?: string;
  /** dataHora da API, ISO local sem fuso (ex: 2026-10-05T14:30:00). */
  dateTime?: string;
  /** horaChegada da API: define a ordem real da fila. */
  arrivedAt?: string;
  /** Horário marcado que ainda não entrou na fila (AGENDADO na API). */
  scheduled?: boolean;
}
