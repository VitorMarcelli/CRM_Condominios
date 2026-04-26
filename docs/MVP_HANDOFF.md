# Hand-off Técnico do MVP (CRM Condomínios)

Este documento foi elaborado para facilitar a transferência de conhecimento entre a equipe de desenvolvimento (Agentes) e o cliente/time interno, detalhando o estado atual do sistema no fechamento da **Fase 12**.

## 1. Visão Geral do Sistema
O **CRM Inteligente para Condomínios** é uma plataforma B2B multi-tenant focada na operação de zeladoria, segurança e relacionamento com moradores. Ele consolida conversas via WhatsApp, triagem automatizada de incidentes, registro de ocorrências e alertas de emergência.

## 2. Arquitetura e Stack
- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS, Lucide Icons, Shadcn UI (Radix).
- **Backend:** NestJS 10, Prisma ORM, JWT (Passport).
- **Banco de Dados:** PostgreSQL 16.
- **Cache/Fila:** Redis (preparado no Docker, pronto para adoção de filas com BullMQ).
- **Infraestrutura:** Containerizado (Docker / Docker Compose).

## 3. Módulos Implementados
1. **Autenticação & RBAC:** Suporte a Super Admin, Admin, Síndico, Zelador.
2. **Multi-Tenancy:** Isolamento estrito de dados por Condomínio (`condominiumId`).
3. **Gestão de Moradores e Unidades:** Estrutura base de residentes.
4. **Ocorrências e Categorias:** Controle de tickets e incidentes, com prioridades.
5. **Conversas e Mensagens:** Gestão de atendimento (Mock Webhook).
6. **Triagem Fora de Horário (Triage Engine):** NLP simples (NFD/regex) para classificar emergências com base nas regras do banco de dados.
7. **Alertas e Acionamentos:** Gatilhos automáticos, destinatários, e acknowledge/close de alertas críticos.
8. **Auditoria (AuditLog):** Rastreabilidade de ações críticas com payload de metadados.
9. **Dashboard Operacional:** Visualização de KPIs e atividades recentes.

## 4. Como Rodar Localmente (Demonstração)
```bash
# Na raiz do repositório
cp .env.example .env

# Subir os containers (Postgres, Redis, Backend, Frontend)
docker compose up -d --build

# O sistema fará as migrations e o seed automaticamente no backend.
```
- **Acesso Frontend:** `http://localhost:3000`
- **Acesso API:** `http://localhost:3001`
- **Swagger:** `http://localhost:3001/api/docs`
- **Health:** `http://localhost:3001/health`
- **Credenciais Mock:**
  - `admin@crmcondominios.com` / `Admin@123456` (Super Admin)
  - `sindico@flower.com` / `123456` (Síndico Mock - checar banco via prisma studio)

## 5. Limitações Atuais (Fora do Escopo do MVP)
- O Webhook do WhatsApp ainda é um provedor "Mock". Ele intercepta chamadas via POST `/webhooks/whatsapp` mas não interage com a rede real da Meta.
- O envio *outbound* para o WhatsApp do morador salva a mensagem no banco, mas não transmite ao dispositivo.
- Ausência de uploads físicos (S3/AWS) para anexos. O campo `mediaUrl` guarda apenas strings provisórias.

## 6. Observações de Segurança
- As rotas estão protegidas por `@UseGuards(AuthGuard('jwt'), RolesGuard)` e validam o papel do usuário logado e restrições de Tenant (condominiumId).
- Os secrets no `.env.example` foram expurgados de qualquer dado produtivo.
- O endpoint webhook requer idempotência via `externalId`, que já foi ativada.
- **Ação Requerida antes de Produção:** Alterar chaves de JWT e senhas do Postgres.

## 7. Próximos Passos Técnicos
- Escolher e assinar provedor (Z-API, Evolution, ou Cloud API).
- Implementar a classe concreta da Interface de Webhook criada no Plano de Integração.
- Integrar AWS S3 para os relatórios e anexos das ocorrências.
