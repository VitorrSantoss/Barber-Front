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
}
