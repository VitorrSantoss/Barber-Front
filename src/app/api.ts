import type { Appointment, Barber, ClientProfile, Service } from "./types";

// Cliente HTTP da barbearia_api. Em dev a API libera http://localhost:5173 por CORS;
// para outra origem, ajuste CORS_ALLOWED_ORIGINS na API e VITE_API_URL aqui.
const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8080").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  codigo?: string;

  constructor(message: string, status: number, codigo?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.codigo = codigo;
  }
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Algo deu errado. Tente de novo.";
}

async function request<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: init?.method ?? "GET",
      headers: init?.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError("Não consegui falar com a barbearia. Confira sua conexão e tente de novo.", 0);
  }

  if (!res.ok) {
    // A API devolve { mensagem, codigo, erros[] } em qualquer erro.
    const body = (await res.json().catch(() => null)) as
      | { mensagem?: string; codigo?: string; erros?: string[] }
      | null;
    const detalhes = body?.erros?.length ? ` ${body.erros.join(" ")}` : "";
    throw new ApiError(
      (body?.mensagem ?? "A barbearia não conseguiu atender o pedido.") + detalhes,
      res.status,
      body?.codigo,
    );
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

// ───────────────────────────── DTOs da API ─────────────────────────────

interface ClienteDTO {
  id: number;
  nome: string;
  numero: string;
  dataCadastro: string;
}

interface BarbeiroDTO {
  id: number;
  nome: string;
}

interface ServicoDTO {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
  duracaoMinutos: number;
}

type StatusAPI = "AGENDADO" | "AGUARDANDO" | "EM_ATENDIMENTO" | "FINALIZADO" | "CANCELADO";

interface AgendamentoDTO {
  id: number;
  clienteId: number;
  nomeCliente: string;
  barbeiroId: number;
  nomeBarbeiro: string;
  servicoId: number | null;
  nomeServico: string | null;
  dataHora: string;
  status: StatusAPI;
  horaChegada: string | null;
}

// ───────────────────────────── Mapeamentos ─────────────────────────────

const STATUS_FROM_API: Record<StatusAPI, Appointment["status"]> = {
  AGENDADO: "aguardando",
  AGUARDANDO: "aguardando",
  EM_ATENDIMENTO: "em_atendimento",
  FINALIZADO: "concluido",
  CANCELADO: "cancelado",
};

const STATUS_TO_API: Record<Exclude<Appointment["status"], "aguardando">, StatusAPI> = {
  em_atendimento: "EM_ATENDIMENTO",
  concluido: "FINALIZADO",
  cancelado: "CANCELADO",
};

function formatPhone(digits: string): string {
  return digits.length === 11
    ? `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    : digits;
}

function toProfile(dto: ClienteDTO): ClientProfile {
  return {
    id: String(dto.id),
    name: dto.nome,
    phone: formatPhone(dto.numero),
    memberSince: new Date(dto.dataCadastro).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    totalVisits: 0, // as visitas vêm dos atendimentos finalizados na lista de agendamentos
  };
}

function toBarber(dto: BarbeiroDTO): Barber {
  // A API ainda não tem especialidade, nota nem avatar; a UI esconde o que vier vazio.
  return { id: String(dto.id), name: dto.nome, specialty: "", rating: 0, reviews: 0, avatar: "" };
}

function toService(dto: ServicoDTO): Service {
  return {
    id: String(dto.id),
    name: dto.nome,
    price: Number(dto.preco),
    duration: dto.duracaoMinutos,
    description: dto.descricao ?? "",
    emoji: "",
  };
}

function toAppointment(dto: AgendamentoDTO): Appointment {
  return {
    id: String(dto.id),
    clientId: String(dto.clienteId),
    clientName: dto.nomeCliente,
    serviceId: dto.servicoId === null ? "" : String(dto.servicoId),
    serviceName: dto.nomeServico ?? "Serviço não informado",
    barberId: String(dto.barbeiroId),
    barberName: dto.nomeBarbeiro,
    time: dto.dataHora.slice(11, 16),
    dateTime: dto.dataHora,
    arrivedAt: dto.horaChegada ?? undefined,
    scheduled: dto.status === "AGENDADO",
    status: STATUS_FROM_API[dto.status],
  };
}

// ───────────────────────────── Chamadas ─────────────────────────────

/** Entra pelo telefone; se ainda não existe cadastro, cria na hora. */
export async function entrarOuCadastrar(nome: string, numero: string): Promise<ClientProfile> {
  try {
    return toProfile(await request<ClienteDTO>(`/clientes/telefone/${numero}`));
  } catch (err) {
    if (!(err instanceof ApiError) || err.codigo !== "CLIENTE_NAO_ENCONTRADO") throw err;
  }
  return toProfile(await request<ClienteDTO>("/clientes", { method: "POST", body: { nome, numero } }));
}

export async function listarBarbeiros(): Promise<Barber[]> {
  return (await request<BarbeiroDTO[]>("/barbeiros?ativos=true")).map(toBarber);
}

export async function listarServicos(): Promise<Service[]> {
  return (await request<ServicoDTO[]>("/servicos?ativos=true")).map(toService);
}

export async function listarAgendamentos(): Promise<Appointment[]> {
  return (await request<AgendamentoDTO[]>("/agendamentos")).map(toAppointment);
}

export async function criarAgendamento(dados: {
  clienteId: string;
  barbeiroId: string;
  servicoId: string;
  dataHora: string;
}): Promise<void> {
  await request<AgendamentoDTO>("/agendamentos", {
    method: "POST",
    body: {
      clienteId: Number(dados.clienteId),
      barbeiroId: Number(dados.barbeiroId),
      servicoId: Number(dados.servicoId),
      dataHora: dados.dataHora,
    },
  });
}

export async function atualizarStatus(
  id: string,
  status: Exclude<Appointment["status"], "aguardando">,
): Promise<void> {
  await request<AgendamentoDTO>(`/agendamentos/${id}/status`, {
    method: "PATCH",
    body: { novoStatus: STATUS_TO_API[status] },
  });
}

/** Login do balcão: a senha de 6 dígitos identifica o barbeiro. Erros: 401 (senha errada), 429 (bloqueio). */
export async function loginBarbeiro(senha: string): Promise<Barber> {
  return toBarber(await request<BarbeiroDTO>("/barbeiros/login", { method: "POST", body: { senha } }));
}
