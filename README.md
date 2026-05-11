# CRM para Condomínios

Plataforma web para centralizar atendimento, ocorrências, comunicação e automação de alertas em condomínios. Substitui a operação informal por WhatsApp por uma central estruturada com triagem, escalonamento, auditoria e SLA.

> **Status:** MVP funcional — backend, frontend, banco modelado, autenticação JWT, CRUDs, ocorrências, alertas, regras de escalonamento e dashboard operacionais. Integração com WhatsApp via Evolution API e inteligência artificial (Google Gemini) para atendimento automático e triagem 24/7.

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Subir o projeto com Docker (recomendado)](#subir-o-projeto-com-docker-recomendado)
- [Rodar em modo desenvolvimento](#rodar-em-modo-desenvolvimento)
- [Credenciais padrão](#credenciais-padrão)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Endpoints principais](#endpoints-principais)
- [Documentação adicional](#documentação-adicional)
- [Deploy](#deploy)

---

## Funcionalidades

- **Multi-tenant por condomínio** — isolamento via `condominium_id` em todas as entidades.
- **Cadastros completos** — Condomínios, Blocos, Unidades, Moradores, Usuários Internos.
- **Atendimento e ocorrências** — Conversas, mensagens, ocorrências com status, prioridade, categorias e responsáveis.
- **Automação operacional** — Horário comercial, triagem automática, regras de escalonamento, alertas críticos.
- **Integração WhatsApp & IA** — Atendimento 24/7 com agente de IA (Google Gemini) para triagem, e comunicação real via Evolution API.
- **Dashboard de KPIs** — Métricas operacionais em tempo real com visual premium (Bento-Grid).
- **Auditoria** — Log completo de ações sensíveis e rastreabilidade para administradores.
- **RBAC Avançado** — Papéis padrão (`SUPER_ADMIN`, `SINDICO`, `ATENDENTE`, `MORADOR`) e criação de funções customizadas (Custom Roles) com permissões granulares.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS v4, shadcn/ui + Radix |
| Backend | NestJS 11, TypeScript, Prisma ORM 5 |
| Banco | PostgreSQL 16 |
| Cache / Filas | Redis 7 (provisionado, BullMQ pronto para uso) |
| Auth | JWT + Refresh Token + bcrypt + RBAC |
| IA & Mensageria | Google Gemini API, Evolution API (WhatsApp) |
| Infra | Docker, Docker Compose |
| API Docs | Swagger / OpenAPI |

---

## Arquitetura

```
┌────────────┐       ┌──────────────┐       ┌────────────────┐
│  Frontend  │ ◄───► │   Backend    │ ◄───► │   PostgreSQL   │
│  Next.js   │  HTTP │   NestJS     │ Prisma│   16-alpine    │
│  :3000     │       │   :3001      │       └────────────────┘
└────────────┘       │              │       ┌────────────────┐
                     │   ┌──────┐   │ ◄───► │     Redis      │
                     │   │ AI   │   │       │   (filas)      │
                     │   └──────┘   │       └────────────────┘
                     └──────────────┘               ▲
                            ▲ │                     │
                        HTTP│ │HTTP                 │
                            │ ▼                     │
                     ┌──────────────┐       ┌───────┴────────┐
                     │ Evolution API│       │  Google Gemini │
                     │  (WhatsApp)  │       │  (AI Agent)    │
                     └──────────────┘       └────────────────┘
```

---

## Pré-requisitos

- **Docker** 24+ e **Docker Compose** v2
- **Node.js** 20+ (apenas para rodar fora de Docker)
- **Git**

---

## Subir o projeto com Docker (recomendado)

Esta é a forma homologada e a mesma usada em produção.

**Para usuários do Windows:**
Você pode utilizar o script interativo `iniciar-crm.bat` localizado na raiz do projeto. Ele automatiza as verificações de dependências, inicia os containers, mostra logs em tempo real e cuida da resiliência do ambiente de forma simplificada. Basta dar um duplo clique ou rodar no terminal:
```cmd
.\iniciar-crm.bat
```

**Para usuários de Linux/macOS ou setup manual:**

```bash
# 1. Clonar o repositório
git clone https://github.com/VitorMarcelli/CRM_Condominios.git
cd CRM_Condominios

# 2. Copiar o arquivo de variáveis de ambiente
cp .env.example .env
# Edite .env e troque os secrets de produção (JWT_SECRET, POSTGRES_PASSWORD, etc.)

# 3. Subir toda a stack (Postgres, Redis, Backend, Frontend)
docker compose up -d --build

# 4. Rodar o seed inicial (cria SUPER_ADMIN + dados de exemplo)
docker compose exec backend node dist/prisma/seed.js
```

As migrations Prisma rodam automaticamente no boot do backend.

### Acessos

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Swagger / OpenAPI | http://localhost:3001/api/docs |
| Health check | http://localhost:3001/health |

### Comandos úteis

```bash
docker compose ps              # status dos containers
docker compose logs -f backend # logs do backend
docker compose logs -f frontend
docker compose down            # derruba a stack
docker compose down -v         # derruba e apaga o volume do banco
```

---

## Rodar em modo desenvolvimento

Para hot-reload durante o desenvolvimento.

### Backend

```bash
cd backend
cp ../.env.example .env
# Edite DATABASE_URL para apontar para Postgres (local ou container)

npm install
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
# API em http://localhost:3001
```

### Frontend

```bash
cd frontend
# .env.local já está configurado para apontar para localhost:3001

npm install
npm run dev
# UI em http://localhost:3000
```

### Banco e Redis avulsos via Docker

Se quiser apenas o Postgres e o Redis em container e rodar app local:

```bash
docker compose up -d postgres redis
```

---

## Credenciais padrão

Após rodar o seed:

| Papel | Email | Senha |
|---|---|---|
| Super Admin | `admin@crmcondominios.com` | `Admin@123456` |

> ⚠️ **Troque essas credenciais antes de qualquer ambiente além de desenvolvimento local.** Use as variáveis `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` e `SEED_ADMIN_NAME` no `.env`.

---

## Estrutura do repositório

```
.
├── backend/                    # API NestJS
│   ├── prisma/                 # schema, migrations, seed
│   ├── src/
│   │   ├── modules/            # módulos de domínio
│   │   │   ├── auth/           # JWT + refresh + guards
│   │   │   ├── condominiums/
│   │   │   ├── blocks/
│   │   │   ├── residents/
│   │   │   ├── internal-users/
│   │   │   ├── conversations/
│   │   │   ├── occurrences/
│   │   │   ├── alerts/
│   │   │   ├── escalation-rules/
│   │   │   ├── dispatch-groups/
│   │   │   ├── business-hours/
│   │   │   ├── webhooks/       # WhatsApp Cloud API
│   │   │   ├── dashboard/      # KPIs
│   │   │   └── audit/
│   │   ├── common/             # filtros, guards, pipes globais
│   │   ├── app.controller.ts   # /health
│   │   └── main.ts
│   └── Dockerfile
├── frontend/                   # Next.js 16 App Router
│   ├── src/
│   │   ├── app/                # rotas
│   │   │   ├── login/
│   │   │   └── dashboard/      # área autenticada
│   │   ├── components/         # UI (shadcn/ui)
│   │   ├── lib/                # axios client, utils
│   │   └── store/              # Zustand
│   └── Dockerfile
├── docs/                       # PRD, deployment, regras de negócio
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Variáveis de ambiente

Veja [`.env.example`](./.env.example) para a lista completa. As principais:

| Variável | Descrição | Default |
|---|---|---|
| `DATABASE_URL` | Connection string Postgres | `postgresql://crm_user:crm_password@localhost:5432/crm_condominios` |
| `APP_PORT` | Porta do backend | `3001` |
| `JWT_SECRET` | Segredo do JWT | — (obrigatório em prod) |
| `JWT_REFRESH_SECRET` | Segredo do refresh token | — (obrigatório em prod) |
| `CORS_ORIGINS` | Origens permitidas (CSV) | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | URL da API exposta ao cliente | `http://localhost:3001` |
| `SEED_ADMIN_EMAIL` | Email do super admin no seed | `admin@crmcondominios.com` |
| `SEED_ADMIN_PASSWORD` | Senha do super admin no seed | `Admin@123456` |
| `WHATSAPP_PROVIDER` | `mock` ou `evolution` | `evolution` |
| `EVOLUTION_API_URL` | URL do servidor Evolution API | `http://localhost:8080` |
| `EVOLUTION_API_KEY` | Chave de acesso Evolution API | — |
| `GEMINI_API_KEY` | Chave de acesso Google Gemini | — |

---

## Endpoints principais

A documentação interativa está em **http://localhost:3001/api/docs** (Swagger).

| Recurso | Métodos | Caminho |
|---|---|---|
| Auth | `POST` | `/auth/login`, `/auth/refresh` |
| Auth | `GET` | `/auth/me` |
| Health | `GET` | `/health` |
| Condomínios | `GET POST PUT DELETE` | `/condominiums` |
| Moradores | `GET POST PUT DELETE` | `/residents` |
| Ocorrências | `GET POST PATCH` | `/occurrences` |
| Conversas | `GET POST` | `/conversations`, `/conversations/:id/messages` |
| Alertas | `GET PATCH` | `/alerts` |
| Regras de escalonamento | `GET POST PATCH` | `/escalation-rules` |
| Grupos de despacho | `GET POST PUT` | `/dispatch-groups` |
| Horário comercial | `GET PUT` | `/business-hours` |
| Webhook WhatsApp | `POST` | `/webhooks/whatsapp` |
| Dashboard | `GET` | `/dashboard/metrics` |
| Auditoria | `GET` | `/audit` |

Veja [docs/API_ENDPOINTS.md](./docs/API_ENDPOINTS.md) para o detalhamento completo.

---

## Documentação adicional

| Documento | Conteúdo |
|---|---|
| [PRD v1.2](./docs/PRD_CRM_Condominio_v1_2.md) | Documento de produto completo |
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Guia de implantação em produção (VPS e SaaS) |
| [API_ENDPOINTS.md](./docs/API_ENDPOINTS.md) | Catálogo completo de endpoints |
| [MULTI_TENANCY_RULES.md](./docs/MULTI_TENANCY_RULES.md) | Regras de isolamento por condomínio |
| [AUTOMATION_RULES.md](./docs/AUTOMATION_RULES.md) | Triagem, escalonamento e horário comercial |
| [WHATSAPP_INTEGRATION.md](./docs/WHATSAPP_INTEGRATION.md) | Integração com WhatsApp |
| [MVP_HANDOFF.md](./docs/MVP_HANDOFF.md) | Handoff técnico do MVP |
| [MVP_HOMOLOGATION_CHECKLIST.md](./docs/MVP_HOMOLOGATION_CHECKLIST.md) | Checklist de homologação |
| [VALIDATION_FOUNDATION.md](./docs/VALIDATION_FOUNDATION.md) | Validações e fundamentos |
| [NEXT_STEPS.md](./docs/NEXT_STEPS.md) | Próximos passos pós-MVP |

---

## Deploy

Duas estratégias homologadas:

1. **VPS única com Docker Compose** — DigitalOcean / Hetzner / EC2 + Nginx + Let's Encrypt.
2. **SaaS distribuído** — Frontend na Vercel, Backend no Render/Railway, Postgres gerenciado.

Detalhes completos em [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

---

## Licença

Projeto privado. Todos os direitos reservados.
