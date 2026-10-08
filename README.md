# 💈 BarberHouse — Front-end

Aplicação web (mobile first) para uma barbearia de bairro: o cliente escolhe o serviço, o barbeiro e o horário, recebe uma **senha de papel** com a posição na fila, e o barbeiro toca o atendimento pela **folha do balcão**.

> 🚧 **Funcional de ponta a ponta contra a API, mas ainda não pronto para clientes reais.** O que falta é segurança, operação e conformidade, não funcionalidade. O caminho até a produção, com veredito de viabilidade, está em [Rumo à produção](#-rumo-à-produção).

O back-end que este projeto consome fica no repositório **Barbearia - API** (Spring Boot + MySQL). Este front **não funciona sem ele**.

## Sumário

- [Visão geral](#-visão-geral)
- [Tecnologias](#️-tecnologias)
- [Como rodar](#️-como-rodar)
- [Configuração](#️-configuração)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Integração com a API](#-integração-com-a-api)
- [Identidade visual](#-identidade-visual)
- [Qualidade](#-qualidade)
- [Rumo à produção](#-rumo-à-produção)
- [Limitações conhecidas](#️-limitações-conhecidas)

---

## 🎯 Visão geral

### Cliente

1. **Entra** com nome e telefone (DDD + 9 dígitos). Se o telefone já tem cadastro, entra com o nome cadastrado; se não, o cadastro é criado na hora.
2. **Agenda em 4 passos:** serviço (tabela de preços) → barbeiro (com quantos estão na frente) → horário (agenda de papel, ocupados riscados) → confirmação.
3. **Recebe a senha** com o número da posição, o serviço, o barbeiro e o horário, e vê a fila daquele barbeiro com a própria linha destacada.
4. É **avisado** ("você é o próximo!") por uma faixa na tela e, se permitir, por notificação do navegador.

### Barbeiro

1. Clica em **"Sou barbeiro"** e digita a **senha de 6 dígitos** (cada senha identifica um barbeiro; quem confere é a API).
2. Vê a **folha do balcão**: resumo em uma linha ("3 esperando · 1 na cadeira · 2 marcados · 5 atendidos hoje") e a lista de horários com cliente e serviço.
3. Age em cada linha com **Iniciar**, **Concluir** ou **Cancelar**. A API valida a ordem da fila e as transições, e a mensagem de erro dela aparece na tela.

---

## 🛠️ Tecnologias

| Área               | Tecnologia                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------- |
| UI                 | React 19 + TypeScript                                                                         |
| Build / dev server | Vite 8                                                                                        |
| Estilo             | Tailwind CSS v4 (tokens em CSS, sem estilos inline)                                           |
| Animação           | `motion` (só na troca de passo, na senha e na notificação; respeita `prefers-reduced-motion`) |
| Fontes             | Alfa Slab One (letreiro) e Work Sans (corpo), via Google Fonts                                |
| Qualidade          | ESLint (typescript-eslint, react-hooks)                                                       |

Sem biblioteca de estado, de rotas ou de requisições: o estado fica no `App.tsx` e o acesso à API é um `fetch` simples (`src/app/api.ts`).

---

## ▶️ Como rodar

**Pré-requisitos:** Node.js (desenvolvido com a v24) e a **API rodando** em `http://localhost:8080` (veja o README da API: precisa de JDK 21 e MySQL 8).

```bash
npm install
npm run dev        # http://localhost:5173
```

Suba a API antes de abrir o front. Sem ela, a tela mostra "A barbearia não abriu" com o botão **Tentar de novo**.

> Use a porta **5173**: é a única origem que a API libera por CORS por padrão (`CORS_ALLOWED_ORIGINS`).

| Comando           | O que faz                                        |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Servidor de desenvolvimento                      |
| `npm run build`   | Checa os tipos (`tsc -b`) e gera `dist/`         |
| `npm run lint`    | ESLint em todo o projeto                         |
| `npm run preview` | Serve o `dist/` localmente para conferir o build |

O primeiro acesso exige barbeiros e serviços cadastrados na API. Os barbeiros também precisam de senha (na API, via `BARBEIROS_SENHAS_INICIAIS`). Veja o README da API.

---

## ⚙️ Configuração

| Variável       | Padrão                  | Descrição       |
| -------------- | ----------------------- | --------------- |
| `VITE_API_URL` | `http://localhost:8080` | URL base da API |

Copie `.env.example` para `.env.local` (ignorado pelo git) para mudar o valor.

> ⚠️ Variáveis `VITE_*` são **gravadas no JavaScript na hora do build**, não lidas em tempo de execução. Para produção, faça o build já com a URL final (`VITE_API_URL=https://api.seudominio.com npm run build`). **Nunca coloque segredos em variáveis `VITE_*`:** qualquer pessoa consegue ler o que está no bundle.
>
> Se você ainda tem `VITE_BARBER_PINS` no `.env.local` (de uma versão anterior que conferia a senha no navegador), pode apagar: o código não usa mais.

---

## 📁 Estrutura do projeto

```
src/
├── main.tsx                  Ponto de entrada
├── app/
│   ├── App.tsx               Estado global, carga e atualização periódica da API, header, notificação
│   ├── api.ts                Cliente HTTP da API + conversão dos DTOs para os tipos do front
│   ├── queue.ts              Ordem da fila, datas locais e relógio (useNow)
│   ├── auth.ts               Perfil do cliente no localStorage (hoje sempre limpo ao abrir)
│   ├── barberAuth.ts         Tamanho da senha do barbeiro (a conferência é na API)
│   ├── types.ts              Tipos do domínio (Barber, Service, Appointment, ClientProfile...)
│   └── components/
│       ├── LoginScreen.tsx   Entrada do cliente
│       ├── ClientView.tsx    Agendamento em 4 passos, senha e fila
│       ├── BarberLogin.tsx   Tela de senha do barbeiro
│       ├── BarberView.tsx    Folha do balcão
│       ├── Brand.tsx         Letreiro (wordmark) e iniciais
│       └── ui/               Kit shadcn de referência, NÃO usado e fora do tsc/eslint
└── styles/
    ├── theme.css             Paleta, tipografia e classes (.btn, .ticket, .pole-stripes...)
    ├── fonts.css             Google Fonts
    ├── tailwind.css          Configuração do Tailwind
    └── index.css             Importa os demais
```

---

## 🔌 Integração com a API

| Ação na tela                  | Chamada                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| Entrar (cliente)              | `GET /clientes/telefone/{numero}`; se `404 CLIENTE_NAO_ENCONTRADO`, `POST /clientes` |
| Carga inicial                 | `GET /barbeiros?ativos=true`, `GET /servicos?ativos=true`, `GET /agendamentos`       |
| Atualização da fila           | `GET /agendamentos` a cada **5 s** (polling)                                         |
| Marcar horário                | `POST /agendamentos`                                                                 |
| Entrar (barbeiro)             | `POST /barbeiros/login` (`401` senha errada, `429` bloqueado)                        |
| Iniciar / Concluir / Cancelar | `PATCH /agendamentos/{id}/status`                                                    |

Decisões que ajudam a entender o código:

- **Status:** `AGENDADO` e `AGUARDANDO` aparecem como "aguardando"; `AGENDADO` ganha `scheduled: true` (é um horário marcado que a API ainda não colocou na fila; o job dela faz isso quando o horário chega, em até 60 s). Por isso a folha mostra "marcado" e esconde o **Iniciar** nesses casos.
- **Quem é quem:** o cliente é identificado por `clientId` (nomes podem repetir).
- **Ordem da fila:** quem já chegou vale pela `horaChegada` (é o que a API usa); horário marcado vale pela data/hora marcada.
- **Grade de horários:** a API não tem esse conceito, então a grade (08:00–11:30 e 14:00–18:30, de 30 em 30 min) fica em `TIME_SLOTS` no `App.tsx`. Horários que já passaram ficam riscados, e **depois do último horário do dia a agenda mostra os de amanhã** (a API só aceita datas futuras).
- **Barbeiro sem dados extras:** a API não tem especialidade, nota nem foto. A UI esconde o que vem vazio.
- **Erros:** toda resposta de erro da API (`mensagem`, `erros[]`) vira texto na tela; falha de rede vira "Não consegui falar com a barbearia".
- **Histórico:** a folha do barbeiro mostra a fila em aberto e só os atendidos **de hoje**, porque a API devolve todo o histórico.

---

## 🎨 Identidade visual

Barbearia old-school de bairro: **letreiro pintado, tabela de preços na parede, senha de papel do balcão.** O objetivo foi não parecer um SaaS/dashboard.

- **Paleta:** papel `#f3ece0`, tinta `#1a1714`, vermelho de barber pole `#b3261e`, azul marinho `#1f3a5f`. Sem dourado, gradiente ou glow.
- **Tokens:** em `src/styles/theme.css` (variáveis CSS + `@theme` do Tailwind: `bg-paper`, `text-ink`, `text-pole-red`, `font-display`...). Nada de cor hardcoded nos componentes.
- **Motivos:** listras de barber pole (só no topo, na notificação e na senha), bordas sólidas de 2px, cantos de 2 a 4px, senha com picote serrilhado (CSS mask), horário ocupado riscado.
- **Acessibilidade:** foco visível em tudo, alvos de toque de pelo menos 44 px, botões sempre com texto, campos com `label` e erros anunciados (`role="alert"`). Todos os pares de cor de texto e fundo foram calculados e passam em AA (mínimo de 4,5:1; o pior caso é o vermelho sobre `paper-2`, 4,95:1), mas **não houve auditoria com leitor de tela ou Lighthouse** (veja [Rumo à produção](#-rumo-à-produção)).

---

## ✅ Qualidade

- `npm run build` e `npm run lint` passam.
- **Não há testes automatizados no repositório.** O fluxo (login, 4 passos, senha, folha do barbeiro, login por senha com bloqueio) foi validado com roteiros de navegador (Edge headless) contra a API real, em 360 px de largura, mas esses roteiros **não estão versionados**.
- A pasta `src/app/components/ui` (kit shadcn de referência) está **excluída** do `tsc` e do ESLint, porque depende de pacotes que não estão instalados e não é usada.

---

## 🚀 Rumo à produção

A ideia é colocar o sistema numa barbearia de verdade, com clientes de verdade, como prova de fogo.

### Veredito: viável, em etapas

**Sim, é viável**, e a ideia de um piloto real é boa: o porte (uma barbearia, poucos barbeiros, uma instância da API) cabe com folga no que o sistema suporta, e a parte funcional (fila por barbeiro, concorrência, tempo real, migrations) está sólida e coberta por testes no back-end. **Mas não no estado atual**, e o motivo não é funcionalidade: é que hoje **qualquer pessoa que descubra a URL da API consegue ler e alterar tudo**.

| Etapa                                    | Situação                          |
| ---------------------------------------- | --------------------------------- |
| Demonstração / uso local                 | ✅ Pronto                         |
| Staging com dados fictícios, em HTTPS    | ✅ Pode subir já                  |
| **Piloto com clientes reais**            | ⛔ Só depois da **Fase 1** abaixo |
| Operação contínua, mais de uma barbearia | Depois das Fases 2 e 3            |

**Recomendação:** concluir a Fase 1, rodar um **piloto controlado** (um barbeiro ou uma barbearia, uns 15 dias, **mantendo a fila no papel como plano B**) e só então abrir para todos. Itens marcados com 🔗 dependem do **repositório da API** (o README dela tem a lista completa do lado do servidor).

### Fase 1 — Bloqueadores (antes de qualquer cliente real)

- [ ] 🔗 **Autenticação na API.** Hoje o login do barbeiro é conferido de verdade (senha com hash, bloqueio após erros), **mas não gera token**, e o resto da API é aberto (`SecurityConfig` com `permitAll`). Na prática, o login só protege a _tela_: quem chamar a API direto lista os clientes (nome e telefone), apaga cadastros e finaliza ou cancela atendimentos dos outros. A API precisa devolver um token no login e exigi-lo nas rotas do balcão; o front precisa guardá-lo, enviar `Authorization` e tratar `401`.
- [ ] 🔗 **Identificação do cliente.** Hoje basta saber o telefone de alguém para entrar como ela. Definir o mínimo aceitável para o piloto (ex.: código por WhatsApp/SMS, ou link/QR da própria barbearia) e fazer o cliente só enxergar **a própria reserva**.
- [ ] 🔗 **Parar de baixar o histórico de todo mundo.** O front chama `GET /agendamentos` a cada 5 s em **todo** navegador, o que entrega nome e horário de todos os clientes a qualquer visitante, e piora a cada dia que o histórico cresce. Precisa de endpoints escopados (a minha reserva; a fila do meu barbeiro só com primeiro nome) e, de preferência, do WebSocket que a API já publica (`/topic/fila/{barbeiroId}`) no lugar do polling.
- [ ] **HTTPS e domínio.** Front e API em HTTPS (um front em HTTPS **não consegue** chamar uma API em HTTP). Build com `VITE_API_URL` apontando para a API real e `CORS_ALLOWED_ORIGINS` da API com o domínio do front.
- [ ] **LGPD.** O cadastro coleta nome e telefone, e hoje não há aviso nem consentimento na tela de entrada. Incluir texto de privacidade, contato para pedir exclusão (a API já anonimiza) e confirmar o prazo de retenção (90 dias de inatividade). As fontes vêm do Google Fonts, que recebe o IP do visitante: hospedar as fontes junto do app (ex.: `@fontsource`).
- [ ] **O aviso "você é o próximo" não é confiável como está.** O app **pausa a atualização quando a aba fica em segundo plano** (justamente quando o cliente está com o celular no bolso), a permissão de notificação é pedida fora de um clique (navegadores costumam bloquear) e o iPhone só aceita notificações em PWA instalado. Para o piloto: avisar claramente na tela "deixe esta tela aberta" e/ou combinar que o barbeiro chama o cliente em voz alta. A solução de verdade está na Fase 2.
- [ ] **Sessão do cliente.** Hoje recarregar a página (ou o celular descartar a aba) **desloga** o cliente e ele perde a tela da senha. A linha comentada em `App.tsx` mostra como restaurar o perfil do `localStorage`, mas isso só deve ser feito junto com a identificação segura acima.
- [ ] **Conteúdo real no lugar de placeholder.** O letreiro diz **"Barbearia de bairro · desde 2019"** (`Brand.tsx`), um texto de exemplo que não corresponde a nenhum dado real: trocar pelo nome e informações verdadeiras da barbearia. Revisar também as frases da tela de entrada, o `<title>` e a descrição.
- [ ] **Grade real de horários.** `TIME_SLOTS` e a estimativa de espera (30 min por pessoa) são valores fixos. Alinhar com o expediente real, almoço e a duração de cada serviço.
- [ ] 🔗 **Backup e senhas.** Backup diário do MySQL **com teste de restauração**, usuário de banco dedicado (não `root`), profile `prod` na API (sem log de SQL nem Swagger aberto) e senhas dos barbeiros trocadas.

### Fase 2 — Operação (para manter no ar com confiança)

- [ ] **Deploy.** O front é estático (`dist/`): serve em qualquer hospedagem estática (Netlify, Vercel, Cloudflare Pages, Nginx). Como não há rotas internas, não precisa de regra de reescrita. Adicionar cabeçalhos de segurança (CSP, `X-Content-Type-Options`...).
- [ ] **CI no GitHub Actions** rodando `npm run lint` e `npm run build` a cada push/PR (a API já tem testes; o front ainda não tem nada rodando).
- [ ] **Testes.** Unitários para `queue.ts` e para as conversões de `api.ts` (Vitest), e transformar os roteiros de navegador em testes E2E versionados (Playwright).
- [ ] **Avisos de verdade:** WebSocket no lugar do polling e **PWA** com notificação push (ou aviso por WhatsApp). Pedir a permissão de notificação em um clique do usuário.
- [ ] **Monitoramento de erros** no navegador (ex.: Sentry) e um _error boundary_: hoje uma exceção de renderização deixa a tela em branco.
- [ ] **Fuso horário.** O front monta `dataHora` com o relógio do navegador e a API usa `LocalDateTime` do servidor, sem fuso. Em hospedagem na nuvem (UTC) os horários podem ficar deslocados; fixar o fuso (ex.: `America/Recife`) na API e no banco.
- [ ] **QA em aparelhos reais:** testar em 2 ou 3 celulares (Android e iPhone), com leitor de tela, Lighthouse e teclado. Até agora só houve teste automatizado em janela de 360 px.
- [ ] **Limpeza de dependências.** `react-router-dom` e `lucide-react` estão instalados e **não são usados**; `src/app/components/ui` (48 arquivos) é peso morto. Remover.
- [ ] **Gestão sem Swagger.** Barbeiros e serviços só podem ser cadastrados e editados pela API (Swagger). Um painel simples de administração ajuda no dia a dia da barbearia.
- [ ] **Decidir sobre indexação.** O `index.html` tem `noindex, nofollow` (bom para o piloto); remover quando o site for público.

### Fase 3 — Evolução

- [ ] O cliente **cancelar a própria reserva** e ver o histórico (hoje a tela não tem botão de cancelar para o cliente).
- [ ] Conflito de horário entre agendamentos do mesmo barbeiro e serviços por barbeiro (limites da API hoje).
- [ ] Barbeiros com foto e especialidade (a UI já esconde o que não existe, e os campos aparecem sozinhos quando a API passar a mandá-los).
- [ ] Mais de uma barbearia (multi-tenant) e métricas de negócio (tempo médio de espera, atendimentos por barbeiro).

### Como acompanhar

Transformar cada item em uma **issue** do GitHub agrupadas em milestones (`Fase 1 — Piloto`, `Fase 2 — Operação`, `Fase 3 — Evolução`), e marcar aqui no README conforme forem concluídos.

---

## ⚠️ Limitações conhecidas

- A atualização da fila é por **polling de 5 s** e só enquanto a aba está visível.
- O login do cliente é só por telefone, e a sessão **não sobrevive a um recarregamento** (de propósito, em `App.tsx`).
- Quem usa "Sou barbeiro" não recebe token: a API não exige autenticação nas demais rotas.
- A espera estimada é fixa (30 min por pessoa na frente), não usa a duração do serviço.
- Horário marcado não entra na fila na hora: só quando o horário chega. O "Nº 1" da senha de um horário futuro é uma estimativa.
- A folha do barbeiro para o dia seguinte mostra os horários marcados de amanhã junto da fila de hoje.
- Se a API tiver agendamentos antigos em `AGUARDANDO` (de testes), eles continuam aparecendo na fila até serem cancelados.
